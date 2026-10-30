import type { MetadataRoute } from 'next'

/**
 * robots.txt de la web de Mi Sitio y el panel. Next sólo lo admite en la raíz
 * de app/; en las tiendas el middleware reescribe /robots.txt al de cada una.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/panel', '/api/'] },
    sitemap: 'https://misitio.llanostudio.co/sitemap.xml',
  }
}
