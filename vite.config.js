import { defineConfig } from 'vite';

export default defineConfig({
  base: '/threejs-car-combat/', // Replace 'my-threejs-app' with your GitHub repository name
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __BUILD_NUMBER__: JSON.stringify(process.env.VITE_BUILD_NUMBER  || '1'),
  },
});