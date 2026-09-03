import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  base: './', // Chemins relatifs : permet le déploiement sur GitHub Pages (/maths-assistant/) ou tout autre sous-répertoire
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Permet d'écouter sur toutes les interfaces réseau (0.0.0.0)
  },
});
