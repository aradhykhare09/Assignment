import Navbar from '@/components/Navbar';
import ScrapeButton from '@/components/ScrapeButton';
import { fetchCategories } from '@/lib/api';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

// Define the type for a Category based on what the API returns
interface Category {
  _id: string;
  title: string;
  slug: string;
  url: string;
  productCount?: number;
}

export default async function Home() {
  // Fetch categories server-side
  let categories: Category[] = [];
  try {
    categories = await fetchCategories();
  } catch (error) {
    console.error('Error fetching categories:', error);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <Navbar />

      <main>
        {/* Hero Section */}
        <div className="relative isolate overflow-hidden">
          <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
            <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0 lg:pt-8">
              <h1 className="mt-10 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
                Explore the World of Books
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                Data scraped on-demand correctly and ethically. Browse thousands of titles from our real-time product explorer.
              </p>
              <div className="mt-10 flex items-center gap-x-6">
                <a
                  href="#categories"
                  className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Start Exploring
                </a>
                <a href="#" className="hidden text-sm font-semibold leading-6 text-gray-900 dark:text-white">
                  Learn more <span aria-hidden="true">→</span>
                </a>
                <ScrapeButton />
              </div>
            </div>

            {/* Decorative Image/Pattern */}
            <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mt-0 lg:mr-0 lg:max-w-none lg:flex-none xl:ml-32">
              <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
                <div className="-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4">
                  <div className="rounded-md bg-white p-6 shadow-2xl dark:bg-gray-900">
                    <div className="text-center p-10">
                      <p className="text-gray-500">Live Scraper Stats</p>
                      <p className="text-4xl font-bold text-indigo-600 mt-2">{categories.length}</p>
                      <p className="text-sm text-gray-400">Categories Indexed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <section id="categories" className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Browse by Category</h2>
              <ScrapeButton />
            </div>

            {categories.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500">No categories found. Click "Refresh Categories" to scrape.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
                {categories.map((category) => (
                  <div key={category._id} className="group relative">
                    <div className="aspect-[4/3] w-full overflow-hidden rounded-md bg-gray-200 lg:aspect-none group-hover:opacity-75 lg:h-40 flex items-center justify-center">
                      {/* Placeholder for category image since we don't scrape it yet */}
                      <span className="text-4xl">📚</span>
                    </div>
                    <div className="mt-4 flex justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          <Link href={`/category/${category.slug}`}>
                            <span aria-hidden="true" className="absolute inset-0" />
                            {category.title}
                          </Link>
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">{category.productCount || 0} products</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-600" />
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </section>
      </main>
    </div>
  );
}
