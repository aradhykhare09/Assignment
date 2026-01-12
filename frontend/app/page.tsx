import Navbar from '@/components/Navbar';
import ScrapeButton from '@/components/ScrapeButton';
import { fetchCategories } from '@/lib/api';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';

// Force dynamic rendering - don't try to fetch at build time
export const dynamic = 'force-dynamic';

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
    const result = await fetchCategories();
    // Ensure we have an array
    categories = Array.isArray(result) ? result : [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    categories = [];
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
                      <p className="text-4xl font-bold text-indigo-600 mt-2" suppressHydrationWarning>
                        {categories.length}
                      </p>
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
              <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 cursor-pointer">
                <p className="text-gray-500">No categories found. Click &quot;Refresh Categories&quot; to scrape.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {categories.map((category, index) => {
                  // Different gradient colors for visual variety
                  const gradients = [
                    'from-indigo-500 to-purple-600',
                    'from-pink-500 to-rose-600',
                    'from-cyan-500 to-blue-600',
                    'from-emerald-500 to-teal-600',
                    'from-orange-500 to-amber-600',
                    'from-violet-500 to-purple-600',
                    'from-sky-500 to-indigo-600',
                    'from-fuchsia-500 to-pink-600',
                  ];
                  const gradient = gradients[index % gradients.length];

                  return (
                    <Link
                      key={category._id}
                      href={`/category/${category.slug}`}
                      className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                      {/* Gradient Header */}
                      <div className={`h-32 bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}>
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-20">
                          <div className="absolute top-2 left-2 w-8 h-8 border-2 border-white rounded-lg rotate-12"></div>
                          <div className="absolute bottom-4 right-4 w-6 h-6 border-2 border-white rounded-lg -rotate-12"></div>
                          <div className="absolute top-8 right-8 w-4 h-4 border-2 border-white rounded-full"></div>
                        </div>
                        {/* Book Icon */}
                        <div className="relative bg-white/20 backdrop-blur-sm rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300">
                          <BookOpen className="h-10 w-10 text-white" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                          {category.title}
                        </h3>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {category.productCount || 0} books
                          </span>
                          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

          </div>
        </section>
      </main>
    </div>
  );
}
