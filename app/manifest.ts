import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Revigion',
    short_name: 'Revigion',
    description: 'Spaced-repetition revision tracker',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFEF9D',
    theme_color: '#111110',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
