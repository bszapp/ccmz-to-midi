import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "ccmz解析工具",
  base: '/ccmz-to-midi/',
  description: "将虫虫钢琴的曲谱转为midi、pdf以及MusicXML格式",
  sitemap: {
    hostname: 'https://bszapp.github.io/ccmz-to-midi/'
  },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: './icon.svg' }],
    ['meta', { name: 'msvalidate.01', content: '7AB62A6B31DABE1426A6CA8A9A79B9C1' }], //bing搜索标记
    ['meta', { name: 'google-site-verification', content: 'k-YeEKOHqLjM7MthjtXn8fPvYLjqy9wNq0EJEfxiwMM' }] //google搜索标记
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
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
  }
})

//cd .vitepress/dist
//npm run docs:build; npm run docs:preview
//gitc -; git push -u origin 2-docs