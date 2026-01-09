import { Injectable, Logger } from '@nestjs/common';
import { PlaywrightCrawler, Dataset } from 'crawlee';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class ScrapingService {
  private readonly logger = new Logger(ScrapingService.name);

  constructor(private readonly categoriesService: CategoriesService) { }

  async scrapeCategories() {
    this.logger.log('Starting category scrape...');

    // Clear previous default dataset to avoid stale data
    // await Dataset.open(); 

    const crawler = new PlaywrightCrawler({
      // Headless true for server environments
      headless: true,
      requestHandler: async ({ page, log }) => {
        log.info(`Processing ${page.url()}`);

        // Wait for the nav to be visible
        await page.waitForSelector('nav', { timeout: 10000 }).catch(() => log.warning('No nav found'));

        // Scrape navigation links - Looking for "Books" or similar top-level items
        // World of Books specific logic would go here.
        // We will grab all links inside the main navigation.
        const categories = await page.evaluate(() => {
          // Attempt to find the main menu
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

    // Process scraping results
    const dataset = await Dataset.open();
    const { items } = await dataset.getData();

    let count = 0;
    for (const item of items) {
      if (item.type === 'categories') {
        const cats = item.data as any[];
        for (const cat of cats) {
          // Simple validation to ensure it looks like a category (no empty slugs)
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
}
