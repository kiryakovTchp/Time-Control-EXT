import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: 'src/ui/popup/index.html',
        options: 'src/ui/options/index.html',
        background: 'src/bg/index.ts',
        diag: 'src/ui/diag/index.html'
      },
      output: { 
        entryFileNames: (chunkInfo: any) => {
          return chunkInfo.name === 'background' ? 'background.js' : 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo: any) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    },
    copyPublicDir: true
  },
  publicDir: 'public'
});
