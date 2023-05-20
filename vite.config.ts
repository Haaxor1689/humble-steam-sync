import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx, defineManifest } from '@crxjs/vite-plugin';

const manifest = defineManifest({
  manifest_version: 3,
  version: '1.5',
  name: 'Steam tags for Humble Bundle',
  description:
    'Show your library and wishlist games from Steam on Humble Bundle pages.',
  icons: { '128': 'assets/icon.png' },
  background: { service_worker: 'src/worker/index.ts', type: 'module' },
  action: { default_popup: 'index.html' },
  content_scripts: [
    {
      js: ['src/content/main.tsx'],
      matches: [
        'https://*.humblebundle.com/membership/*',
        'https://*.humblebundle.com/games/*',
        'https://*.humblebundle.com/software/*',
        'https://*.humblebundle.com/home/keys*',
        'https://*.humblebundle.com/home/library*',
        'https://*.humblebundle.com/store*'
      ]
    }
  ],
  permissions: ['storage'],
  host_permissions: [
    'https://store.steampowered.com/dynamicstore/userdata/',
    'https://humble-steam-sync.haaxor1689.dev/api/*/games',
    'https://api.steampowered.com/ISteamApps/GetAppList/v2/'
  ]
});

export default defineConfig({
  plugins: [react(), crx({ manifest })]
});
