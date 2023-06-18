import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx, defineManifest } from '@crxjs/vite-plugin';
import fs from 'fs-extra';

const packageJson = fs.readJSONSync('./package.json');
const { host_permissions, matches } = fs.readJSONSync('./permissions.json');

const manifest = defineManifest({
  manifest_version: 3,
  name: 'Steam tags for Humble Bundle',
  version: packageJson.version,
  description: packageJson.description,
  icons: { '128': 'assets/icon.png' },
  background: { service_worker: 'src/worker/index.ts', type: 'module' },
  action: { default_popup: 'index.html' },
  content_scripts: [{ js: ['src/content/main.tsx'], matches }],
  permissions: ['storage'],
  host_permissions
});

export default defineConfig({
  plugins: [react(), crx({ manifest })]
});
