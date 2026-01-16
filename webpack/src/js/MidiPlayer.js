import MidiPluginJs from './MidiPlugin/MidiPluginJs';
import { MidiReader } from './MidiReader'
import Waterfall from "./Waterfall";
// import MidiInterface from './MidiPlugin/MidiInterface';
export default class MidiPlayer {
    nextIndex = 0
    duration = 0    // 总共时长（不计算速度）
    currentTime = 0 // 当前时间（不计算速度）
    pausedTime = 0 // 暂停时间
    tickTime = 0 // 抵达当前tick的时刻
    DEFAULT_BPM = 60
    DEFAULT_QUATER_TICKS = 480 // 四分之一音符的ticks

    eventQueue = []
    state = {
        inited: 0,
        isPlaying: false,
        duration: 0, // 总共时长（计算速度）
        currentTime: 0, // 当前时间（计算速度）
        speed: 1.0,
        volume: 1.0,
        isLoopAll: false,
        transposition: 0,
        enabledTrack: -1,
        isMetronomeOn: false,
        trackCount: 0
    }

    constructor(stateCallback, measureCallback, noteCallback, cursorCallback) {
        this.cursorCallback = cursorCallback
        this.stateCallback = stateCallback
        this.measureCallback = measureCallback
        this.noteCallback = noteCallback
        let MidiInterface = MidiPluginJs
        this.midiInterface = new MidiInterface(() => {
            console.log("inited ok")
            this.refreshState("inited", 2)
        })
    }

    init(json) {
        this.reader = MidiReader(json)
        this.beatInfos = this.reader.header.beatInfos
        this.measures = this.reader.measures
        this.tempos = this.reader.tempos
        // this.leftHandTrack = this.reader.header.leftHandTrack
        // this.rightHandTrack = this.reader.header.rightHandTrack
        this.measureTicks = Object.keys(this.measures)
        this.measureTicks.sort((a, b) => { return a - b })
        this.makeQueue()
        this.refreshState("trackCount", this.reader.tracks.length)

    }

    loadSoundfont() {
        this.midiInterface.init(this.reader.tracks)
    }

    refreshState(name, value) {
        if (this.state[name] != value) {
            this.state[name] = value
            if (this.stateCallback) {
                this.stateCallback(this.state, name)
            }
        }
    }

    inited() {
        return this.state.inited
    }

    ready() {
        return this.state.inited == 2
    }

    getDuration() {
        return parseInt(this.duration / this.state.speed)
    }

    getCurrentTime() {
        if (this.nextIndex >= this.eventQueue.length)
            return parseInt(this.duration / this.state.speed)
        let time = this.nextIndex == 0 ? -this.maxGap : parseInt(this.eventQueue[this.nextIndex - 1].time / this.state.speed)
        if (this.isPlaying())
            time += new Date().getTime() - this.tickTime
        else if (this.pausedTime != 0)
            time = this.pausedTime
        return time
    }

    seekTo(progress) {
        let time = this.duration * progress
        let index = this.eventQueue.findIndex((event) => {
            return event.time >= time
        })
        console.log("seek to index:", index)
        if (index != -1) {
            this.nextIndex = index
            this.pausedTime = 0
            // if(!this.isPlaying()){
            //     this.moveToNextChord()
            // }
        }
        if (this.waterfall) {
            this.resetWaterfallEvents()
        }
    }

    setSpeed(speed) {
        this.refreshState("speed", speed)
        this.refreshState("duration", this.getDuration())
        this.refreshState("currentTime", this.getCurrentTime())
    }

    getSpeed() {
        return this.state.speed
    }

    getTransposition() {
        return this.state.transposition
    }

    setTransposition(transposition) {
        this.refreshState("transposition", transposition)
    }

    setVolume(volume) {
        if (this.ready()) {
            this.refreshState("volume", volume)
            this.midiInterface.setVolume(volume)
        }
    }

    getVolume() {
        return this.state.volume
    }

    resetPlay() {
        this.onPlayStop()
        this.nextIndex = 0
        // this.currentTick = 0
        this.currentTime = 0
        this.pausedTime = 0
        this.tickTime = 0
        if (this.waterfall) {
            this.resetWaterfallEvents()
        }
    }

    setLoopAll(isLoopAll = true) {
        this.refreshState("isLoopAll", isLoopAll)
    }

    isLoopAll() {
        return this.state.isLoopAll
    }

    // 区间为[loopStartMeasure, loopEndMeasure]
    loopABMeasure(loopStartMeasure, loopEndMeasure) {
        this.loopStartIndex = this.eventQueue.findIndex((e) => { return e.type == "measure" && e.measure.measure >= loopStartMeasure })
        this.loopEndIndex = this.eventQueue.findIndex((e) => { return e.type == "measure" && e.measure.measure >= loopEndMeasure + 1 || e.type == "end" })
    }
    loopABMeasureAndIndex(loopStartMeasure, loopStartIndex, loopEndMeasure, loopEndIndex){
        this.loopStartIndex = this.eventQueue.findIndex((e) => {
             if( e.type != "notes" || e.measureIndex != loopStartMeasure) return false 
             let index = e.noteEvents.findIndex(e=>{
                 return e.noteIndex == loopStartIndex
             })
             return index != -1
            })
        this.loopEndIndex = this.eventQueue.findIndex((e) => {
            if( e.type != "notes" || e.measureIndex != loopEndMeasure) return false 
            let index = e.noteEvents.findIndex(e=>{
                return e.noteIndex == loopEndIndex
            })
            return index != -1
           }) + 1
    }

    loopABCancel() {
        this.loopStartIndex = undefined
        this.loopEndIndex = undefined
    }

    onPlayStart() {
        this.refreshState("isPlaying", true)
        if (this.waterfall) {
            if (!this.waterfallInfo)
                this.resetWaterfallEvents()
        }
    }
    onPlayStop() {
        this.refreshState("isPlaying", false)
        if (this.timer)
            clearTimeout(this.timer)
    }

    startPlay() {
        if (this.ready()) {
            this.onPlayStart()
            this.midiInterface.enableAudio()
            let delay = this.nextIndex == 0 ? this.maxGap : 0
            let current = new Date().getTime()
            this.tickTime = current
            if (this.pausedTime != 0) {
                let thisIndexTime = this.nextIndex > 0 ? this.eventQueue[this.nextIndex - 1].time / this.state.speed : -this.maxGap
                let thisIndexDelay = this.nextIndex > 0 ? this.eventQueue[this.nextIndex - 1].delay / this.state.speed : this.maxGap
                let eclipse = this.pausedTime - thisIndexTime
                let remain = Math.max(0, thisIndexDelay - eclipse)
                delay = remain
                this.pausedTime = 0
                this.tickTime = current - eclipse
            }
            this.loop(delay, this)
            return true
        }
        return false
    }

    pausePlay() {
        if (this.ready()) {
            this.pausedTime = this.getCurrentTime()
            this.onPlayStop()
        }
    }

    stopPlay() {
        this.onPlayStop()
        this.resetPlay()
    }

    isPlaying() {
        if (!this.ready())
            return false
        return this.state.isPlaying
    }

    setMute(trackIndex, m = true) {
        if (this.ready()) {
            this.midiInterface.setTrackMute(trackIndex, m)
        }
    }

    isMute(trackIndex) {
        return this.ready() ? this.midiInterface.isTrackMute(trackIndex) : false
    }

    setEnabledTrack(track) {
        this.refreshState("enabledTrack", track)
    }

    switchTrack() {
        if (this.state.enabledTrack < this.reader.tracks.length - 1)
            this.refreshState("enabledTrack", this.state.enabledTrack + 1)
        else
            this.refreshState("enabledTrack", -1)
        return this.state.enabledTrack
    }

    getEnabledTrack() {
        return this.state.enabledTrack
    }

    getTrackCount() {
        return this.reader.tracks.length
    }

    moveToIndex(index) {
        this.nextIndex = index
        this.pausedTime = 0
        if (this.ready() && !this.isPlaying()) {
            this.playNext()
        }
        if (this.waterfall) {
            this.resetWaterfallEvents()
        }
    }

    moveToNextChord() {
        if (this.ready()) {
            this.onPlayStop()
            do {
                this.playNext()
            } while (this.eventQueue[this.nextIndex].type != "notes")
            this.pausedTime = 0
        }
        if (this.waterfall) {
            this.resetWaterfallEvents()
        }
    }

    getCurrentMeasure() {
        let index = this.nextIndex - 1
        while (index >= 0) {
            let event = this.eventQueue[index]
            if (event.type == 'measure') {
                return event.measureIndex
            }
            index--
        }
        return 0
    }

    placeTo(mm, nn) {
        let measureIndex = this.measureTicks.findIndex((value) => {
            return this.measures[value].measure >= mm
        })
        let measureTick = +this.measureTicks[measureIndex]
        let currentTick = measureTick + this.measures[measureTick].note_ticks[nn]
        this.nextIndex = this.eventQueue.findIndex((value) => {
            return value.type == "notes" && value.tick >= currentTick
        })
        this.pausedTime = 0
        if (this.waterfall) {
            this.resetWaterfallEvents()
        }
    }

    playNext() {
        if (this.nextIndex >= this.eventQueue.length) {
            if (this.loopStartIndex != undefined && this.loopEndIndex != undefined) {
                this.nextIndex = this.loopStartIndex
            } else if (this.state.isLoopAll) {
                this.nextIndex = 0
            } else {
                this.resetPlay()
                return
            }
        } else if (this.loopStartIndex != undefined && this.loopEndIndex != undefined
            && (this.nextIndex < this.loopStartIndex || this.nextIndex >= this.loopEndIndex)) {
            // 限定播放在AB区间内
            this.nextIndex = this.loopStartIndex
        }

        let event = this.eventQueue[this.nextIndex]
        if (event.type == "metronome") {
            this.ticktack(event.firstBeatInMeasure)
        } else if (event.type == "notes") {
            this.handleEvents(event.noteEvents)
        } else if (event.type == "measure") {
            this.measureCallback(event.measure.measure, event.measure.notes)
        } else if (event.type == "end") {
            this.measureCallback(-1)
        }
        this.refreshState("currentTime", this.getCurrentTime())

        this.nextIndex++
        return event.delay
    }

    loop(delay, instance) {
        const thisPtr = instance
        this.timer = setTimeout(() => {
            if (thisPtr.state.isPlaying) {
                thisPtr.currentTime += delay
                thisPtr.tickTime = new Date().getTime()
                let nextDelay = thisPtr.playNext()
                if (nextDelay != undefined) {
                    thisPtr.loop(nextDelay, thisPtr)
                }
            }
        }, delay / this.state.speed)
    }


    makeQueue() {

        let nextEventIndex = 0
        let measureTick = 0
        let measure = undefined
        let measureEndTick = 0
        let tick = 0
        this.eventQueue = []
        let beatsIndex = 0
        let tickOffset = 0
        for (let measureTickIndex = 0; measureTickIndex < this.measureTicks.length; measureTickIndex++) {
            let eventsInMeasure = []
            measureTick = +this.measureTicks[measureTickIndex]
            measure = this.measures[measureTick]
            measureEndTick = measureTickIndex + 1 < this.measureTicks.length ? +this.measureTicks[measureTickIndex + 1] : measureTick + measure.duration

            // 第一小节tick>0，处理节拍器
            if (measureTickIndex == 0 && measureTick > 0) {
                tickOffset = measureTick
                // const ticktackTicks = this.DEFAULT_QUATER_TICKS / this.beatInfos[beatsIndex].beatsUnit * 4
                // let beatsBeforeAll = parseInt(measureTick / ticktackTicks)
                // for (let i = 0; i < beatsBeforeAll; i++) {
                //     this.eventQueue.push({
                //         type: "metronome",
                //         firstBeatInMeasure: false,
                //         tick: ticktackTicks * i
                //     })
                // }
            }

            //  小节开始事件
            eventsInMeasure.push({
                type: "measure",
                tick: measureTick,
                measureIndex: measure.measure,
                measure: measure,
            })

            while (beatsIndex + 1 < this.beatInfos.length && this.beatInfos[beatsIndex + 1].tick <= measureTick) {
                beatsIndex++
            }

            const ticktackTicks = this.DEFAULT_QUATER_TICKS / this.beatInfos[beatsIndex].beatsUnit * 4
            let beats = this.beatInfos[beatsIndex].beats
            for (let i = 0; i < beats; i++) {
                eventsInMeasure.push({
                    type: "metronome",
                    firstBeatInMeasure: i == 0,
                    tick: measureTick + ticktackTicks * i,
                })
            }

            let eventsOfSameTick = []
            let eventsBeforeMeasure = []
            while (nextEventIndex < this.reader.events.length) {
                let event = this.reader.events[nextEventIndex]
                if (event.tick >= measureEndTick) {
                    break
                } else if (event.tick < measureTick) {
                    // 处理第一小节起点tick>0时的控制信号
                    if (event.tick == 0) {
                        tick = tickOffset
                        event.tick = tickOffset
                        eventsBeforeMeasure.push(event)
                    }
                } else {
                    if (eventsBeforeMeasure.length > 0) {
                        this.eventQueue.unshift({
                            type: "notes",
                            tick: tick,
                            noteEvents: eventsBeforeMeasure,
                            delay: 0,
                            delayTicks: 0
                        })
                        eventsBeforeMeasure = []
                    }
                    if (event.subtype != 'noteOff') {
                        if (event.tick != tick) {
                            if (eventsOfSameTick.length > 0) {
                                eventsInMeasure.push({
                                    type: "notes",
                                    tick: tick,
                                    measureIndex: measure.measure,
                                    measure: measure,
                                    noteEvents: eventsOfSameTick,
                                })
                            }
                            eventsOfSameTick = []
                            tick = +event.tick
                        }
                        // if (event.subtype == 'noteOn') {
                        //     event.delay = this.ticksToMilliseconds(event.duration, currentTempo)
                        // }
                        eventsOfSameTick.push(event)
                    }
                }
                nextEventIndex++
            }
            if (eventsOfSameTick.length > 0) {
                eventsInMeasure.push({
                    type: "notes",
                    tick: tick,
                    measureIndex: measure.measure,
                    measure: measure,
                    noteEvents: eventsOfSameTick,
                })
            }
            eventsInMeasure = this.bubble(eventsInMeasure, (a, b) => {
                return +a.tick - b.tick
            })
            // for (let i = 0; i < eventsInMeasure.length; i++) {
            //     let event = eventsInMeasure[i]
            //     if (i < eventsInMeasure.length - 1) {
            //         event.delayTicks = eventsInMeasure[i + 1].tick - event.tick
            //         event.delay = this.ticksToMilliseconds(event.delayTicks, currentTempo)
            //     } else {
            //         event.delayTicks = measureEndTick - event.tick
            //         event.delay = this.ticksToMilliseconds(event.delayTicks, currentTempo)
            //     }
            // }
            let measureNotes = {}
            eventsInMeasure.forEach(element => {
                if (element.type == "notes") {
                    let notes = {}
                    element.noteEvents.forEach(event => {
                        if (event.subtype == 'noteOn' && event.noteNumber) {
                            notes[event.noteNumber] = event.track
                            measureNotes[event.noteNumber] = event.track
                        }
                    })
                    element.notes = notes
                }
            });
            measure.notes = measureNotes
            this.eventQueue.push.apply(this.eventQueue, eventsInMeasure)
        }
        this.eventQueue.push({
            type: "end",
            tick: measureEndTick,
            delayTicks: 0,
            delay: 0
        })

        // 计算每个事件之间的间隔的时长以及每个音符的持续时长
        let nextTempoIndex = 0
        let currentTempo = 60 / this.DEFAULT_BPM * 1000000
        let time = 0
        // measureTick = -1
        nextEventIndex = 0
        while (nextEventIndex < this.eventQueue.length - 1) {
            let event = this.eventQueue[nextEventIndex]
            event.time = time
            // if (event.type == "measure") {
            // measureTick = event.tick
            // }

            // 找到当前音符tempo
            while (nextTempoIndex < this.tempos.length && event.tick >= this.tempos[nextTempoIndex].tick) {
                currentTempo = this.tempos[nextTempoIndex].tempo
                nextTempoIndex++
            }

            if (event.type == "notes") {
                event.noteEvents.forEach((value) => {
                    if (value.subtype == 'noteOn') {
                        value.delay = this.ticksToMilliseconds(value.duration, currentTempo)
                    }
                })
            }
            event.delayTicks = this.eventQueue[nextEventIndex + 1].tick - event.tick
            event.delay = this.ticksToMilliseconds(event.delayTicks, currentTempo)

            time += event.delay
            nextEventIndex++
        }
        if (nextEventIndex == this.eventQueue.length - 1) {
            let event = this.eventQueue[nextEventIndex]
            event.time = time
            event.delayTicks = 0
            event.delay = 0
            this.duration = time
            this.refreshState("duration", this.getDuration())
        }
    }

    ticksToMilliseconds(ticks, tempo) {
        return ticks / this.DEFAULT_QUATER_TICKS * tempo / 1000
    }
    isTrackMute(track) {
        return this.state.enabledTrack != -1 && this.state.enabledTrack != track
    }
    handleEvents(events) {

        for (let i = 0; i < events.length; i++) {
            let event = events[i]
            let channelId = event.channel
            let mute = this.midiInterface.isTrackMute(event.track) || this.isTrackMute(event.track)
            let trackVolume = this.midiInterface.getTrackVolume(event.track)
            switch (event.subtype) {
                case 'controller':
                    this.midiInterface.setController(channelId, event.controllerType, event.value)
                    break
                case 'programChange':
                    this.midiInterface.programChange(channelId, event.programNumber)
                    break
                case 'pitchBend':
                    this.midiInterface.pitchBend(channelId, event.value)
                    break
                case 'noteOn':
                    if (!mute) {
                        let volume = Math.round(event.velocity * trackVolume)
                        let duration = event.delay / this.state.speed / 1000
                        this.midiInterface.noteEvent(channelId, event.noteNumber + this.state.transposition, volume, duration)
                        this.onNoteOn(event)
                        let thisPtr = this
                        setTimeout(() => {
                            thisPtr.onNoteOff(event)
                        }, duration * 1000)
                    }

                    break
                // case 'noteOff':
                //     if (!mute) {
                //         this.midiPlugin.noteOff(channelId, event.noteNumber + + this.state.transposition)
                //     }
                //     break
                default:
                    break
            }
        }
    }

    onNoteOn(event) {
        if (this.cursorCallback && event.meas_start_tick != undefined) {
            let offset = event.tick - event.meas_start_tick
            let measureContent = this.measures[event.meas_start_tick]
            // let measureDuration = measureContent.duration
            let note_ticks = measureContent.note_ticks
            if (note_ticks.length == 0) return
            let index = 0
            for (let i = 1; i < note_ticks.length; i++) {
                if (offset >= note_ticks[i])
                    index++
                else break
            }
            // let space = index == note_ticks.length - 1 ? measureDuration - note_ticks[note_ticks.length - 1] : note_ticks[index + 1] - note_ticks[index]
            // let percent = (offset - note_ticks[index]) / space
            this.cursorCallback(event.measure, index, 0)
        }

        if (this.noteCallback && event.meas_start_tick != undefined) {
            this.noteCallback(1, event.noteNumber, event.track)
        }
        if (this.waterfall && event.meas_start_tick != undefined) {
            this.waterfall.noteOn(event.noteNumber)
        }
    }

    onNoteOff(event) {
        if (this.noteCallback && event.meas_start_tick != undefined) {
            this.noteCallback(0, event.noteNumber, event.track)
        }
        if (this.waterfall && event.meas_start_tick != undefined) {
            this.waterfall.noteOff(event.noteNumber)
        }
    }

    noteOn(note, channelId = 0, duration = 480, velocity = 127) {
        if (this.ready()) {
            let delay = this.ticksToMilliseconds(duration)
            this.midiInterface.noteOn(channelId, note, velocity, delay / 1000)
        }
    }

    setMetronomeOn(isMetronomeOn) {
        this.refreshState("isMetronomeOn", isMetronomeOn)
    }

    isMetronomeOn() {
        return this.state.isMetronomeOn
    }

    ticktack(firstBeatInMeasure) {
        if (this.ready() && this.isPlaying() && this.state.isMetronomeOn) {
            this.midiInterface.ticktack(firstBeatInMeasure)
        }
    }
    bubble(array, compareFn) {
        let len = array.length,
            i, j, tmp, result;
        result = array.slice(0);
        for (i = 0; i < len; i++) {
            for (j = len - 1; j > i; j--) {
                if (compareFn(result[j], result[j - 1]) < 0) {
                    tmp = result[j - 1];
                    result[j - 1] = result[j];
                    result[j] = tmp;
                }
            }
        }
        return result;
    }

    setWaterfall(waterfall) {
        this.waterfall = new Waterfall(waterfall, this)
        this.resetWaterfallEvents()
    }
    setWaterfallVisible(show) {
        this.waterfallVisible = show
        this.maxGap = this.waterfallVisible ? 3000 : 0
        if (this.waterfall) {
            this.waterfall.setVisible(show)
        }
    }
    maxGap = 3000
    resetWaterfallEvents() {
        let events = []
        let baseTime = this.getCurrentTime() * this.getSpeed()
        let next = this.nextIndex
        let currentMeasure = undefined
        // 找到显示区域下方的第二根小节线
        while (next >= 0) {
            const event = this.eventQueue[next]
            if (event.type == "measure") {
                if (currentMeasure == undefined)
                    currentMeasure = event.measureIndex
                else break
            }
            next--
        }

        this.waterfallInfo = {
            next: Math.max(0, next),
        }

        events.push(...this.addWaterfallEvents(baseTime))

        this.waterfall.resetEvents(events)
        return events
    }

    addWaterfallEvents(baseTime) {
        // 找到显示区域上方的第一根小节线
        let next = this.waterfallInfo.next
        let events = []
        while (next < this.eventQueue.length) {
            const event = this.eventQueue[next]
            if (event.type == "measure") {
                if (event.time > baseTime + this.maxGap * this.getSpeed()) break
                events.push(event)
                next++
            } else if (event.type == "end") {
                events.push(event)
                next++
                break
            } else if (event.type == "notes") {
                events.push(event)
                next++
            } else {
                next++
            }
        }
        this.waterfallInfo.next = next
        return events
    }

    refreshWaterfallEvents(events) {
        let baseTime = this.getCurrentTime() * this.getSpeed()
        let firstNeedMeasure = this.getCurrentMeasure() - 1
        let findFirstNeedMeasureIndex = 0
        while (findFirstNeedMeasureIndex < events.length) {
            if (events[findFirstNeedMeasureIndex].measureIndex >= firstNeedMeasure) break
            findFirstNeedMeasureIndex++
        }
        let splice = []
        if (findFirstNeedMeasureIndex > 0) {
            splice = events.splice(0, findFirstNeedMeasureIndex)
        }
        return { baseTime: baseTime, splice: splice }
    }

    getBaseGapTime() {
        return this.maxGap * this.getSpeed()
    }
}