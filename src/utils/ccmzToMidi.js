import JSZip from 'jszip';
import { Midi } from '@tonejs/midi';

export const ccmzToMidi = async (file, onLog, config) => {
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms)); //动画做的好看吗

    const decodeCCMZ = (buffer) => {
        let type = (new Uint8Array(buffer.slice(0, 1)))[0];
        let data = new Uint8Array(buffer.slice(1));
        if (type == 1) return { type, data };
        else if (type == 2) {
            data = data.map(v => v % 2 == 0 ? v + 1 : v - 1);
            return { type, data };
        } else throw new Error(`文件解析失败：不支持的加密方式(${type})`);
    };

    const unzipFile = async (zipBytes, fileName) => {
        const jszipInstance = new JSZip();
        const zip = await jszipInstance.loadAsync(zipBytes);
        const file = zip.file(fileName);
        if (!file) throw new Error(`压缩包读取失败：读取${fileName}失败`);
        return await file.async("string");
    };

    //#region 解密文件

    var buffer = await file.arrayBuffer();

    onLog("解密文件...", null);
    var { data, type } = decodeCCMZ(buffer);

    await wait(200);

    onLog("解密文件...完成", {
        label: "下载原始数据",
        onClick: () => {
            const blob = new Blob([data], { type: "application/zip" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "ccmz.zip";
            a.click();
        }
    }, true);

    //#region 解压数据
    onLog("解压数据...", null);
    await wait(100);
    var json = JSON.parse(await unzipFile(data, { 1: "data.ccmid", 2: "midi.json" }[type]));
    var scoreInfo = JSON.parse(await unzipFile(data, { 1: "data.ccxml", 2: "score.json" }[type]));
    onLog("解压数据...完成", null, true);

    onLog("正在处理数据...", null);
    await wait(100);

    //#region 处理midi数据

    const midiData = MidiReader(json);
    const outputJson = {
        timeSignatures: [{ tick: 0, numerator: json.beats || 4, denominator: 4 }],
        tempos: [],
        tracks: []
    };

    if (json.tempos && json.tempos.length > 0) {
        json.tempos.forEach(t => {
            outputJson.tempos.push({
                tick: t.tick,
                bpm: Math.round(60000000 / t.tempo)
            });
        });
    }

    for (let trackIdx = 0; trackIdx < midiData.tracks.length; trackIdx++) {
        const trackEvents = midiData.trackEvents[trackIdx] || [];
        if (trackEvents.length === 0) continue;
        const currentTrack = {
            channel: trackIdx,
            notes: [],
            controlChanges: []
        };
        trackEvents.forEach(event => {
            if (event.type === 'channel' && event.subtype === 'noteOn' && event.velocity > 0) {
                const noteVelocity = event.velocity / 127;
                currentTrack.notes.push({
                    tick: event.tick,
                    duration: event.duration,
                    midi: event.noteNumber,
                    velocity: Math.round(Math.min(1, Math.max((noteVelocity - 0.5) * config.volume + 0.5, 0)) * 127)
                });
            }
            if (event.type === 'channel' && event.subtype === 'controller') {
                currentTrack.controlChanges.push({
                    tick: event.tick,
                    number: event.controllerType,
                    value: event.value
                });
            }
        });
        outputJson.tracks.push(currentTrack);
    }

    onLog("正在处理数据...完成", {
        label: "下载JSON数据",
        onClick: () => {
            const blob = new Blob([JSON.stringify(outputJson, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "music.json";
            a.click();
        }
    }, true);

    //#region 合成midi

    onLog("合成midi...", null);
    await wait(200);

    const jsonToMidiUint8Array = (json) => {
        const data = typeof json === 'string' ? JSON.parse(json) : json;
        const midi = new Midi();
        //midi.header.ppq = data.header.ppq;

        midi.header.timeSignatures = data.timeSignatures.map(ts => ({
            ticks: ts.tick,
            timeSignature: [ts.numerator, ts.denominator]
        }));
        midi.header.tempos = data.tempos.map(t => ({
            ticks: t.tick,
            bpm: t.bpm
        }));

        data.tracks.forEach((tData, i) => {
            const track = midi.addTrack();
            track.name = tData.name || `Track ${i + 1}`;
            track.channel = 0;

            tData.notes.forEach(n => {
                track.addNote({
                    midi: n.midi,
                    ticks: n.tick,
                    durationTicks: n.duration,
                    velocity: n.velocity / 127
                });
            });

            if (tData.controlChanges) {
                tData.controlChanges.forEach(cc => {
                    track.addCC({
                        number: cc.number,
                        value: cc.value / 127,
                        ticks: cc.tick
                    });
                });
            }
        });

        return midi.toArray();
    };

    var midiUint8Array = jsonToMidiUint8Array(outputJson);
    onLog("合成midi...完成", null, true);

    return new File([midiUint8Array], `${scoreInfo?.title?.title || 'output'}.mid`, {
        type: 'audio/midi'
    });
};

//特别鸣谢：虫虫钢琴官网，提供解析文件源码：
'Stream'; var _createClass = function () { function a(c, d) { for (var f, e = 0; e < d.length; e++)f = d[e], f.enumerable = f.enumerable || !1, f.configurable = !0, "value" in f && (f.writable = !0), Object.defineProperty(c, f.key, f) } return function (c, d, e) { return d && a(c.prototype, d), e && a(c, e), c } }(); function _classCallCheck(a, c) { if (!(a instanceof c)) throw new TypeError("Cannot call a class as a function") } var Stream = function () { function a(c) { _classCallCheck(this, a), this.position = 0, this.str = c } return _createClass(a, [{ key: "read", value: function read(c) { var d = this.str.substr(this.position, c); return this.position += c, d } }, { key: "readInt32", value: function readInt32() { var c = (this.str.charCodeAt(this.position) << 24) + (this.str.charCodeAt(this.position + 1) << 16) + (this.str.charCodeAt(this.position + 2) << 8) + this.str.charCodeAt(this.position + 3); return this.position += 4, c } }, { key: "readInt16", value: function readInt16() { var c = (this.str.charCodeAt(this.position) << 8) + this.str.charCodeAt(this.position + 1); return this.position += 2, c } }, { key: "readInt8", value: function readInt8() { var c = 0 < arguments.length && void 0 !== arguments[0] && arguments[0], d = this.str.charCodeAt(this.position); return c && 127 < d && (d -= 256), this.position += 1, d } }, { key: "eof", value: function eof() { return this.position >= this.str.length } }, { key: "readVarInt", value: function readVarInt() { for (var d, c = 0; ;)if (d = this.readInt8(), 128 & d) c += 127 & d, c <<= 7; else return c + d } }]), a }();
'MidiReader'; function MidiReader(c) { function d(p) { for (var q = '', r = 0; r < p.length; r++)q += String.fromCharCode(p[r]); return new Stream(q) } function f(p) { var q = {}, r = p.readInt8(); if (240 != (240 & r)) { var v = p.readInt8(); var w = r >> 4; switch (q.channel = 15 & r, q.type = 'channel', w) { case 8: return q.subtype = 'noteOff', q.noteNumber = v, q.velocity = p.readInt8(), q; case 9: return q.noteNumber = v, q.velocity = p.readInt8(), q.subtype = 0 == q.velocity ? 'noteOff' : 'noteOn', q; case 10: return q.subtype = 'noteAftertouch', q.noteNumber = v, q.amount = p.readInt8(), q; case 11: return q.subtype = 'controller', q.controllerType = v, q.value = p.readInt8(), q; case 12: return q.subtype = 'programChange', q.programNumber = v, q; case 13: return q.subtype = 'channelAftertouch', q.amount = v, q; case 14: return q.subtype = 'pitchBend', q.value = v + (p.readInt8() << 7), q; default: throw 'Unrecognised MIDI event type: ' + w; } } else if (255 == r) { q.type = 'meta'; var s = p.readInt8(), t = p.readVarInt(); switch (s) { case 0: if (q.subtype = 'sequenceNumber', 2 != t) throw 'Expected length for sequenceNumber event is 2, got ' + t; return q.number = p.readInt16(), q; case 1: return q.subtype = 'text', q.text = p.read(t), q; case 2: return q.subtype = 'copyrightNotice', q.text = p.read(t), q; case 3: return q.subtype = 'trackName', q.text = p.read(t), q; case 4: return q.subtype = 'instrumentName', q.text = p.read(t), q; case 5: return q.subtype = 'lyrics', q.text = p.read(t), q; case 6: return q.subtype = 'marker', q.text = p.read(t), q; case 7: return q.subtype = 'cuePoint', q.text = p.read(t), q; case 32: if (q.subtype = 'midiChannelPrefix', 1 != t) throw 'Expected length for midiChannelPrefix event is 1, got ' + t; return q.channel = p.readInt8(), q; case 47: if (q.subtype = 'endOfTrack', 0 != t) throw 'Expected length for endOfTrack event is 0, got ' + t; return q; case 81: if (q.subtype = 'setTempo', console.lohg('setTempo'), 3 != t) throw 'Expected length for setTempo event is 3, got ' + t; return q.microsecondsPerBeat = (p.readInt8() << 16) + (p.readInt8() << 8) + p.readInt8(), q; case 84: if (q.subtype = 'smpteOffset', 5 != t) throw 'Expected length for smpteOffset event is 5, got ' + t; var u = p.readInt8(); return q.frameRate = { 0: 24, 32: 25, 64: 29, 96: 30 }[96 & u], q.hour = 31 & u, q.min = p.readInt8(), q.sec = p.readInt8(), q.frame = p.readInt8(), q.subframe = p.readInt8(), q; case 88: if (q.subtype = 'timeSignature', 4 != t) throw 'Expected length for timeSignature event is 4, got ' + t; return q.numerator = p.readInt8(), q.denominator = Math.pow(2, p.readInt8()), q.metronome = p.readInt8(), q.thirtyseconds = p.readInt8(), q; case 89: if (q.subtype = 'keySignature', 2 != t) throw 'Expected length for keySignature event is 2, got ' + t; return q.key = p.readInt8(!0), q.scale = p.readInt8(), q; case 127: return q.subtype = 'sequencerSpecific', q.data = p.read(t), q; default: return q.subtype = 'unknown', q.data = p.read(t), q; } } else { if (240 == r) return q.type = 'sysEx', q.data = p.read(p.readVarInt()), q; if (247 == r) return q.type = 'dividedSysEx', q.data = p.read(p.readVarInt()), q; throw 'Unrecognised MIDI event type byte: ' + r } } for (var g = c.tracks.length, h = [], j = [], k = [], l = 0, p = 0; p < c.events.length; p++) { var q = c.events[p], r = q.track; h[r] == void 0 && (h[r] = [], j[r] = 0); var s = f(d(q.event)); s.deltaTime = q.tick - j[r], s.delta = q.tick - l, s.staff = q.staff, s.tick = q.tick, s.id = q.id, s.duration = q.duration, s.finger = q.finger, s.meas_start_tick = q.meas_start_tick, s.noteIndex = q.note, s.track = q.track, s.measure = q.measure, s.repeatIndex = q.repeatIndex, j[r] = q.tick, l = q.tick, h[r].push(s), k.push(s) } var m = Object.keys(c.measures); m.sort(function (p, q) { return p - q }); var n = 0; if (0 < m.length) { var p = m[m.length - 1]; n = +p + c.measures[p].duration } var o = { trackCount: g, totalTicks: n, beatInfos: c.beatInfos, leftHandTrack: c.leftHandTrack, rightHandTrack: c.rightHandTrack }; return { header: o, trackEvents: h, events: k, measures: c.measures, tempos: c.tempos, measureTicks: m, tracks: c.tracks } }