import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { copyFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'fs';

import { cloudflare } from "@cloudflare/vite-plugin";

// 构建后钩子：把 data/ 目录拷贝到 dist/data/
function copyDataDir() {
  return {
    name: 'copy-data-dir',
    closeBundle() {
      const src = path.resolve(__dirname, 'data');
      const dest = path.resolve(__dirname, 'dist', 'data');
      if (!existsSync(src)) return;
      function copyRecursive(srcDir: string, destDir: string) {
        mkdirSync(destDir, { recursive: true });
        for (const entry of readdirSync(srcDir)) {
          const s = path.join(srcDir, entry);
          const d = path.join(destDir, entry);
          if (statSync(s).isDirectory()) copyRecursive(s, d);
          else copyFileSync(s, d);
        }
      }
      copyRecursive(src, dest);
      console.log('[vite] data/ → dist/data/ copied');
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), copyDataDir(), cloudflare()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});