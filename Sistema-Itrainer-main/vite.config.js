import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// JSX em arquivos .js: configura esbuild p/ tratar .js como JSX (compat com codebase CRA).
export default defineConfig({
  plugins: [
    react({
      include: /.*\.jsx?$/,
    }),
  ],
  server: {
    port: 3000,
    open: false,
  },
  preview: {
    port: 3000,
  },
  build: {
    outDir: 'build',
    sourcemap: false,
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
});
