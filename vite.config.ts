import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Robustly find the API Key:
  // 1. Check API_KEY (standard for this app)
  // 2. Check VITE_API_KEY (standard Vite convention, in case user added it that way)
  // 3. Fallback to empty string
  const apiKey = env.API_KEY || env.VITE_API_KEY || '';
  const groqApiKey = env.GROQ_API_KEY || env.VITE_GROQ_API_KEY || '';

  return {
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY for the browser build
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.GROQ_API_KEY': JSON.stringify(groqApiKey)
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