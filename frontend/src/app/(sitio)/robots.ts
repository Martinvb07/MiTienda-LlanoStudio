import type { MetadataRoute } from 'next'

/** robots.txt de la web de Mi Sitio. Las tiendas tienen el suyo propio. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/panel', '/api/'] },
    sitemap: 'https://misitio.llanostudio.co/sitemap.xml',
  }
}
