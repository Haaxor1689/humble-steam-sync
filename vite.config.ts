import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx, defineManifest } from '@crxjs/vite-plugin';
import fs from 'fs-extra';

const packageJson = fs.readJSONSync('./package.json');

const manifest = defineManifest({
  manifest_version: 3,
  name: 'Steam tags for Humble Bundle',
  version: packageJson.version,
  description: packageJson.description,
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
    'https://humble-steam-sync.haaxor1689.dev/api/',
    'https://*.vercel.app/api/',
    'https://api.steampowered.com/ISteamApps/GetAppList/v2/'
  ]
});

export default defineConfig({
  plugins: [react(), crx({ manifest })]
});
