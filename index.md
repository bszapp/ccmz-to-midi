---
layout: home

hero:
  name: "ccmz解析工具"
  text: "将虫虫钢琴的曲谱转为midi/PDF格式"
  tagline: "基于网页JS实现，完全在浏览器中运行"
  image:
    src: /icon.svg
    alt: logo
    class: logo
    style: "max-width: 240px; max-height: 240px;"
  actions:
    - theme: brand
      text: Github 项目地址
      link: https://github.com/bszapp/ccmz-to-midi/
    - theme: alt
      text: 如何获取ccmz文件？
      link: /how-to-get
    - theme: alt
      text: 转换后如何使用
      link: /how-to-use

features:
  - title: 专注内容
    details: 只需 Markdown 即可轻松创建美观的文档站点。
  - title: 享受 Vite 无可比拟的体验
    details: 服务器即时启动，闪电般的热更新，还可以使用基于 Vite 生态的插件。
  - title: 使用 Vue 自定义
    details: 直接在 Markdown 中使用 Vue 语法和组件，或者使用 Vue 组件构建自定义主题。
  - title: 速度真的很快！
    details: 采用静态 HTML 实现快速的页面初次加载，使用客户端路由实现快速的页面切换导航。
---

<div class="_container">
  <App />
  <div class="_warning-box">
  
::: warning 免责声明

请确保你已经购买此曲谱或已经开通vip再转换，转换后的文件**仅供个人学习使用**，请勿传播，造成后果概不负责。

尊重版权，支持正版音乐。如果你支持创作者，请在平台购买正版曲谱。

:::

  </div>
</div>

<style>
  ._container {
  display: flex;
  flex-direction: column;
  margin-bottom: 32px;
}

@media (min-width: 960px) {
  ._container {
    flex-direction: row;
    align-items: flex-start;
  }
  
  ._container > * {
    flex: 1;
  }
}
</style>