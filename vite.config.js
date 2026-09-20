import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    watch: {
      ignored: [
        '**/public/**',
        '**/raw_assets/**',
        '**/archive/**',
        '**/*.mp4',
        '**/*.png',
        '**/*.jpg',
        '**/*.jpeg',
        '**/.git/**'
      ]
    }
  }
});
