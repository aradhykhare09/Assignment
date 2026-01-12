const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface Category {
    _id: string;
    title: string;
    slug: string;
    url: string;
    productCount?: number;
}

export interface Product {
    _id: string;
    title: string;
    price: string;
    author?: string;
    imageUrl?: string;
    sourceUrl: string;
    categorySlug?: string;
}

export interface PaginatedProducts {
    products: Product[];
    total: number;
    page: number;
    totalPages: number;
}

export async function fetchCategories(): Promise<Category[]> {
    try {
        const res = await fetch(`${API_BASE_URL}/categories`, {
            cache: 'no-store',
        });

        if (!res.ok) {
            console.error('Fetch categories failed:', res.status);
            return [];
        }

        const data = await res.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

export async function scrapeCategories() {
    const res = await fetch(`${API_BASE_URL}/scraping/categories`, {
        method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to scrape categories');
    return res.json();
}

export async function fetchProducts(categorySlug?: string, page: number = 1, limit: number = 50, search?: string): Promise<PaginatedProducts> {
    try {
        const params = new URLSearchParams();
        if (categorySlug) params.append('category', categorySlug);
        if (search) params.append('search', search);
        params.append('page', page.toString());
        params.append('limit', limit.toString());

        const url = `${API_BASE_URL}/products?${params.toString()}`;
        const res = await fetch(url, { cache: 'no-store' });

        if (!res.ok) {
            return { products: [], total: 0, page: 1, totalPages: 0 };
        }

        return res.json();
    } catch (error) {
        console.error('Error fetching products:', error);
        return { products: [], total: 0, page: 1, totalPages: 0 };
    }
}

export async function scrapeProducts(categorySlug: string) {
    try {
        const res = await fetch(`${API_BASE_URL}/scraping/products/${categorySlug}`, {
            method: 'POST',
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Scrape products failed:', res.status, errorText);
            throw new Error(`Failed to scrape: ${res.status}`);
        }
        return res.json();
    } catch (error) {
        console.error('Scrape products error:', error);
        throw error;
    }
}
