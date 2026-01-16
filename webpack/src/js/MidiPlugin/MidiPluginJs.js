import MIDI from './midi'
const Tuna = require('tunajs')
import Ticktack from './Ticktack'
export default class MidiPluginJs {
    trackStatus = []
    volume = 1
    constructor(initCallback) {
        this.initCallback = initCallback
    }
    init(tracks) {
        this.pedal = {}
        this.pedalNotes = {}
        const loadInstruments = []
        for (let i = 0; i < tracks.length; i++) {
            loadInstruments.push(this.mapProgram(tracks[i].program))
        }
        window.Tuna = Tuna
        console.log("start login soundfont")
        // MIDI.USE_XHR = false
        MIDI.loadPlugin({
            soundfontUrl: './soundfont/',
            instruments: loadInstruments,
            onerror: () => {
                console.log("loadPlugin error")
            },
            onsuccess: () => {
                for (let i = 0; i < tracks.length; i++) {
                    let track = tracks[i]
                    MIDI.programChange(track.channel, this.mapProgram(track.program)) /// i : channel   num: miniId
                    MIDI.setVolume(track.channel, (127 * this.volume).toFixed(0));
                }
                MIDI.setEffects([
                    // {
                    //     type: "MoogFilter",
                    //     bufferSize: 4096,
                    //     bypass: false,
                    //     cutoff: 0.065,
                    //     resonance: 3.5
                    // },
                    // {
                    //     type: "Bitcrusher",
                    //     bits: 4,
                    //     bufferSize: 4096,
                    //     bypass: false,
                    //     normfreq: 0.1
                    // },
                    // {
                    //     type: "Phaser",
                    //     rate: 1.2, // 0.01 to 8 is a decent range, but higher values are possible
                    //     depth: 0.3, // 0 to 1
                    //     feedback: 0.2, // 0 to 1+
                    //     stereoPhase: 30, // 0 to 180
                    //     baseModulationFrequency: 700, // 500 to 1500
                    //     bypass: 0
                    // }, {
                    //     type: "Chorus",
                    //     rate: 1.5,
                    //     feedback: 0.2,
                    //     delay: 0.0045,
                    //     bypass: 0
                    // }, {
                    //     type: "Delay",
                    //     feedback: 0.45, // 0 to 1+
                    //     delayTime: 150, // how many milliseconds should the wet signal be delayed? 
                    //     wetLevel: 0.25, // 0 to 1+
                    //     dryLevel: 1, // 0 to 1+
                    //     cutoff: 20, // cutoff frequency of the built in highpass-filter. 20 to 22050
                    //     bypass: 0
                    // }, {
                    //     type: "Overdrive",
                    //     outputGain: 0.5, // 0 to 1+
                    //     drive: 0.7, // 0 to 1
                    //     curveAmount: 1, // 0 to 1
                    //     algorithmIndex: 0, // 0 to 5, selects one of our drive algorithms
                    //     bypass: 0
                    // }, {
                    //     type: "Compressor",
                    //     threshold: 0.5, // -100 to 0
                    //     makeupGain: 1, // 0 and up
                    //     attack: 1, // 0 to 1000
                    //     release: 0, // 0 to 3000
                    //     ratio: 4, // 1 to 20
                    //     knee: 5, // 0 to 40
                    //     automakeup: true, // true/false
                    //     bypass: 0
                    // }, 
                    {
                        type: "Convolver",
                        highCut: 22050, // 20 to 22050
                        lowCut: 20, // 20 to 22050
                        dryLevel: 1, // 0 to 1+
                        wetLevel: 1, // 0 to 1+
                        level: 1, // 0 to 1+, adjusts total output of both wet and dry
                        impulse: "./sounds/impulse_rev.wav", // the path to your impulse response
                        bypass: 0
                    },
                    // {
                    //     type: "Filter",
                    //     frequency: 20, // 20 to 22050
                    //     Q: 1, // 0.001 to 100
                    //     gain: 0, // -40 to 40
                    //     bypass: 1, // 0 to 1+
                    //     filterType: 0 // 0 to 7, corresponds to the filter types in the native filter node: lowpass, highpass, bandpass, lowshelf, highshelf, peaking, notch, allpass in that order
                    // }, {
                    //     type: "Cabinet",
                    //     makeupGain: 1, // 0 to 20
                    //     impulsePath: "./sounds/impulse_guitar.wav", // path to your speaker impulse
                    //     bypass: 0
                    // }, {
                    //     type: "Tremolo",
                    //     intensity: 0.3, // 0 to 1
                    //     rate: 0.1, // 0.001 to 8
                    //     stereoPhase: 0, // 0 to 180
                    //     bypass: 0
                    // }, {
                    //     type: "WahWah",
                    //     automode: true, // true/false
                    //     baseFrequency: 0.5, // 0 to 1
                    //     excursionOctaves: 2, // 1 to 6
                    //     sweep: 0.2, // 0 to 1
                    //     resonance: 10, // 1 to 100
                    //     sensitivity: 0.5, // -1 to 1
                    //     bypass: 0
                    // }
                ]);
                this.audioCtx = MIDI.getContext()
                this.ticktacker = new Ticktack(MIDI.getContext())
                this.trackStatus = []
                if (this.initCallback) this.initCallback()
            }
        })
    }

    mapProgram(program) {
        // use Marimba instead of any instrument except Acoustic Grand Piano
        let value = 0
        switch (program) {
            case 0: value = 0
                break
            case 25: value = 25
                break
            case 24: value = 24
                break
            default: value = 68
                break
        }
        return value
    }

    enableAudio() {
        this.audioCtx && this.audioCtx.resume()
    }
    noteEvent(channelId, note, velocity, duration) {
        this.noteOn(channelId, note, velocity, 0)
        this.noteOff(channelId, note, duration)
    }
    noteOn(channelId, note, velocity, delay) {
        MIDI.noteOn(channelId, note, velocity, delay)
    }

    noteOff(channelId, note, delay) {
        setTimeout(() => {
            if (this.pedal[channelId]) {
                let pedalNotes = this.pedalNotes[channelId]
                if (!pedalNotes) {
                    pedalNotes = new Set()
                    this.pedalNotes[channelId] = pedalNotes
                }
                pedalNotes.add(note)
            } else {
                this.noteOffImmediately(channelId, note)
            }
        }, delay * 1000)
    }

    noteOffImmediately(channelId, note) {
        MIDI.noteOff(channelId, note, 0)
    }

    setController(channelId, controllerType, value) {
        // MIDI.setController(channelId, controllerType, value)
        if (controllerType == 64 && value > 0) { // pedal down
            this.pedal[channelId] = 1;
        } else if (controllerType == 64 && value == 0) { // pedal up
            this.pedal[channelId] = 0;
            let pedalNotes = this.pedalNotes[channelId]
            if (pedalNotes) {
                pedalNotes.forEach(note => {
                    this.noteOffImmediately(channelId, note)
                });
                pedalNotes.clear()
            }
        }
    }
    programChange(channelId, programNumber) {
        MIDI.programChange(channelId, this.mapProgram(programNumber))
    }
    pitchBend(channelId, value) {
        MIDI.pitchBend(channelId, value)
    }
    setTrackMute(trackIndex, mute = true) {
        let track = this.trackStatus[trackIndex]
        if (track == undefined) track = {}
        track.mute = mute
        this.trackStatus[trackIndex] = track
    }
    isTrackMute(trackIndex) {
        let track = this.trackStatus[trackIndex]
        return track != undefined && track.mute
    }
    // getInstrument(channel){
    //     return MIDI.getInstrument(channel)
    // }
    setVolume(volume) {
        this.volume = volume
        MIDI.setVolume(0, (127 * this.volume).toFixed(0));
    }
    getVolume() {
        return this.volume
    }
    setTrackVolume(trackIndex, volume) {
        let track = this.trackStatus[trackIndex]
        if (track == undefined) track = {}
        track.volume = volume
        this.trackStatus[trackIndex] = track
    }
    getTrackVolume(trackIndex) {
        let track = this.trackStatus[trackIndex]
        return track ? track.volume : 1
    }

    ticktackParams = [{ frequency: 880, duration: 0.4 }, { frequency: 440, duration: 0.2 }]

    ticktack(first = true) {
        if (this.ticktacker) this.ticktacker.play(first)
        // let current = new Date().getTime()
        // if (this.lastTick != undefined) {
        //     console.log("tick time:", (current - this.lastTick) / 1000)
        // }
        // this.lastTick = current
        // let e = this.ticktackParams[first ? 0 : 1]
        // let oscillator = this.audioCtx.createOscillator();
        // let gainNode = this.audioCtx.createGain();
        // oscillator.connect(gainNode);
        // gainNode.connect(this.audioCtx.destination);
        // oscillator.frequency.value = e.frequency;
        // gainNode.gain.value = this.volume / 2
        // // gainNode.gain.exponentialRampToValueAtTime(1, this.audioCtx.currentTime + 0.001);
        // gainNode.gain.exponentialRampToValueAtTime(1e-6, this.audioCtx.currentTime + e.duration);
        // oscillator.start(this.audioCtx.currentTime);
        // oscillator.stop(this.audioCtx.currentTime + e.duration);
    }
}