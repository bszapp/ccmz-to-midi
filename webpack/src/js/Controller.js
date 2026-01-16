import MidiPlayer from "./MidiPlayer";
import NativeMidiPlayer from "./NativeMidiPlayer";
import Signal from "./Signal";
const JSZip = require("jszip");
const base64js = require('base64-js')
const tinycolor = require("tinycolor2");

export default class Controller {
  constructor(vue, viewCallback, appVersion) {
    this.vue = vue
    this.viewCallback = viewCallback
    this.signal = new Signal(vue)
    this.nativeMode = false
    this.colorIds = new Map()
    this.appVersion = parseInt(appVersion)
    if (isNaN(this.appVersion)) this.appVersion = 0
    let SELF = this
    window.addEventListener("resize", () => {
      console.log("onResize");
      if (SELF.svgScore) {
        SELF.svgScore.onrotate();
        SELF.vue.$nextTick(() => {
          SELF.refreshPosition()
        });
      }
    }, false);
    window.onorientationchange = () => {
      if (SELF.svgScore) {
        SELF.svgScore.onrotate();
        SELF.vue.$nextTick(() => {
          SELF.refreshPosition()
        });
      }
    };
    this.setUserScrollDisabled(false);
  }
  isFromApp() {
    return this.signal.isApp()
  }
  setSvgScore(svgScore) {
    this.svgScore = svgScore
    // this.onSvgRender()
  }
  setWaterfall(waterfall) {
    this.waterfall = waterfall
    if (this.player) {
      this.player.setWaterfall(this.waterfall)
      this.player.setWaterfallMode(this.waterfallMode)
    }
    this.setWaterfallMode(this.waterfallMode)
  }
  setWaterfallMode(waterfallMode) {
    this.waterfallMode = waterfallMode
    this.updateState({ waterfallMode: this.waterfallMode }, "waterfallMode");
    if (this.viewCallback) {
      this.viewCallback.onWaterfallMode(this.waterfallMode)
    }
    if (this.player) {
      this.player.setWaterfallVisible(this.waterfallMode)
    }
  }
  getWaterfallMode() {
    return this.waterfallMode
  }
  readTextFile(file, readingMode, callback) {
    if (!this.signal.isValidDomain()) return

    this.readingMode = readingMode
    let SELF = this
    var rawFile = new XMLHttpRequest();
    rawFile.responseType = "arraybuffer";
    rawFile.open("GET", file, true);
    rawFile.onload = () => {
      console.log("reading ccmz ok:", new Date().getTime());
      SELF.readCCMZ(rawFile.response, callback);
    };
    // 请求出错
    rawFile.onerror = () => {
      console.log("request error:", rawFile.status, ",", rawFile.statusText);
    };
    rawFile.send();
  }
  readCCMZ(buffer, callback) {
    let version = (new Uint8Array(buffer.slice(0, 1)))[0];
    console.log("ccmz version:", version);
    let data = new Uint8Array(buffer.slice(1))
    if (version == 1) {
      JSZip.loadAsync(data).then((zip) => {
        zip
          .file("data.ccxml")
          .async("string")
          .then((json) => {
            let score = JSON.parse(json);
            callback(score)
            zip
              .file("data.ccmid")
              .async("string")
              .then((json) => {
                this.initPlayer(json)
              });
          });
      });
    } else if (version == 2) {
      data = data.map((value) => {
        return value % 2 == 0 ? value + 1 : value - 1
      })
      JSZip.loadAsync(data).then((zip) => {
        zip
          .file("score.json")
          .async("string")
          .then((json) => {
            let score = JSON.parse(json);
            callback(score)
            zip
              .file("midi.json")
              .async("string")
              .then((json) => {
                this.initPlayer(json)
              });
          });
      });
    }
  }

  setDataCallback(callback) {
    this.callback = callback
  }

  setupXml(data) {
    let bytes = base64js.toByteArray(data)
    var json = new TextDecoder("utf-8").decode(bytes);
    let score = JSON.parse(json);
    if (this.callback)
      this.callback(score)
    this.player = new NativeMidiPlayer(this.signal)
    this.nativeMode = true
    if (this.svgScore) {
      this.updateState(
        { pageCount: this.svgScore.getPages().length },
        "pageCount"
      );
    }
    // this.player.refreshState("inited", 1);
  }
  initPlayer(json) {
    let SELF = this
    this.player = new MidiPlayer(
      (data, name) => {
        SELF.onStateCallback(data, name)
      },
      (measure, notes) => {
        SELF.onMeasureCallback(measure, notes)
      },
      (state, note, track) => {
        SELF.onNoteCallback(state, note, track)
      },
      (measureIndex, noteIndex, percent) => {
        SELF.onCursorCallback(measureIndex, noteIndex, percent)
      }
    );
    this.nativeMode = false
    this.player.init(JSON.parse(json))
    if (this.waterfall) {
      this.player.setWaterfall(this.waterfall)
      this.player.setWaterfallVisible(this.waterfallMode)
    }

    if (this.svgScore) {
      this.updateState(
        { pageCount: this.svgScore.getPages().length },
        "pageCount"
      );
    }

    if (this.readingMode) {
      this.player.refreshState("inited", 2);
    } else {
      this.player.refreshState("inited", 1);
      // this.svgScore.showCursor(0, 0, 0);
      console.log("loadsoundfont");
      this.player.loadSoundfont();
    }
  }

  isPlayerReady() {
    return !this.readingMode && this.player && this.player.ready()
  }

  onMeasureCallback(measure, notes) {
    this.signal.send("onMeasureCallback", {
      measure: measure,
      notes: notes,
    });
  }
  onNoteCallback(state, note, track) {
    this.signal.send("onNoteCallback", {
      state: state,
      note: note,
      track: track,
    });
  }
  updateState(data, name) {
    this.signal.send("onUpdateState", { data: data, name: name });
  }
  // onSvgRender(){
  //   this.updateState({ inited: 2 }, "inited")
  // }
  onStateCallback(data, name) {
    if (name == "inited") {
      console.log("inited");
      // this.svgScore.showCursor(0, 0, 0);
      // if (data.inited == 1) {
      // this.loadSoundfont()
      // }
    }
    this.updateState(data, name);
  }

  onCursorCallback(measureIndex, noteIndex, percent) {
    if (measureIndex == -1) {
      this.showCursor(-1, 0, 0)
      window.scrollTo(0, 0)
      this.lastPos = null
      return
    }
    let pos = this.showCursor(
      measureIndex,
      noteIndex,
      percent
    );

    let visible = pos != null || pos != undefined

    this.signal.send("onUpdateCursor", {
      visible: visible,
      measureIndex: measureIndex,
      noteIndex: noteIndex,
      percent: percent,
      x: visible ? pos.x * this.svgScore.musScore.scale : 0,
      y: visible ? pos.y * this.svgScore.musScore.scale : 0,
      width: visible ? pos.width * this.svgScore.musScore.scale : 0,
      height: visible ? pos.height * this.svgScore.musScore.scale : 0
    });

    if (pos && (!this.lastPos || this.lastPos.y != pos.y) && !(this.autoScrollDisabled && measureIndex > 0)) {
      this.scrollToCursor(pos);
      this.lastPos = pos;
    }
  }
  onScrollToMeasure(measureIndex) {
    if (measureIndex == -1) {
      window.scrollTo(0, 0)
      return
    }
    let pos = this.svgScore.musScore.posOf(measureIndex, -1, 0)
    if (pos && (!this.lastPos || this.lastPos.y != pos.y) && !(this.autoScrollDisabled && measureIndex > 0)) {
      this.scrollToCursor(pos);
      this.lastPos = pos;
    }
  }
  getOffsetTop(el) {
    return el.offsetParent ? el.offsetTop + this.getOffsetTop(el.offsetParent) : el.offsetTop
  }
  scrollToCursor(measurePos, animate = true) {
    let offsetY = this.getOffsetTop(this.svgScore.$el.parentElement);
    let firstMeasurePos = this.svgScore.getMeasureRect(0);
    let target = offsetY +
      (measurePos.y - firstMeasurePos.y) * this.svgScore.musScore.scale;
    if (Math.abs(window.orientation) % 180 == 90) {
      console.log("orientation=", window.orientation);
      console.log("scale=", this.svgScore.musScore.scale);
      console.log(
        "document.documentElement.clientHeight=",
        document.documentElement.clientHeight
      );
      target = offsetY +
        measurePos.y * this.svgScore.musScore.scale -
        (document.documentElement.clientHeight -
          measurePos.height * this.svgScore.musScore.scale) /
        2;
    }
    target = Math.max(0, target);
    if (!this.scrolling) {
      if (animate) this.scrollAnimation(window.scrollY, target);
      else window.scrollTo(0, target);
    }
  }
  scrollAnimation(currentY, targetY) {
    // 获取当前位置方法
    // const currentY = document.documentElement.scrollTop || document.body.scrollTop

    // 计算需要移动的距离
    let needScrollTop = targetY - currentY;
    let _currentY = currentY;
    setTimeout(() => {
      // 一次调用滑动帧数，每次调用会不一样
      const dist = Math.ceil(needScrollTop / 10);
      _currentY += dist;
      window.scrollTo(0, currentY);
      // 如果移动幅度小于十个像素，直接移动，否则递归调用，实现动画效果
      if (needScrollTop > 10 || needScrollTop < -10) {
        this.scrolling = true
        this.scrollAnimation(_currentY, targetY);
      } else {
        this.scrolling = false
        window.scrollTo(0, targetY);
      }
    }, 1);
  }

  refreshPosition() {
    if (this.lastPos) {
      this.scrollToCursor(this.lastPos, false);
    }
  }
  playOrPause() {
    if (this.player.isPlaying()) {
      this.player.pausePlay();
    } else {
      // this.player.mute(2)
      // this.player.mute(3)
      this.player.startPlay();
    }
  }
  startPlay() {
    if (this.player && !this.player.isPlaying()) {
      this.player.startPlay();
    }
  }
  pausePlay() {
    if (this.player && this.player.isPlaying()) {
      this.player.pausePlay();
    }
  }
  isPlaying() {
    return this.player ? this.player.isPlaying() : false;
  }

  onTouchStart(event) {
    this.svgScore.onTouchStart(event);
  }
  onTouchEnd(event) {
    this.svgScore.onTouchEnd(event);
  }
  onMouseDown(event) {
    this.svgScore.onMouseDown(event);
  }
  onMouseUp(event) {
    this.svgScore.onMouseUp(event);
  }
  clickmeas(click) {
    console.log("touched measure, locked:", this.locked, ",covered:", this.covered);
    if (click == undefined || this.userClickDisabled) return;
    if (!this.loopABStep && !this.userSeekDisabled) {
      this.player.placeTo(click.mm, click.nn);
      this.showCursor(click.mm, click.nn, 0);
      return;
    }
    if (this.nativeMode && this.appVersion < 1)
      this.loopAbClick(click)
    else
      this.loopAbClickNew(click)
  }
  loopAbClick(click) {
    if (this.loopABStep == 1) {
      this.loopABStart = click;
      let rect = this.svgScore.getMeasureRect(click.mm)
      this.viewCallback.showLoop(rect)
      this.loopABStep = 2
      this.updateState({ loopABStep: this.loopABStep }, "loopABStep");
    } else if (this.loopABStep == 2) {
      this.loopABEnd = click;
      let min = this.loopABStart.mm < this.loopABEnd.mm || this.loopABStart.mm == this.loopABEnd.mm && this.loopABStart.nn < this.loopABEnd.nn ? this.loopABStart : this.loopABEnd
      let max = this.loopABStart.mm < this.loopABEnd.mm || this.loopABStart.mm == this.loopABEnd.mm && this.loopABStart.nn < this.loopABEnd.nn ? this.loopABEnd : this.loopABStart
      let rects = this.getRectsBetweenMeasures(min.mm, max.mm)
      this.viewCallback.showLoop(rects)
      this.player.loopABMeasure(min.mm, max.mm);
      this.loopABStep = 3
      this.updateState({ loopABStep: this.loopABStep }, "loopABStep");
    }

  }
  loopAbClickNew(click) {
    if (this.loopABStep == 1) {
      this.loopABStart = click;
      let rect = this.svgScore.musScore.posOf(click.mm, click.nn, 0)
      this.viewCallback.showLoop(rect)
      this.loopABStep = 2
      this.updateState({ loopABStep: this.loopABStep }, "loopABStep");
    } else if (this.loopABStep == 2) {
      this.loopABEnd = click;
      let min = this.loopABStart.mm < this.loopABEnd.mm || this.loopABStart.mm == this.loopABEnd.mm && this.loopABStart.nn < this.loopABEnd.nn ? this.loopABStart : this.loopABEnd
      let max = this.loopABStart.mm < this.loopABEnd.mm || this.loopABStart.mm == this.loopABEnd.mm && this.loopABStart.nn < this.loopABEnd.nn ? this.loopABEnd : this.loopABStart
      let rects = this.getRectsBetweenCursor(min.mm, min.nn, max.mm, max.nn)
      this.viewCallback.showLoop(rects)
      this.player.loopABMeasureAndIndex(min.mm, min.nn, max.mm, max.nn);
      this.loopABStep = 3
      this.updateState({ loopABStep: this.loopABStep }, "loopABStep");
    }

  }
  loopABOn() {
    this.loopABStep = 1;
    this.updateState({ loopABStep: this.loopABStep }, "loopABStep");
    this.viewCallback.showLoop()
  }
  loopABOff() {
    this.loopABStep = 0;
    this.updateState({ loopABStep: this.loopABStep }, "loopABStep");
    this.svgScore.highlightMeasure([]);
    this.player.loopABCancel();
    this.viewCallback.showLoop()
  }
  setLoopAll(loopAll) {
    this.player.setLoopAll(loopAll);
  }
  isLoopAll() {
    return this.player.isLoopAll();
  }
  setSpeed(speed) {
    this.player.setSpeed(speed);
  }
  getSpeed() {
    return this.player.getSpeed();
  }
  setTransposition(transpotion) {
    this.player.setTransposition(transpotion);
  }
  getTransposition() {
    return this.player.getTransposition();
  }
  setVolume(volume) {
    this.player.setVolume(volume);
  }
  getVolume() {
    return this.player.getVolume();
  }
  getDuration() {
    return this.player.getDuration();
  }
  getCurrentTime() {
    return Math.max(0, this.player.getCurrentTime());
  }
  seekTo(progress) {
    this.player.seekTo(progress);
  }
  setJianpuMode(jianpu) {
    console.log("jianpu:", jianpu);
    if (jianpu === 'true' || jianpu === true) jianpu = 1;
    else if (jianpu === 'false' || jianpu === false) jianpu = 0;
    this.svgScore.showJianpu(jianpu);
    this.updateState({ isJianpuMode: jianpu != 0 }, "isJianpuMode");
    this.updateState({ jianpuMode: jianpu }, "jianpuMode");
    if (this.viewCallback) {
      this.viewCallback.onSetJianpuMode(jianpu)
    }
  }
  isJianpuMode() {
    return this.svgScore.musScore.jianpu != 0;
  }
  getJianpuMode() {
    return this.svgScore.musScore.jianpu;
  }
  resetPlay() {
    this.player.resetPlay();
    if (!this.autoScrollDisabled) {
      this.showCursor(-1, 0, 0);
      window.scrollTo(0, 0);
    }
  }
  showCursor(mm, nn, percent) {
    if (!this.svgScore) return
    let pos = mm == -1 ? null : this.svgScore.showCursor(mm, nn, percent);
    if (this.viewCallback) {
      this.viewCallback.showCursor(pos)
    }
    return pos
  }
  // drop cursor when end
  dropCursor() {
    if (!this.svgScore) return
    if (this.viewCallback) {
      this.viewCallback.showCursor(null)
    }
  }
  setCursorVisibility(visible) {
    if (this.viewCallback) {
      if (visible == true || visible == 'true')
        this.viewCallback.showCursor()
      else
        this.viewCallback.hideCursor()
    }
  }
  getTrackCount() {
    return this.player.getTrackCount();
  }
  switchTrack() {
    this.player.switchTrack();
    this.renewTrackColor();
  }
  setEnabledTrack(track, trackCount) {
    if (trackCount != undefined || trackCount != null)
      this.player.setTrackCount(trackCount)
    this.player.setEnabledTrack(track);
    this.renewTrackColor();
  }
  renewTrackColor() {
    let track = this.player.getEnabledTrack();
    let trackCount = this.player.getTrackCount();
    let disabledTrack = [];
    if (track != -1) {
      for (let i = 0; i < trackCount; i++) {
        if (i != track) disabledTrack.push(i);
      }
    }
    this.svgScore.setTrackStyle(disabledTrack, { color: "gray" });
  }
  noteOn(note) {
    this.player.noteOn(note);
  }
  moveToNextChord() {
    let measure = this.player.getCurrentMeasure();
    let pos = this.svgScore.getMeasureRect(measure);
    console.log("measure ", measure);
    this.scrollToCursor(pos);
    this.player.moveToNextChord();
  }
  setMetronomeOn(metronomeOn) {
    this.player.setMetronomeOn(metronomeOn);
  }
  isMetronomeOn() {
    return this.player.isMetronomeOn();
  }
  // enable user scroll
  setScrollEnabled(enable) {
    this.userScrollDisabled = !enable;
    if (!enable) {
      document.body.addEventListener('touchmove', this.scrollListener, { passive: false });
      document.body.addEventListener('mousemove', this.scrollListener, { passive: false });
      document.body.addEventListener('scroll', this.scrollListener, { passive: false });
      document.body.addEventListener('wheel', this.scrollListener, { passive: false });
    } else {
      document.body.removeEventListener('touchmove', this.scrollListener, { passive: false });
      document.body.removeEventListener('mousemove', this.scrollListener, { passive: false });
      document.body.removeEventListener('scroll', this.scrollListener, { passive: false });
      document.body.removeEventListener('wheel', this.scrollListener, { passive: false });
    }
    this.updateState({ userScrollDisabled: !enable }, "userScrollDisabled");
  }
  setUserScrollDisabled(disable) {
    this.setScrollEnabled(!disable);
  }
  setAutoScrollDisabled(disable) {
    this.autoScrollDisabled = disable;
    this.updateState({ autoScrollDisabled: disable }, "autoScrollDisabled");
  }
  setUserSeekDisabled(disable) {
    this.userSeekDisabled = disable;
    this.updateState({ userSeekDisabled: disable }, "userSeekDisabled");
  }
  setUserClickDisabled(disable) {
    this.userClickDisabled = disable;
    this.updateState({ userClickDisabled: disable }, "userClickDisabled");
  }
  //deprecated
  isLocked() {
    return this.locked
  }
  //deprecated
  setLocked(locked) {
    this.locked = locked;
    this.setUserScrollDisabled(locked);
    this.setAutoScrollDisabled(locked);
    this.setUserSeekDisabled(locked);
    this.setUserClickDisabled(locked);
    this.updateState({ locked: locked }, "locked");
  }
  //deprecated
  setCovered(covered) {
    this.covered = covered;
    this.setUserScrollDisabled(false);
    this.setAutoScrollDisabled(covered);
    this.setUserSeekDisabled(false);
    this.setUserClickDisabled(false);
    this.updateState({ covered: covered }, "covered");
    if (this.viewCallback) {
      this.viewCallback.onCovered(covered)
    }
  }
  setShowMask(covered) {
    this.covered = covered;
    this.updateState({ covered: covered }, "covered");
    if (this.viewCallback) {
      this.viewCallback.onCovered(covered)
    }
  }
  //deprecated
  disableTouchSeek(disable) {
    this.setUserSeekDisabled(disable)
  }
  scrollListener(event) {
    event.preventDefault();
  }
  setNoteResult(key, result, measure, nn) {
    if (this.viewCallback) {
      let pos = this.svgScore.musScore.posOf(measure, nn, 0)
      this.viewCallback.onSetIndicator(key, {
        pos: pos,
        result: result,
      })
    }
  }
  setNoteResults(data) {
    if (this.viewCallback) {
      let bytes = base64js.toByteArray(data)
      var json = new TextDecoder("utf-8").decode(bytes);
      let results = JSON.parse(json);
      let indicators = {}
      for (let i = 0; i < results.chords.length; i++) {
        let one = results.chords[i]
        indicators[one[0]] = {
          pos: this.svgScore.musScore.posOf(one[2], one[3], 0),
          result: one[1]
        }
      }

      let messy = []
      let rects = []
      for (let i = 0; i < results.messy.length; i++) {
        let one = results.messy[i]
        let start = this.svgScore.musScore.posOf(one.start[0], one.start[1], 0)
        let end = this.svgScore.musScore.posOf(one.end[0], one.end[1], 0)
        messy.push({ start: { x: start.x, y: start.y, height: start.height }, end: { x: end.x + 20, y: end.y, height: end.height } })
        let oneMeasures = this.getRectsBetweenCursor(one.start[0], one.start[1], one.end[0], one.end[1])
        rects.push(...oneMeasures)
      }

      this.viewCallback.onSetIndicators(indicators, messy, rects)
    }
  }
  getRectsBetweenCursor(startMeasureIndex, startNoteIndex, endMeasureIndex, endNoteIndex) {
    let measures = []
    let cursor = {
      start: this.svgScore.musScore.posOf(startMeasureIndex, startNoteIndex, 0),
      end: this.svgScore.musScore.posOf(endMeasureIndex, endNoteIndex, 0),
    }
    let measureStart = this.svgScore.getMeasureRect(startMeasureIndex)
    let measureEnd = this.svgScore.getMeasureRect(endMeasureIndex)
    if (measureStart.y == measureEnd.y) {
      measures.push({ x: cursor.start.x, y: cursor.start.y, width: cursor.end.x - cursor.start.x + 20, height: cursor.start.height })
    } else {
      let posXStart = cursor.start.x
      let posXEnd = cursor.start.x
      let posY = cursor.start.y
      for (let measureIndex = startMeasureIndex; measureIndex <= endMeasureIndex; measureIndex++) {
        let measurePos = this.svgScore.getMeasureRect(measureIndex)
        if (measurePos.y == posY) {
          posXEnd = measurePos.x + measurePos.width
        } else {
          measures.push({ x: posXStart, y: posY, width: posXEnd - posXStart, height: measurePos.height })
          posY = measurePos.y
          posXStart = measurePos.x
          if (posY == measureEnd.y) {
            posXEnd = cursor.end.x
            measures.push({ x: posXStart + 20, y: posY, width: posXEnd - posXStart, height: measurePos.height })
            break
          }
        }
      }
    }
    return measures
  }
  getRectsBetweenMeasures(startMeasureIndex, endMeasureIndex) {
    let measures = []
    let measureStart = this.svgScore.getMeasureRect(startMeasureIndex)
    let measureEnd = this.svgScore.getMeasureRect(endMeasureIndex)
    if (measureStart.y == measureEnd.y) {
      measures.push({ x: measureStart.x, y: measureStart.y, width: measureEnd.x + measureEnd.width - measureStart.x, height: measureStart.height })
    } else {
      let posXStart = measureStart.x
      let posXEnd = measureStart.x
      let posY = measureStart.y
      for (let measureIndex = startMeasureIndex; measureIndex <= endMeasureIndex; measureIndex++) {
        let measurePos = this.svgScore.getMeasureRect(measureIndex)
        if (measurePos.y == posY) {
          posXEnd = measurePos.x + measurePos.width
        } else {
          measures.push({ x: posXStart, y: posY, width: posXEnd - posXStart, height: measurePos.height })
          posY = measurePos.y
          posXStart = measurePos.x
          if (posY == measureEnd.y) {
            posXEnd = measureEnd.x + measureEnd.width
            measures.push({ x: posXStart, y: posY, width: posXEnd - posXStart, height: measurePos.height })
            break
          }
        }
      }
    }
    return measures
  }
  clearNoteIndicator() {
    if (this.viewCallback) {
      this.viewCallback.onClearIndicator()
    }
  }
  setBackgroundColor(color) {
    if (this.viewCallback) {
      this.viewCallback.onSetBackgroundColor(color)
    }
  }
  setNoteColor(elementIds, color) {
    if (elementIds == "") return

    let ids = elementIds.split(',')
    ids.forEach(element => {
      this.colorIds.set(element, color)
    })
    this.svgScore.setNoteColor(ids, tinycolor(color))
    this.svgScore.setStemColor(ids, tinycolor(color))
  }
  removeNoteColor(elementIds) {
    if (elementIds == "") return

    let ids = elementIds.split(',')
    ids.forEach(element => {
      this.colorIds.delete(element)
    })
    this.svgScore.setNoteColor(ids)
    this.svgScore.setStemColor(ids)
  }
  resetNoteColor() {
    let ids = []
    this.colorIds.forEach((color, id) => {
      ids.push(id)
    })
    this.colorIds.clear()
    this.svgScore.setNoteColor(ids)
    this.svgScore.setStemColor(ids)
  }
}