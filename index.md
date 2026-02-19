---
layout: home

hero:
  name: "ccmz解析工具"
  text: "将虫虫钢琴的曲谱转为 midi/PDF/MusicXML"
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
  - title: 全参数midi导出
    icon: 🎹
    details: 不仅导出音符，还完整保留力度变化、踏板信息多音轨结构与速度变化。生成的 MIDI 文件可直接导入 MuseScore 及各类瀑布流播放器，用于编辑、练习与分析。
  - title: 1:1矢量还原PDF曲谱
    icon: 🎯
    details: 基于客户端解析脚本封装，实现谱面排版、音乐符号与指法标注的精准还原，客户端与网页端显示效果一致。支持高清矢量输出，适合打印与多设备清晰浏览。
  - title: MusicXML转换
    icon: 🎼
    details: 高保真还原多声部、多谱表、多乐器的和弦、节奏、延音、踏板等信息,支持换行分页。支持强弱、速度与文本标记，生成文件可直接在 MuseScore 等软件中二次编辑。
  - title: 代码开源本地运行
    icon: 🛠️
    details: 解析与转换逻辑完全基于前端JS实现，无需后台服务器支持。项目已在GitHub开源，可本地部署、离线环境运行。
---

<div class="_container">
  <div id="app-main"></div>
  <div class="_warning-box">
  
::: warning 使用须知

由于ccmz文件可能来源于付费曲谱，本工具无法区分，使用本工具前请务必确保你已经开通VIP或者已经购买过此曲谱。

转换文件**仅限个人学习、研究与练习使用**，请勿传播或进行任何可能涉及版权风险的行为。**严禁二次修改、分发及商业用途**，因不当使用产生的后果由用户自行承担。

我们尊重并支持每一位音乐创作者。若您支持作者，请通过官方渠道购买正版曲谱，以实际行动支持作者，鼓励更多优秀作品被创作。

:::

  </div>
</div>

<style>
._container {
  display: flex;
  flex-direction: column;
  padding: 16px 0;
}

@media (min-width: 960px) {
  ._container {
    flex-direction: row;
    align-items: stretch;
    gap: 16px;
  }
  
  #app-main {
    padding: 32px 0;
  }

  #app-main, ._warning-box {
    flex: 1;
  }
  
  #app-main > .no-print,
  #app-main > .no-print > div {
    height: 100% !important;
    margin: 0 !important;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
}

#app-main > .no-print > div[style*="margin: 16px"] {
  margin: 8px !important;
}






#app-main > .no-print > div[style*="margin: 16px"] {
  margin: 0 !important;
  display: flex !important;
  justify-content: space-between !important;
}

#app-main > .no-print > div[style*="margin: 16px"] > div:first-child {
  margin-top: auto !important;
}

#app-main > .no-print > div[style*="margin: 16px"] button {
  margin-top: auto !important;
  margin-bottom: auto !important;
}

</style>