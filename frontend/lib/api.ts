const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function fetchCategories() {
    console.log('Fetching categories from:', `${API_BASE_URL}/categories`);
    try {
        const res = await fetch(`${API_BASE_URL}/categories`, {
            next: { revalidate: 0 }, // Disable cache to see live data
        });

        if (!res.ok) {
            console.error('Fetch failed:', res.status, res.statusText);
            throw new Error('Failed to fetch categories');
        }

        const data = await res.json();
        console.log('Categories fetched:', data.length);
        return data;
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

export async function fetchProducts(categorySlug?: string) {
    let url = `${API_BASE_URL}/products`;
    if (categorySlug) {
        url += `?category=${categorySlug}`;
    }
    const res = await fetch(url, { cache: 'no-store' }); // Always fetch fresh data for now
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
}

export async function scrapeProducts(categorySlug: string) {
    const res = await fetch(`${API_BASE_URL}/scraping/products/${categorySlug}`, {
        method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to scrape products');
    return res.json();
}
