import Link from 'next/link';
import { Search, ShoppingCart, Menu, BookOpen } from 'lucide-react';

export default function Navbar() {
    return (
        <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-black/80">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-2">
                    <Link href="/" className="flex items-center gap-2 text-xl font-bold text-indigo-600 dark:text-indigo-400">
                        <BookOpen className="h-6 w-6" />
                        <span>BookExplorer</span>
                    </Link>
                </div>

                <div className="hidden md:flex flex-1 items-center justify-center px-8">
                    <div className="relative w-full max-w-md">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            placeholder="Search for books, authors..."
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <ShoppingCart className="h-5 w-5" />
                    </button>
                    <button className="md:hidden rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <Menu className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </nav>
    );
}
