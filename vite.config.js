import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.js'),
      name: 'vanillaJs',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.es' : 'index.cjs'),
    },
    rollupOptions: {
      external: [],
    },
  },
});
