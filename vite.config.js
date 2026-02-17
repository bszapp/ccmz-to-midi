import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
    plugins: [
        react(),
        nodePolyfills({
            // 必须包含这个，因为 xmlbuilder2 寻找 global 变量
            globals: {
                Buffer: true,
                global: true,
                process: true,
            },
        }),
    ],
    build: {
        // 1. 禁用 CSS 代码分割，让 CSS 也合并进 JS (或者使用 vite-plugin-css-injected-by-js)
        cssCodeSplit: false,
        rollupOptions: {
            output: {
                // 2. 强制打包成单文件，不自动拆分 vendor（第三方库）
                manualChunks: undefined,
                // 3. 配置输出文件名，不带 hash，方便外部引入
                entryFileNames: `assets/bundle.js`,
                chunkFileNames: `assets/[name].js`,
                assetFileNames: `assets/[name].[ext]`,
            },
        },
    },
})