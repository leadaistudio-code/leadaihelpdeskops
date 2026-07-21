import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/', 
        '/admin/', 
        '/api/',
        '/incidents/',
        '/assets/',
        '/catalog/',
        '/cmdb/',
        '/dex/',
        '/approvals/',
        '/knowledge/new',
        '/problems/',
        '/reports/',
        '/search/'
      ],
    },
    sitemap: 'https://leadaistudio.ai/sitemap.xml',
  };
}
