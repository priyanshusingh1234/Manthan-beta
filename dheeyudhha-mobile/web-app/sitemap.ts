import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: 'https://manthan-beta-c975.vercel.app',
            lastModified: new Date(),
            changeFrequency: 'always',
            priority: 1,
        },
        {
            url: 'https://manthan-beta-c975.vercel.app/feed',
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 0.8,
        },
        {
            url: 'https://manthan-beta-c975.vercel.app/top-brains',
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 0.8,
        },
    ]
}
