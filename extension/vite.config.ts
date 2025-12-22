import path from 'node:path';

import { crx, defineManifest } from '@crxjs/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import pkg from './package.json';
import { host_permissions, matches } from './src/permissions';

const manifest = defineManifest({
	manifest_version: 3,
	name: 'Steam tags for Humble Bundle',
	version: pkg.version,
	description: pkg.description,
	icons: { 128: 'public/logo.png' },
	background: { service_worker: 'src/worker/index.ts', type: 'module' },
	action: { default_popup: 'src/popup/index.html' },
	content_scripts: [{ js: ['src/content/main.tsx'], matches }],
	permissions: ['storage'],
	host_permissions
});

export default defineConfig({
	resolve: { alias: { '@': `${path.resolve(__dirname, 'src')}` } },
	plugins: [react(), tailwindcss(), crx({ manifest })],
	server: { cors: { origin: [/chrome-extension:\/\//] } }
});
