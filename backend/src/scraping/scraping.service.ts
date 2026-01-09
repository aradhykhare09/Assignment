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

    const crawler = new PlaywrightCrawler({
      headless: true,
      requestHandler: async ({ page, log }) => {
        log.info(`Processing ${page.url()}`);
        await page.waitForSelector('nav', { timeout: 10000 }).catch(() => log.warning('No nav found'));

        const categories = await page.evaluate(() => {
          const navLinks = Array.from(document.querySelectorAll('nav a'));
          return navLinks
            .map(link => {
              const anchor = link as HTMLAnchorElement;
              return {
                title: anchor.textContent?.trim() || '',
                url: anchor.href,
                slug: anchor.pathname.split('/').filter(Boolean).pop() || '',
              };
            })
            .filter(item => item.title && item.url && !item.url.includes('void(0)'));
        });

        log.info(`Found ${categories.length} navigation items.`);
        await Dataset.pushData({ type: 'categories', data: categories });
      },
    });

    await crawler.run(['https://www.worldofbooks.com/']);

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
          await page.waitForLoadState('networkidle', { timeout: 15000 });
        } catch (e) {
          log.warning('Wait for networkidle timeout, proceeding anyway');
        }

        const products = await page.evaluate(() => {
          // Heuristic: Find all <a> that contain an <img> and text with price
          const anchors = Array.from(document.querySelectorAll('a'));
          return anchors.map(a => {
            const img = a.querySelector('img');
            // Look for price pattern like £10.00
            const priceMatch = a.innerText.match(/[£$]\d+\.\d{2}/);

            if (img && priceMatch) {
              return {
                title: a.getAttribute('title') || a.innerText.split('\n')[0].trim(),
                price: priceMatch[0],
                imageUrl: img.src,
                sourceUrl: a.href,
                sourceId: a.href.split('/').pop()
              };
            }
            return null;
          }).filter(Boolean);
        });

        log.info(`Found ${products.length} products`);
        await Dataset.pushData({ type: 'products', data: products });
      },
      maxRequestsPerCrawl: 5, // Limit to prevent getting blocked too fast for assignments
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
