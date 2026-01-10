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
        const uniqueCats: any[] = [];
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
          // Auto-scroll to bottom to trigger lazy loading
          let previousHeight = 0;
          while (true) {
            const currentHeight = await page.evaluate<number>('document.body.scrollHeight');
            if (currentHeight === previousHeight) break;
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            await page.waitForTimeout(1000);
            previousHeight = currentHeight;
            // Limit scroll to avoid infinite loops on huge pages
            if (currentHeight > 20000) break;
          }
          await page.waitForLoadState('networkidle', { timeout: 10000 });
        } catch (e) {
          log.warning('Scroll/Wait failed, proceeding with what we have');
        }

        const products = await page.evaluate(() => {
          const items: any[] = [];

          // Strategy: Find all images that are likely book covers
          const images = Array.from(document.querySelectorAll('img'));

          for (const img of images) {
            // Filter out small icons/logos
            if (img.width < 50 || img.height < 50) continue;

            // Traverse up to find a container that might be the product card
            let container = img.parentElement;
            let foundPrice: string | null = null;
            let foundTitle: string | null = null;
            let foundLink: string | null = null;
            let foundAuthor: string | null = null;

            // Look up to 5 levels up
            for (let i = 0; i < 5; i++) {
              if (!container) break;

              const text = container.innerText || '';
              const priceMatch = text.match(/([£$€]\d+(\.\d{2})?)/);

              if (priceMatch && !foundPrice) {
                foundPrice = priceMatch[0];
              }

              // Check for link
              if (container.tagName === 'A') {
                foundLink = (container as HTMLAnchorElement).href;
              } else {
                const link = container.querySelector('a');
                if (link) foundLink = link.href;
              }

              // Try to find title (usually typically H3, H4 or text that isn't price)
              // Just use the link title or alt text for now as fallback
              if (foundLink) {
                // Check if container has enough text
                const lines = text.split('\n').filter(l => l.trim().length > 0);
                if (lines.length > 0) {
                  // Heuristic: Title is typically first line, Author is often second line if it starts with "by" or "By"
                  // Or sometimes just the second line if it looks like a name

                  foundTitle = lines.find(l => l.length > 5 && !l.includes('£') && !l.includes('Add to')) || null;

                  // Try to find author
                  const authorLine = lines.find(l => l.toLowerCase().startsWith('by ') || l.match(/^[A-Z][a-z]+ [A-Z][a-z]+$/));
                  if (authorLine) {
                    foundAuthor = authorLine.replace(/^by /i, '').trim();
                  }
                }
              }

              if (foundPrice && foundLink) {
                break;
              }

              container = container.parentElement;
            }

            if (foundPrice && foundLink && !items.find(x => x.sourceUrl === foundLink)) {
              items.push({
                title: foundTitle || img.alt || 'Unknown Book',
                price: foundPrice,
                imageUrl: img.src,
                sourceUrl: foundLink,
                sourceId: foundLink.split('/').filter(x => x).pop() || 'unknown-' + Math.random(),
                author: foundAuthor || ''
              });
            }
          }

          return items;
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
          // Ensure valid sourceId and title
          if (p && p.title && p.sourceUrl && p.sourceId && p.sourceId.trim() !== '') {
            try {
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
            } catch (e) {
              this.logger.warn(`Failed to upsert product ${p.title}: ${e.message}`);
            }
          }
        }
      }
    }
    this.logger.log(`Product scrape finished. Upserted ${count} products.`);
    return { success: true, count };
  }
}
