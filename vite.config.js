import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'emit-markdown-previews',
      generateBundle() {
        for (const fileName of ['README.md', 'ROADMAP.md']) {
          this.emitFile({
            type: 'asset',
            fileName,
            source: readFileSync(fileURLToPath(new URL(`./${fileName}`, import.meta.url)), 'utf8'),
          });
        }
      },
    },
  ],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
