import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    watch: {
      ignored: ['**/narrative_scroll/**', '**/*.mp4', '**/.git/**', '**/asset_karakter/**', '**/asset/**']
    }
  }
});
