export default class NativeMidiPlayer {
    state = {
    }
    constructor(signal) {
        this.signal = signal
        this.track = -1
    }
    init() {
        console.log("error invoke")
    }
    refreshState(name, value) {
        if (this.state[name] != value) {
            this.state[name] = value
            this.signal.send("onUpdateState", { data: this.state, name: name });
        }
    }
    placeTo(mm, nn) {
        this.signal.send("onPlayerControl", {
            type: "placeTo",
            measure: mm,
            index: nn,
        })
    }
    loopABMeasure(loopStartMeasure, loopEndMeasure) {
        this.signal.send("onPlayerControl", {
            type: "loopABMeasure",
            loopStartMeasure: loopStartMeasure,
            loopEndMeasure: loopEndMeasure,
        })
    }
    loopABMeasureAndIndex(loopStartMeasure, loopStartIndex, loopEndMeasure, loopEndIndex){
        this.signal.send("onPlayerControl", {
            type: "loopABMeasure",
            loopStartMeasure: loopStartMeasure,
            loopStartIndex: loopStartIndex,
            loopEndMeasure: loopEndMeasure,
            loopEndIndex: loopEndIndex,
        })
    }
    loopABCancel() {
        this.signal.send("onPlayerControl", {
            type: "loopABCancel"
        })
    }
    resetPlay() {
        // this.signal.send("onPlayerControl", {
        //     type: "resetPlay"
        // })
        console.log("error invoke")
    }
    setEnabledTrack(track) {
        this.track = track
        this.signal.send("onPlayerControl", {
            type: "setEnabledTrack",
            track: track
        })
    }
    getTrackCount(){
        return this.trackCount;
    }
    setTrackCount(trackCount){
        this.trackCount = trackCount;
    }
    getEnabledTrack(){
        return this.track;
    }
    moveToNextChord() {
        this.signal.send("onPlayerControl", {
            type: "moveToNextChord"
        })
    }
    setMetronomeOn() {
        console.log("error invoke")
    }
    setWaterfall() {
        console.log("error invoke")
    }
    setWaterfallMode() {
        console.log("error invoke")
    }
    setWaterfallVisible() {
        console.log("error invoke")
    }
}