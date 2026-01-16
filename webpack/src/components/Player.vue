<template>
  <div
    ref="container"
    id="container"
    @mousedown="onMouseDown"
    @mouseup="onMouseUp"
  >
    <SvgScore
      @svgmounted="svgmounted"
      @svgrendered="svgrendered"
      @clickmeas="clickmeas"
      v-if="score && !waterfallMode"
      :score="score"
      ref="svgScore"
      :config="{display: 'onepage', showall: true, displayParam: {paged: paged, jianpu: jianpu, showVersion: showVersion, noPrintWatermark: noPrintWatermark, noPrintQrcode: noPrintQrcode}}"
      :lineh="lineh"
    >
      <template v-slot:background>
        <!-- 自定义背景，显示在最底层 -->
        <rect
          v-if="svgWidth!=0"
          :key="'background'"
          :x='0'
          :y='0'
          :width='svgWidth'
          :height='svgHeight'
          :fill="backgroundColor"
          :opacity="backgroundAlpha"
          class="noprint"
        />
        <template v-if="messyRects">
          <template v-for="(p,i) in messyRects">
            <g
              class="noprint"
              :key="'messyRects'+i"
            >
              <rect
                fill="#ffcccc"
                :x="p.x"
                :y="p.y-lineh*2"
                :width="p.width"
                :height="p.height+lineh*4"
              ></rect>

            </g>
          </template>
        </template>
        <template v-if="loopRects">
          <template v-for="(p,i) in loopRects">
            <g
              class="noprint"
              :key="'loopRects'+i"
            >
              <rect
                fill="#e6ffee"
                :x="p.x"
                :y="p.y"
                :width="p.width"
                :height="p.height"
              ></rect>

            </g>
          </template>
        </template>
      </template>
      <template v-slot:cursorbg>
        <!-- 自定义光标 -->
        <rect
          v-if="cursorPos && cursorPos.height != 0 && hideCursor !== true"
          v-bind="cursorPos"
          :width='lineh*1.5'
          :x='cursorPos.x'
          :y='cursorPos.y-lineh*2'
          :height="cursorPos.height+lineh*4"
          :rx='lineh*0.75'
          :ry='lineh*0.75'
          fill='rgba(251,121,127,0.6)'
          class='noprint'
        />
      </template>
      <template v-slot:foreground>
        <!-- 自定义前景，显示在曲谱前方 -->

        <template v-if="messy">
          <template v-for="(p,i) in messy">
            <g
              class="noprint"
              v-if="p.start"
              v-bind="p.start"
              :key="'messystart'+i"
            >
              <line
                stroke="#ee7487"
                :x1="p.start.x"
                :x2="p.start.x"
                :y1="p.start.y-lineh*4"
                :y2="p.start.y+p.start.height+lineh*4"
                :stroke-width="lineh*0.6"
              ></line>
              <line
                stroke="#ee7487"
                :x1="p.start.x"
                :x2="p.start.x+lineh*2"
                :y1="p.start.y-lineh*4"
                :y2="p.start.y-lineh*4"
                :stroke-width="lineh*0.6"
              ></line>
              <line
                stroke="#ee7487"
                :x1="p.start.x"
                :x2="p.start.x+lineh*2"
                :y1="p.start.y+p.start.height+lineh*4"
                :y2="p.start.y+p.start.height+lineh*4"
                :stroke-width="lineh*0.6"
              ></line>
            </g>

            <g
              class="noprint"
              v-if="p.end"
              v-bind="p.end"
              :key="'messyend'+i"
            >
              <line
                stroke="#ee7487"
                :x1="p.end.x"
                :x2="p.end.x"
                :y1="p.end.y-lineh*4"
                :y2="p.end.y+p.end.height+lineh*4"
                :stroke-width="lineh*0.6"
              ></line>
              <line
                stroke="#ee7487"
                :x1="p.end.x"
                :x2="p.end.x-lineh*2"
                :y1="p.end.y-lineh*4"
                :y2="p.end.y-lineh*4"
                :stroke-width="lineh*0.6"
              ></line>
              <line
                stroke="#ee7487"
                :x1="p.end.x"
                :x2="p.end.x-lineh*2"
                :y1="p.end.y+p.end.height+lineh*4"
                :y2="p.end.y+p.end.height+lineh*4"
                :stroke-width="lineh*0.6"
              ></line>

            </g>
          </template>
        </template>

        <g
          class="noprint"
          v-if="loopARect"
          v-bind="loopARect"
        >
          <line
            stroke="#77ebbf"
            :x1="loopARect.x-lineh*0.2"
            :x2="loopARect.x-lineh*0.2"
            :y1="loopARect.y"
            :y2="loopARect.y+loopARect.height"
            :stroke-width="lineh*0.6"
          ></line>
          <line
            stroke="#77ebbf"
            :x1="loopARect.x+lineh*0.5"
            :x2="loopARect.x+lineh*0.5"
            :y1="loopARect.y"
            :y2="loopARect.y+loopARect.height"
            :stroke-width="lineh*0.2"
          ></line>
          <line
            stroke="#77ebbf"
            :x1="loopARect.x+lineh*1.0"
            :x2="loopARect.x+lineh*1.0"
            :y1="loopARect.y+1.5*lineh"
            :y2="loopARect.y+1.5*lineh"
            :stroke-width="lineh*0.4"
            stroke-linecap="round"
          ></line>
          <line
            stroke="#77ebbf"
            :x1="loopARect.x+lineh*1.0"
            :x2="loopARect.x+lineh*1.0"
            :y1="loopARect.y+2.5*lineh"
            :y2="loopARect.y+2.5*lineh"
            :stroke-width="lineh*0.4"
            stroke-linecap="round"
          ></line>
          <line
            stroke="#77ebbf"
            :x1="loopARect.x+lineh*1.0"
            :x2="loopARect.x+lineh*1.0"
            :y1="loopARect.y+loopARect.height-2.5*lineh"
            :y2="loopARect.y+loopARect.height-2.5*lineh"
            :stroke-width="lineh*0.4"
            stroke-linecap="round"
          ></line>
          <line
            stroke="#77ebbf"
            :x1="loopARect.x+lineh*1.0"
            :x2="loopARect.x+lineh*1.0"
            :y1="loopARect.y+loopARect.height-1.5*lineh"
            :y2="loopARect.y+loopARect.height-1.5*lineh"
            :stroke-width="lineh*0.4"
            stroke-linecap="round"
          ></line>

        </g>

        <g
          class="noprint"
          v-if="loopBRect"
          v-bind="loopBRect"
        >
          <line
            stroke="#77ebbf"
            :x1="loopBRect.x+loopBRect.width+lineh*0.2"
            :x2="loopBRect.x+loopBRect.width+lineh*0.2"
            :y1="loopBRect.y"
            :y2="loopBRect.y+loopBRect.height"
            :stroke-width="lineh*0.6"
          ></line>
          <line
            stroke="#77ebbf"
            :x1="loopBRect.x+loopBRect.width-lineh*0.5"
            :x2="loopBRect.x+loopBRect.width-lineh*0.5"
            :y1="loopBRect.y"
            :y2="loopBRect.y+loopBRect.height"
            :stroke-width="lineh*0.2"
          ></line>
          <line
            stroke="#77ebbf"
            :x1="loopBRect.x+loopBRect.width-lineh*1.0"
            :x2="loopBRect.x+loopBRect.width-lineh*1.0"
            :y1="loopBRect.y+1.5*lineh"
            :y2="loopBRect.y+1.5*lineh"
            :stroke-width="lineh*0.4"
            stroke-linecap="round"
          ></line>
          <line
            stroke="#77ebbf"
            :x1="loopBRect.x+loopBRect.width-lineh*1.0"
            :x2="loopBRect.x+loopBRect.width-lineh*1.0"
            :y1="loopBRect.y+2.5*lineh"
            :y2="loopBRect.y+2.5*lineh"
            :stroke-width="lineh*0.4"
            stroke-linecap="round"
          ></line>
          <line
            stroke="#77ebbf"
            :x1="loopBRect.x+loopBRect.width-lineh*1.0"
            :x2="loopBRect.x+loopBRect.width-lineh*1.0"
            :y1="loopBRect.y+loopBRect.height-2.5*lineh"
            :y2="loopBRect.y+loopBRect.height-2.5*lineh"
            :stroke-width="lineh*0.4"
            stroke-linecap="round"
          ></line>
          <line
            stroke="#77ebbf"
            :x1="loopBRect.x+loopBRect.width-lineh*1.0"
            :x2="loopBRect.x+loopBRect.width-lineh*1.0"
            :y1="loopBRect.y+loopBRect.height-1.5*lineh"
            :y2="loopBRect.y+loopBRect.height-1.5*lineh"
            :stroke-width="lineh*0.4"
            stroke-linecap="round"
          ></line>

        </g>

        <g class="noprint">
          <template v-for="(indicator,key) in noteIndicators">
            <template v-if="indicator.result==1">
              <image
                :x="indicator.pos.x"
                :y="indicator.pos.y - lineh * 3"
                :width="lineh*1.5"
                :height="lineh*1.5"
                href="../assets/correct.svg"
                :key="'indicator'+key"
              />
            </template>
            <template v-if="indicator.result==0">
              <image
                :x="indicator.pos.x"
                :y="indicator.pos.y - lineh * 3"
                :width="lineh*1.5"
                :height="lineh*1.5"
                href="../assets/wrong.svg"
                :key="'indicator'+key"
              />
            </template>
          </template>
        </g>
        <g v-if="musScore && covered">
          <defs>
            <linearGradient
              id="gradient_start"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop
                offset="0%"
                :style="'stop-color:'+backgroundColor+';stop-opacity:0'"
              />
              <stop
                offset="50%"
                :style="'stop-color:'+backgroundColor+';stop-opacity:0.8'"
              />
              <stop
                offset="70%"
                :style="'stop-color:'+backgroundColor+';stop-opacity:1'"
              />
              <stop
                offset="100%"
                :style="'stop-color:'+backgroundColor+';stop-opacity:1'"
              />
            </linearGradient>
            <linearGradient
              id="gradient_main"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop
                offset="0%"
                :style="'stop-color:'+backgroundColor+';stop-opacity:1'"
              />
              <stop
                offset="70%"
                :style="'stop-color:'+backgroundColor+';stop-opacity:1'"
              />
              <stop
                offset="100%"
                :style="'stop-color:'+backgroundColor+';stop-opacity:1'"
              />
            </linearGradient>
          </defs>

          <template v-for="(p,i) in musScore.pages">
            <template v-if="i==0">
              <rect
                v-bind:key="'shadow'+i"
                :width="p.w"
                :height="p.h"
                :x="p.x"
                :y="p.y"
                style="fill:url(#gradient_start);"
              />
            </template>
            <template v-else-if="i>0">
              <rect
                v-bind:key="'shadow'+i"
                :width="p.w"
                :height="p.h"
                :x="p.x"
                :y="p.y"
                style="fill:url(#gradient_main);"
              />
            </template>
          </template>
        </g>
      </template>
    </SvgScore>
    <canvas
      class="waterfall"
      ref="waterfall"
      v-show="score && waterfallMode"
    ></canvas>
    <!-- <img class="center" src="../assets/loading.svg" /> -->

  </div>
</template>

<style>
@font-face {
  font-family: Aloisen New;
  src: url("../assets/fonts/Music Font.woff") format("woff");
}
@page {
  size: auto; /* auto is the initial value */
  margin: 0mm;
}
* {
  moz-user-select: -moz-none;
  -moz-user-select: none;
  -o-user-select: none;
  -khtml-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
html {
  background-color: #ffffff;
  margin: 0px; /* this affects the margin on the html before sending to printer */
}

body {
  margin: 0mm; /* margin you want for the content */
}
.waterfall {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background-color: antiquewhite;
  overflow: hidden;
  z-index: -1;
}
.center {
  text-align: center; /*让div内部文字居中*/
  background-color: #fff;
  border-radius: 20px;
  width: 200px;
  height: 200px;
  margin: auto;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
@media print {
  .noprint {
    display: none;
  }
  .print {
    display: block;
  }
}
@media screen {
  .print {
    display: none;
  }
}
</style>

<script>
import Vue from "vue";
import { SvgScore } from "../js/xmlscore.esm.min.js";
import Controller from "../js/Controller";
const tinycolor = require("tinycolor2");

export default {
  name: "Player",
  components: {
    SvgScore,
  },
  props: [
    "ccmz",
    "showVersion",
    "noPrintWatermark",
    "noPrintQrcode",
    "defaultJianpu",
    "defaultReadingMode",
    "defaultWaterfallMode",
    "defaultDisableTouchSeek",
    "defaultLocked",
    "defaultCovered",
    "defaultBackgroundColor",
    "appVersion",
  ],
  data(opts) {
    console.log(
      "client size:" + document.documentElement.clientWidth,
      ",",
      document.documentElement.clientHeight
    );

    console.log("loading " + this.ccmz);

    let color = opts.defaultBackgroundColor
      ? opts.defaultBackgroundColor
      : "FFFFFF00";

    let tinyColor = tinycolor(color);
    let backgroundColor = tinyColor.toHexString();
    let backgroundAlpha = tinyColor.getAlpha();
    console.log(
      "backgroundColor:",
      backgroundColor,
      ",backgroundAlpha:",
      backgroundAlpha
    );

    return {
      paged: true,
      lineh: 10,
      score: null,
      musScore: null,
      cursorPos: null,
      hideCursor: false,
      loopARect: null,
      loopBRect: null,
      loopRects: null,
      waterfallMode: opts.defaultWaterfallMode,
      noteIndicators: {},
      svgWidth: 0,
      svgHeight: 0,
      backgroundColor: backgroundColor,
      backgroundAlpha: backgroundAlpha,
      messy: null,
      messyRects: null,
      locked: opts.defaultLocked,
      covered: opts.defaultCovered,
      jianpu: opts.defaultJianpu,
      readingMode: opts.defaultReadingMode
    };
  },
  mounted() {
    const viewCallback = {
      showCursor: (cursor) => {
        if (cursor !== undefined) {
          this.cursorPos = cursor;
        } else {
          this.hideCursor = false;
        }
      },
      hideCursor: () => {
        this.hideCursor = true;
      },
      showLoop: (rects) => {
        if(Array.isArray(rects)){
          this.loopARect = rects[0];
          this.loopBRect = rects[rects.length - 1];
          this.loopRects = rects
        }else if(rects){
          this.loopARect = rects
          this.loopBRect = null
          this.loopRects = null
        } else {
          this.loopARect = null
          this.loopBRect = null
          this.loopRects = null
        }
      },
      onWaterfallMode: (waterfallMode) => {
        this.waterfallMode = waterfallMode;
      },
      onClearIndicator: () => {
        this.noteIndicators = {};
        this.messy = [];
        this.messyRects = [];
      },
      onSetIndicator: (key, indicator) => {
        Vue.set(this.noteIndicators, key, indicator);
      },
      onSetIndicators: (indicators, messy, messyRects) => {
        this.noteIndicators = indicators;
        this.messy = messy;
        this.messyRects = messyRects;
      },
      onSetBackgroundColor: (color) => {
        let bk = tinycolor(color);
        this.backgroundColor = bk.toHexString();
        this.backgroundAlpha = bk.getAlpha();
      },
      onCovered: (covered) => {
        this.covered = covered;
      },
      onSetJianpuMode: (jianpu) => {
        this.jianpu = jianpu
      },
      onSetReadingMode: (readingMode) => {
        this.readingMode = readingMode
      }
    };
    this.controller = new Controller(this, viewCallback, this.appVersion);
    this.controller.setWaterfallMode(this.waterfallMode);
    this.controller.setLocked(this.defaultLocked);
    this.controller.setCovered(this.defaultCovered);
    this.controller.disableTouchSeek(this.defaultDisableTouchSeek);
    if (this.ccmz) {
      this.controller.readTextFile(
        this.ccmz,
        this.readingMode,
        this.onDataCallback
      );
    }
    this.controller.setDataCallback(this.onDataCallback);

    window.Player = this.controller;
  },
  methods: {
    // onTouchStart(event) {
    //   this.controller.onTouchStart(event);
    // },
    // onTouchEnd(event) {
    //   this.controller.onTouchEnd(event);
    // },
    onDataCallback(score) {
      let firstInit = this.score == null;
      if (!firstInit) {
        this.score = null;
        this.$refs.svgScore.setScore(score);
        this.$nextTick(function () {
          this.score = score;
        });
      } else {
        this.score = score;
      }
      this.$nextTick(function () {
        this.musScore = this.$refs.svgScore.musScore;
        this.controller.updateState({ inited: 1 }, "inited");
        this.controller.setWaterfall(this.$refs.waterfall);
      });
    },
    onMouseDown(event) {
      this.controller.onMouseDown(event);
    },
    onMouseUp(event) {
      this.controller.onMouseUp(event);
    },
    svgmounted() {
      console.log("svgmounted");
      this.controller.setSvgScore(this.$refs.svgScore);
      this.svgWidth = this.$refs.svgScore.musScore.page.w + 2;
      this.svgHeight = this.$refs.svgScore.musScore.page.h;
    },
    svgrendered() {
      console.log("svgrendered");
    },
    clickmeas(click) {
      this.controller.clickmeas(click);
    },
  },
};
</script>
