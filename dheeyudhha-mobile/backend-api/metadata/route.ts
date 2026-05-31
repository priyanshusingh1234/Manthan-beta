import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const urlParam = req.nextUrl.searchParams.get('url');
        if (!urlParam) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const url = new URL(urlParam);

        // Fetch HTML content
        const response = await fetch(url.toString(), {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Extract metadata
        const title = 
            $('meta[property="og:title"]').attr('content') || 
            $('meta[name="twitter:title"]').attr('content') || 
            $('title').text() || 
            '';

        const description = 
            $('meta[property="og:description"]').attr('content') || 
            $('meta[name="twitter:description"]').attr('content') || 
            $('meta[name="description"]').attr('content') || 
            '';

        let image = 
            $('meta[property="og:image"]').attr('content') || 
            $('meta[name="twitter:image"]').attr('content') || 
            $('link[rel="image_src"]').attr('href') || 
            '';

        // Resolve relative image URLs
        if (image && !image.startsWith('http')) {
            image = new URL(image, url.origin).toString();
        }

        return NextResponse.json({
            title: title.trim(),
            description: description.trim(),
            image: image.trim(),
            url: url.toString(),
            domain: url.hostname.replace('www.', '')
        });
    } catch (error: any) {
        console.error('[Metadata API Error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
