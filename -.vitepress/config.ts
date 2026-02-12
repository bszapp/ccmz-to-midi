import { defineConfig } from 'vitepress'
import react from '@vitejs/plugin-react'

export default defineConfig({
  title: "ccmz解析工具",
  description: "将虫虫钢琴的曲谱转为midi格式以及pdf格式",
  themeConfig: {
    nav: [
      { text: '主页', link: '/' },
      { text: '教程', link: '/how-to-get' }
    ],
    sidebar: [
      {
        text: '教程',
        items: [
          { text: '如何获取ccmz文件', link: '/how-to-get' },
          { text: '如何使用转换后的文件', link: '/how-to-use' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/bszapp/ccmz-to-midi/' }
    ]
  },
  vite: {
    plugins: [
      react()
    ],
    optimizeDeps: {
      include: ['react', 'react-dom']
    },
    esbuild: {
      loader: 'tsx',
      include: /src\/.*\.tsx?$/
    }
  }
})