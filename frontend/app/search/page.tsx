import { fetchProducts } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { Search } from 'lucide-react';

interface Product {
    _id: string;
    title: string;
    price: string;
    author?: string;
    imageUrl?: string;
    sourceUrl: string;
    categorySlug?: string;
}

export default async function SearchPage({
    searchParams
}: {
    searchParams: Promise<{ q?: string }>
}) {
    const { q: query } = await searchParams;

    let products: Product[] = [];
    let total = 0;

    if (query && query.trim()) {
        try {
            const result = await fetchProducts(undefined, 1, 50, query);
            products = result.products || [];
            total = result.total || 0;
        } catch (e) {
            console.error('Search error:', e);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black">
            <Navbar />
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
                {/* Search Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
                        <Search className="h-8 w-8 text-indigo-500" />
                        Search Results
                    </h1>
                    {query && (
                        <p className="mt-2 text-gray-500">
                            {total > 0 ? (
                                <>Found <span className="text-white font-semibold">{total}</span> results for "<span className="text-indigo-400">{query}</span>"</>
                            ) : (
                                <>No results found for "<span className="text-indigo-400">{query}</span>"</>
                            )}
                        </p>
                    )}
                </div>

                {!query ? (
                    <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                        <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Enter a search term</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Search for books by title or author name
                        </p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                        <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No books found</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Try different keywords or browse categories
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            Browse Categories
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
                        {products.map((product) => (
                            <div key={product._id} className="group relative bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md transition">
                                <div className="aspect-[2/3] w-full overflow-hidden bg-gray-200 group-hover:opacity-75 lg:aspect-[2/3] lg:h-80 relative">
                                    {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.title}
                                            className="h-full w-full object-cover object-center lg:h-full lg:w-full"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center bg-gray-300 dark:bg-gray-700">
                                            <span className="text-gray-500">No Image</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                                        {product.title}
                                    </h3>
                                    {product.author && (
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{product.author}</p>
                                    )}
                                    {product.categorySlug && (
                                        <Link
                                            href={`/category/${product.categorySlug}`}
                                            className="mt-1 text-xs text-indigo-400 hover:text-indigo-300 block"
                                        >
                                            {product.categorySlug.replace(/-/g, ' ')}
                                        </Link>
                                    )}
                                    <p className="mt-2 text-lg font-semibold text-indigo-600 dark:text-indigo-400">{product.price}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
