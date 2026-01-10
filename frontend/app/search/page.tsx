import { fetchProducts } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

interface Product {
    _id: string;
    title: string;
    price: string;
    author?: string;
    imageUrl?: string;
    sourceUrl: string;
}

// In Next.js 15, searchParams is async prop
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q: string }> }) {
    const { q } = await searchParams;
    let products: Product[] = [];

    // Fetch products
    try {
        if (q) {
            // We need to update fetchProducts to support search
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const res = await fetch(`${apiUrl}/products?search=${encodeURIComponent(q)}`, { cache: 'no-store' });
            if (res.ok) products = await res.json();
        }
    } catch (e) {
        console.error(e);
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black">
            <Navbar />
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
                <div className="mb-8">
                    <Link href="/" className="text-sm text-gray-500 hover:text-white mb-2 block">← Back to Home</Link>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Search Results for "{q}"
                    </h1>
                </div>

                {products.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-500 text-lg">No books found matching "{q}".</p>
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
                                        <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400">No Image</div>
                                    )}
                                </div>
                                <div className="p-4 flex flex-col justify-between h-40">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                                            <a href={product.sourceUrl} target="_blank" rel="noopener noreferrer">
                                                <span aria-hidden="true" className="absolute inset-0" />
                                                {product.title}
                                            </a>
                                        </h3>
                                        {product.author && (
                                            <p className="mt-1 text-sm text-gray-500">{product.author}</p>
                                        )}
                                    </div>
                                    <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{product.price}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
