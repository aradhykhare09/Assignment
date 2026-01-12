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

    // Clear dataset after processing
    await dataset.drop();

    this.logger.log(`Category scrape finished. Upserted ${count} categories.`);
    return { success: true, count };
  }

  async scrapeProducts(categorySlug: string) {
    this.logger.log(`Starting product scrape for category: ${categorySlug}`);

    try {
      const category = await this.categoriesService.findBySlug(categorySlug);
      if (!category || !category.url) {
        this.logger.error(`Category not found or has no URL: ${categorySlug}`);
        return { success: false, count: 0, error: `Category not found: ${categorySlug}` };
      }

      this.logger.log(`Scraping URL: ${category.url}`);

      const crawler = new PlaywrightCrawler({
        headless: true,
        navigationTimeoutSecs: 60,
        requestHandler: async ({ page, log }) => {
          log.info(`Processing ${page.url()}`);

          try {
            // Wait for content to load
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(3000); // Give JS time to render

            // Auto-scroll to trigger lazy loading
            for (let i = 0; i < 5; i++) {
              await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
              await page.waitForTimeout(1000);
            }

            // Wait for images to load
            await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => { });
          } catch (e) {
            log.warning('Page load/scroll issue, proceeding anyway');
          }

          // Debug: Log what we find
          const debugInfo = await page.evaluate(() => {
            return {
              title: document.title,
              allLinks: document.querySelectorAll('a').length,
              allImages: document.querySelectorAll('img').length,
              productLinks: document.querySelectorAll('a[href*="/products/"]').length,
              hasPrice: (document.body.textContent || '').includes('£'),
            };
          });
          log.info(`Page debug: ${JSON.stringify(debugInfo)}`);

          const products = await page.evaluate(() => {
            const items: any[] = [];
            const seenUrls = new Set<string>();

            // Strategy 1: Look for World of Books specific product cards first
            const productSelectors = [
              '.main-product-card',  // World of Books specific!
              '.grid__item',         // World of Books grid items
              '[data-product]',
              '.product-card',
              '.product-item',
              '.product',
              'article',
            ];

            let productElements: Element[] = [];
            for (const selector of productSelectors) {
              const found = document.querySelectorAll(selector);
              if (found.length > 3) {
                productElements = Array.from(found);
                break;
              }
            }

            // Strategy 2: If no product containers, find all links with product URLs
            if (productElements.length === 0) {
              const links = document.querySelectorAll('a[href*="/products/"]');
              productElements = Array.from(links);
            }

            // Strategy 3: Find all cards that contain both image and price
            if (productElements.length === 0) {
              const allDivs = document.querySelectorAll('div, article, li');
              productElements = Array.from(allDivs).filter(div => {
                const hasImg = div.querySelector('img');
                const hasPrice = (div.textContent || '').match(/[£$€]\d/);
                const hasLink = div.querySelector('a');
                return hasImg && hasPrice && hasLink;
              });
            }

            // Process found product containers
            for (const el of productElements) {
              try {
                const img = el.querySelector('img');

                // World of Books uses .product-card anchor for title and URL
                const productCardLink = el.querySelector('a.product-card') as HTMLAnchorElement;
                const link = productCardLink || el.querySelector('a[href*="/products/"]') || el.querySelector('a') as HTMLAnchorElement;

                if (!link) continue;

                const href = link.href;
                if (!href || seenUrls.has(href)) continue;
                if (!href.includes('/products/')) continue; // Only product links
                seenUrls.add(href);

                // Get title - from .product-card link text, or fallback
                let title = '';
                if (productCardLink) {
                  title = productCardLink.innerText?.trim() || '';
                }
                if (!title) {
                  const titleEl = el.querySelector('h2, h3, h4, [class*="title"], [class*="name"]');
                  title = titleEl?.textContent?.trim() || '';
                }
                if (!title && img?.alt) {
                  title = img.alt;
                }

                title = title.split('\n')[0].trim();
                if (!title || title.length < 3) continue;

                if (title.toLowerCase().includes('add to') ||
                  title.toLowerCase().includes('view all') ||
                  title.toLowerCase().includes('basket') ||
                  title.toLowerCase().includes('cart')) continue;

                // World of Books uses .author class
                const authorEl = el.querySelector('.author, .truncate-author, [class*="author"]');
                const author = authorEl?.textContent?.trim() || '';

                // World of Books uses .price-item class
                const priceEl = el.querySelector('.price-item, .price-item--sale, .price-item--regular');
                let price = priceEl?.textContent?.trim() || '';
                if (!price) {
                  // Fallback: find price in text
                  const text = el.textContent || '';
                  const priceMatch = text.match(/([£$€]\s?\d+(?:\.\d{2})?)/);
                  price = priceMatch ? priceMatch[0] : '£0.00';
                }

                items.push({
                  title: title,
                  price: price.replace(/\s/g, ''),
                  imageUrl: img?.src || '',
                  sourceUrl: href,
                  sourceId: href.split('/').filter(x => x).pop() || `id-${Math.random().toString(36).substr(2, 9)}`,
                  author: author
                });
              } catch (e) {
                // Skip
              }
            }

            // Strategy 4 (ULTIMATE FALLBACK): Find ALL anchor tags that have an image inside
            if (items.length === 0) {
              const allAnchors = document.querySelectorAll('a');
              for (const a of allAnchors) {
                const href = (a as HTMLAnchorElement).href;
                if (!href.includes('/products/') && !href.includes('/collections/')) continue;
                if (href.includes('/cart') || href.includes('/account')) continue;
                if (seenUrls.has(href)) continue;

                const img = a.querySelector('img');
                if (!img) continue;

                const title = img.alt || a.textContent?.trim() || '';
                if (!title || title.length < 5) continue;

                seenUrls.add(href);
                items.push({
                  title: title.split('\n')[0].trim().substring(0, 100),
                  price: '£0.00', // Price not found, placeholder
                  imageUrl: img.src,
                  sourceUrl: href,
                  sourceId: href.split('/').filter(x => x).pop() || `id-${Math.random().toString(36).substr(2, 9)}`,
                  author: ''
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
            // Only require title and sourceUrl - generate sourceId if missing
            if (p && p.title && p.sourceUrl) {
              try {
                // Generate sourceId from URL if not present
                const sourceId = p.sourceId || p.sourceUrl.split('/').filter((x: string) => x).pop() || `gen-${Date.now()}`;

                await this.productsService.upsert({
                  title: p.title,
                  price: p.price || '£0.00',
                  sourceUrl: p.sourceUrl,
                  imageUrl: p.imageUrl || '',
                  author: p.author || '',
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

      // IMPORTANT: Clear dataset after each scrape to prevent data mixing
      await dataset.drop();

      this.logger.log(`Product scrape finished. Upserted ${count} products for ${categorySlug}.`);
      return { success: true, count };
    } catch (error) {
      this.logger.error(`Error scraping products for ${categorySlug}: ${error.message}`);
      return { success: false, count: 0, error: error.message };
    }
  }
}
