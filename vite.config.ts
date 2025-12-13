import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY for the browser build
      // Default to empty string if undefined to prevent 'process is not defined' error
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    },
    build: {
      // Increase the warning limit to 1000kb (1MB) to handle large libraries like Recharts
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // Manually split large vendor libraries into separate chunks
          manualChunks: {
            vendor: ['react', 'react-dom'],
            charts: ['recharts'],
            ui: ['lucide-react'],
            ai: ['@google/genai']
          }
        }
      }
    }
  };
});