<template>
  <div id="app">

    <Player
      v-if="ccmz"
      :ccmz="ccmz"
      :defaultJianpu="jianpu"
      :defaultReadingMode="readingMode"
      :defaultWaterfallMode="waterfallMode"
      :defaultLocked="locked"
      :defaultCovered="covered"
      :defaultDisableTouchSeek="disableTouchSeek"
      :defaultBackgroundColor="backgroundColor"
      @onUpdateState="onUpdateState"
      ref="player"
    >
    </Player>
  </div>
</template>
<style>
@media screen {
  html {
    background-color: rgba(0, 0, 0, 0);
  }
}
@media print {
  html {
    background-color: #ffffff;
  }
}
</style>
<script>
import Player from "../../components/Player";

export default {
  name: "App",
  components: {
    Player,
  },
  data() {
    let name = this.getQueryString("name");
    name = name ? decodeURIComponent(name) : "test";
    let url = this.getQueryString("url");
    url = url ? decodeURIComponent(url) : undefined;
    let ccmzFile = url ? url : "./test/" + name + ".ccmz";

    let readingMode = this.getQueryString("readingMode");
    readingMode = readingMode == "true" ? true : false;

    let jianpu = this.getQueryString("jianpuMode");
    jianpu = jianpu == "true" ? 1 : parseInt(jianpu);

    let waterfallMode = this.getQueryString("waterfallMode");
    waterfallMode = waterfallMode == "true" || waterfallMode == "1" ? 1 : 0;

    let disableTouchSeek = this.getQueryString("disableTouchSeek");
    disableTouchSeek = disableTouchSeek == "true" ? true : false;

    let locked = this.getQueryString("locked");
    locked = locked == "true" ? true : false;

    let covered = this.getQueryString("covered");
    covered = covered == "true" ? true : false;

    let backgroundColor = this.getQueryString("backgroundColor");

    return {
      ccmz: ccmzFile,
      jianpu: jianpu,
      readingMode: readingMode,
      waterfallMode: waterfallMode,
      disableTouchSeek: disableTouchSeek,
      locked: locked,
      covered: covered,
      backgroundColor: backgroundColor
    };
  },
  mounted() {},
  methods: {
    getQueryString(name) {
      var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
      var r = window.location.search.substr(1).match(reg); //search,查询？后面的参数，并匹配正则
      if (r != null) return decodeURIComponent(r[2]);
      return null;
    },
    toFixed2(number) {
      return number < 10 ? "0" + number : number;
    },
    onUpdateState(data) {
      if (data.name == "inited" && data.data.inited == 2)
        window.parent.postMessage({ message: "onPlayerInited" }, "*");
    },
  },
};
</script>
