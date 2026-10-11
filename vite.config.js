import {defineConfig} from 'vite';
export default defineConfig({server:{port:5177,proxy:{'/socket':{target:'ws://127.0.0.1:3017',ws:true},'/health':{target:'http://127.0.0.1:3017'}}},build:{target:'es2022',chunkSizeWarningLimit:2600,rollupOptions:{output:{manualChunks:{physics:['@dimforge/rapier3d-compat'],graphics:['three']}}}}});
