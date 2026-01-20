import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        port: 3000,
        proxy: {
            '/auth': 'http://127.0.0.1:8005',
            '/students': 'http://127.0.0.1:8005',
            '/courses': 'http://127.0.0.1:8005',
            '/attendance': 'http://127.0.0.1:8005',
            '/dashboard': 'http://127.0.0.1:8005',
            '/users': 'http://127.0.0.1:8005'
        }
    }
});
