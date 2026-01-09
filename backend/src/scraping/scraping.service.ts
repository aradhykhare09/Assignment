import { Injectable, Logger } from '@nestjs/common';
import { PlaywrightCrawler, Dataset } from 'crawlee';
import { CategoriesService } from '../categories/categories.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class ScrapingService {
  private readonly logger = new Logger(ScrapingService.name);

  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly productsService: ProductsService,
  ) { }

  async scrapeCategories() {
    this.logger.log('Starting category scrape...');

    // Clear previous default dataset to avoid stale data
    // await Dataset.open(); 

    const crawler = new PlaywrightCrawler({
      headless: true,
      requestHandler: async ({ page, log }) => {
        log.info(`Processing ${page.url()}`);

        // Wait for body to settle
        try {
          await page.waitForLoadState('domcontentloaded');
        } catch (e) { }

        const categories = await page.evaluate(() => {
          // Find all links to collections (categories)
          const allLinks = Array.from(document.querySelectorAll('a[href*="/collections/"]'));

          return allLinks
            .map(link => {
              const anchor = link as HTMLAnchorElement;
              const title = anchor.innerText?.split('\n')[0].trim(); // Get first line of text
              if (!title || title.length > 30 || title.includes('View all') || title.includes('GBP')) return null;

              return {
                title: title,
                url: anchor.href,
                slug: anchor.pathname.split('/').filter(Boolean).pop() || '',
              };
            })
            .filter(item => item !== null);
        });

        // Deduplicate based on slug
        const uniqueCats = [];
        const seen = new Set();
        for (const c of categories) {
          if (!seen.has(c.slug)) {
            seen.add(c.slug);
            uniqueCats.push(c);
          }
        }

        log.info(`Found ${uniqueCats.length} navigation items.`);
        await Dataset.pushData({ type: 'categories', data: uniqueCats });
      },
    });

    await crawler.run(['https://www.worldofbooks.com/']);

    // Process scraping results
    const dataset = await Dataset.open();
    const { items } = await dataset.getData();

    let count = 0;
    for (const item of items) {
      if (item.type === 'categories') {
        const cats = item.data as any[];
        for (const cat of cats) {
          if (cat.slug && cat.title) {
            await this.categoriesService.upsert({
              title: cat.title,
              slug: cat.slug,
              url: cat.url,
              lastScrapedAt: new Date()
            });
            count++;
          }
        }
      }
    }

    this.logger.log(`Category scrape finished. Upserted ${count} categories.`);
    return { success: true, count };
  }

  async scrapeProducts(categorySlug: string) {
    this.logger.log(`Starting product scrape for category: ${categorySlug}`);

    const category = await this.categoriesService.findBySlug(categorySlug);
    if (!category || !category.url) {
      throw new Error(`Category not found or has no URL: ${categorySlug}`);
    }

    const crawler = new PlaywrightCrawler({
      headless: true,
      requestHandler: async ({ page, log }) => {
        log.info(`Processing ${page.url()}`);

        try {
          await page.waitForLoadState('networkidle', { timeout: 20000 });
        } catch (e) {
          log.warning('Wait for networkidle timeout, proceeding anyway');
        }

        const products = await page.evaluate(() => {
          // FALLBACK STRATEGY: Find all links that look like products
          // Product links usually contain: numeric ID or keywords, and are inside grid items
          // Let's grab all A tags that contain an IMG and have some text (title).

          const anchors = Array.from(document.querySelectorAll('a'));
          return anchors.map(a => {
            const img = a.querySelector('img');
            // Price check is tricky if dynamic, let's look for currency symbols in the Text content of the anchor OR its parent
            const parentText = a.parentElement?.innerText || '';
            const anchorText = a.innerText;
            const combinedText = anchorText + ' ' + parentText;

            const priceMatch = combinedText.match(/([£$€]\d+(\.\d{2})?)/);

            // Simple filter: must have image and likely a price
            if (img && priceMatch) {
              return {
                title: (a.getAttribute('title') || img.getAttribute('alt') || a.innerText).trim(),
                price: priceMatch[0],
                imageUrl: img.src,
                sourceUrl: a.href,
                sourceId: a.href.split('/').pop(),
                author: '' // hard to scrape generically
              };
            }
            return null;
          }).filter(p => p && p.title.length > 2 && !p.title.includes('Item added') && !p.title.includes('cart'));
        });

        log.info(`Found ${products.length} products`);
        await Dataset.pushData({ type: 'products', data: products });
      },
      maxRequestsPerCrawl: 5,
    });

    await crawler.run([category.url]);

    const dataset = await Dataset.open();
    const { items } = await dataset.getData();

    let count = 0;
    for (const item of items) {
      if (item.type === 'products') {
        for (const p of (item.data as any[])) {
          if (p && p.title && p.sourceUrl) {
            await this.productsService.upsert({
              title: p.title,
              price: p.price,
              sourceUrl: p.sourceUrl,
              imageUrl: p.imageUrl,
              author: p.author,
              lastScrapedAt: new Date(),
              categorySlug: categorySlug,
            });
            count++;
          }
        }
      }
    }
    this.logger.log(`Product scrape finished. Upserted ${count} products.`);
    return { success: true, count };
  }
}
