'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { scrapeProducts } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function ScrapeProductsButton({ slug }: { slug: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleScrape = async () => {
        try {
            setLoading(true);
            await scrapeProducts(slug);
            router.refresh();
        } catch (error) {
            console.error('Product scraping failed', error);
            alert('Failed to scrape products. Check console.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleScrape}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Fetching Books...' : 'Refresh Books'}
        </button>
    );
}
