import { defineConfig } from 'vite';
import { execSync } from "child_process";

export default defineConfig({
  base: '/threejs-car-combat/', // Replace 'my-threejs-app' with your GitHub repository name
  define: {
    __BUILD_COMMIT__ :  JSON.stringify(execSync("git rev-parse --short HEAD").toString().trim()),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __BUILD_NUMBER__: JSON.stringify(execSync("git rev-list --count HEAD").toString().trim()),
  },
});