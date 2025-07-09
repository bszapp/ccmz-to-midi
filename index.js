const $ = e => document.querySelector(e);
document.addEventListener('DOMContentLoaded', () => {
    var buffer = null;
    var running = 0;
    var output = { array: null, name: '' };
    $('#inputfilebtn').onclick = () => $('input').click();
    /**
     * 依次为 取消|确定|停止|关闭|下载
     */
    const setbtnzt = (zt = '00000') => {
        $('#cancelbtn').style.display = zt[0] == '1' ? null : 'none';
        $('#okbtn').style.display = zt[1] == '1' ? null : 'none';
        $('#stopbtn').style.display = zt[2] == '1' ? null : 'none';
        $('#closebtn').style.display = zt[3] == '1' ? null : 'none';
        $('#downloadbtn').style.display = zt[4] == '1' ? null : 'none';
    }

    $('#cancelbtn').onclick = $('#stopbtn').onclick = $('#closebtn').onclick = () => {
        $('#run').style.display = 'none';
        $('#box1').style.display = 'none';
        $('#box2').style.display = 'none';
        $('#box-title').className = '';
        running++;
        $('#file').value = '';
    }
    $('#downloadbtn').onclick = () => {
        downloadArray(output.array, $('#filename').value + '.mid');
    }
    $('#filename').onfocus = () => {
        $('#filename').select();
    }

    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        document.body.className = 'mobile';
    }

    const dropZone = $('#inputfile');
    // 阻止默认行为
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, e => e.preventDefault());
        dropZone.addEventListener(eventName, e => e.stopPropagation());
    });

    // 添加拖入样式
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => $('#drop-zz').classList.add('show'));
    });

    // 移除拖入样式
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => $('#drop-zz').classList.remove('show'));
    });


    const start = async file => {
        buffer = await file.arrayBuffer();
        $('#run').style.display = null;
        $('#box1').style.display = null;
        $('#box2').style.display = 'none';
        $('#box3').style.display = 'none';
        $('#box-title').innerText = `要处理文件“${file.name}”吗？`;

        setbtnzt('11000');

        $('#okbtn').onclick = async () => {
            $('#box1').style.display = 'none';
            $('#box2').style.display = null;
            $('#box2').innerHTML = '';
            $('#box3').style.display = 'none';
            let bcrunning = running;
            setbtnzt('00100')
            const addinfo = () => {
                if (running != bcrunning) throw 1;
                var e = document.createElement('div');
                e.className = "infotext";
                $('#box2').appendChild(e);
                $('#box2').scrollTo({
                    top: $('#box2').scrollHeight,
                    behavior: "smooth",
                });
                return e;
            }
            try {
                $('#box-title').innerText = `正在处理...`;
                $('#box-title').className = "c_waiting";
                output.array = await covert(buffer, {
                    yinliang: [0.5, 1, 2, 3][Number($('#config-yinliang').dataset.value)],
                    suofang: [0.25, 0.5, 1, 2][Number($('#config-suofang').dataset.value)]
                }, addinfo);
                output.name = file.name;
                $('#box-title').className = "c_success";
                $('#box-title').innerText = "完成";
                $('#box3').style.display = null;
                $('#filename').value = output.name;

                setbtnzt('00011');
            } catch (e) {
                if (running != bcrunning) return;
                console.error(e);
                var text = addinfo()
                text.innerText = e.message;
                text.classList.add("error");
                $('#box-title').className = "c_error";
                $('#box-title').innerText = "失败";

                setbtnzt('00010');
            }
        }
    };
    $('input').onchange = e => start(e.target.files[0]);
    dropZone.ondrop = e => start(e.dataTransfer.files[0]);

});
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
async function covert(buffer, config, addinfo) {
    var infoe;
    infoe = addinfo();
    infoe.innerText = "解密文件...";
    await wait(100);
    var { data, type } = decodeCCMZ(buffer);
    infoe.innerText += "完成";
    var downloadarraybtn = document.createElement("div");
    downloadarraybtn.innerText = "下载原始数据";
    downloadarraybtn.className = "infotext-btn";
    downloadarraybtn.onclick = function () {
        downloadArray(data, "ccmz.zip");
    }
    infoe.appendChild(downloadarraybtn);

    infoe = addinfo();
    infoe.innerText = "解压缩...";
    await wait(100);
    var json = JSON.parse((await unzipFiles(data, { 1: ["data.ccmid"], 2: ["midi.json"] }[type]))[0]);
    infoe.innerText += "完成";

    return await ccmztomidi(json, config, addinfo);
}
function decodeCCMZ(buffer) {
    let type = (new Uint8Array(buffer.slice(0, 1)))[0];

    let data = new Uint8Array(buffer.slice(1));
    if (type == 1) return { type, data };
    else if (type == 2) {
        data = data.map(v => v % 2 == 0 ? v + 1 : v - 1);
        return { type, data };
    } else throw new Error("文件解析失败：不支持的加密方式");
}

async function unzipFiles(zipBytes, fileList) {
    const zip = await JSZip.loadAsync(zipBytes);
    const result = [];
    for (const fileName of fileList) {
        const file = await zip.file(fileName);
        if (!file) throw new Error(`压缩包读取失败：读取${fileName}失败}`);
        const fileData = await file.async("string");
        result.push(fileData);
    }
    return result;
}

async function ccmztomidi(json, config, addinfo) {
    const midiData = MidiReader(json);
    const midi = new Midi();
    for (var trackIdx = 0; trackIdx < midiData.tracks.length; trackIdx++) {
        await wait(100);

        var info = addinfo();
        const track = midi.addTrack();
        const trackEvents = midiData.trackEvents[trackIdx] || [];
        //第一次循环先统计总数
        var total = 0;
        for (let i = 0; i < trackEvents.length; i++) {
            const event = trackEvents[i];
            if (event.type === 'channel' && event.subtype === 'noteOn' && event.velocity > 0) total++;
        }

        var total2 = 0;

        for (let i = 0; i < trackEvents.length; i++) {
            const event = trackEvents[i];
            if (event.type === 'channel' && event.subtype === 'noteOn' && event.velocity > 0) {
                const noteStart = event.tick / midi.header.ppq;
                const noteDuration = event.duration / midi.header.ppq;
                const noteVelocity = event.velocity / 127;
                track.addNote({
                    midi: event.noteNumber,
                    time: noteStart * config.suofang,
                    duration: noteDuration * config.suofang,
                    velocity: Math.min(1, Math.max((noteVelocity - 0.5) * config.yinliang + 0.5, 0))
                });
                total2++;
                info.innerText = `处理音轨${trackIdx + 1}...(${total2}/${total})`;
            }
        }
    }

    info = addinfo();
    info.innerText = "生成midi文件...";
    var midiarray = midi.toArray();
    info.innerText += "完成";
    return midiarray;
}

function downloadArray(buffer, filename) {
    const blob = new Blob([buffer], {
        type: 'application/octet-stream'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

'Stream'; var _createClass = function () { function a(c, d) { for (var f, e = 0; e < d.length; e++)f = d[e], f.enumerable = f.enumerable || !1, f.configurable = !0, "value" in f && (f.writable = !0), Object.defineProperty(c, f.key, f) } return function (c, d, e) { return d && a(c.prototype, d), e && a(c, e), c } }(); function _classCallCheck(a, c) { if (!(a instanceof c)) throw new TypeError("Cannot call a class as a function") } var Stream = function () { function a(c) { _classCallCheck(this, a), this.position = 0, this.str = c } return _createClass(a, [{ key: "read", value: function read(c) { var d = this.str.substr(this.position, c); return this.position += c, d } }, { key: "readInt32", value: function readInt32() { var c = (this.str.charCodeAt(this.position) << 24) + (this.str.charCodeAt(this.position + 1) << 16) + (this.str.charCodeAt(this.position + 2) << 8) + this.str.charCodeAt(this.position + 3); return this.position += 4, c } }, { key: "readInt16", value: function readInt16() { var c = (this.str.charCodeAt(this.position) << 8) + this.str.charCodeAt(this.position + 1); return this.position += 2, c } }, { key: "readInt8", value: function readInt8() { var c = 0 < arguments.length && void 0 !== arguments[0] && arguments[0], d = this.str.charCodeAt(this.position); return c && 127 < d && (d -= 256), this.position += 1, d } }, { key: "eof", value: function eof() { return this.position >= this.str.length } }, { key: "readVarInt", value: function readVarInt() { for (var d, c = 0; ;)if (d = this.readInt8(), 128 & d) c += 127 & d, c <<= 7; else return c + d } }]), a }();
'MidiReader'; function MidiReader(c) { function d(p) { for (var q = '', r = 0; r < p.length; r++)q += String.fromCharCode(p[r]); return new Stream(q) } function f(p) { var q = {}, r = p.readInt8(); if (240 != (240 & r)) { var v = p.readInt8(); var w = r >> 4; switch (q.channel = 15 & r, q.type = 'channel', w) { case 8: return q.subtype = 'noteOff', q.noteNumber = v, q.velocity = p.readInt8(), q; case 9: return q.noteNumber = v, q.velocity = p.readInt8(), q.subtype = 0 == q.velocity ? 'noteOff' : 'noteOn', q; case 10: return q.subtype = 'noteAftertouch', q.noteNumber = v, q.amount = p.readInt8(), q; case 11: return q.subtype = 'controller', q.controllerType = v, q.value = p.readInt8(), q; case 12: return q.subtype = 'programChange', q.programNumber = v, q; case 13: return q.subtype = 'channelAftertouch', q.amount = v, q; case 14: return q.subtype = 'pitchBend', q.value = v + (p.readInt8() << 7), q; default: throw 'Unrecognised MIDI event type: ' + w; } } else if (255 == r) { q.type = 'meta'; var s = p.readInt8(), t = p.readVarInt(); switch (s) { case 0: if (q.subtype = 'sequenceNumber', 2 != t) throw 'Expected length for sequenceNumber event is 2, got ' + t; return q.number = p.readInt16(), q; case 1: return q.subtype = 'text', q.text = p.read(t), q; case 2: return q.subtype = 'copyrightNotice', q.text = p.read(t), q; case 3: return q.subtype = 'trackName', q.text = p.read(t), q; case 4: return q.subtype = 'instrumentName', q.text = p.read(t), q; case 5: return q.subtype = 'lyrics', q.text = p.read(t), q; case 6: return q.subtype = 'marker', q.text = p.read(t), q; case 7: return q.subtype = 'cuePoint', q.text = p.read(t), q; case 32: if (q.subtype = 'midiChannelPrefix', 1 != t) throw 'Expected length for midiChannelPrefix event is 1, got ' + t; return q.channel = p.readInt8(), q; case 47: if (q.subtype = 'endOfTrack', 0 != t) throw 'Expected length for endOfTrack event is 0, got ' + t; return q; case 81: if (q.subtype = 'setTempo', console.lohg('setTempo'), 3 != t) throw 'Expected length for setTempo event is 3, got ' + t; return q.microsecondsPerBeat = (p.readInt8() << 16) + (p.readInt8() << 8) + p.readInt8(), q; case 84: if (q.subtype = 'smpteOffset', 5 != t) throw 'Expected length for smpteOffset event is 5, got ' + t; var u = p.readInt8(); return q.frameRate = { 0: 24, 32: 25, 64: 29, 96: 30 }[96 & u], q.hour = 31 & u, q.min = p.readInt8(), q.sec = p.readInt8(), q.frame = p.readInt8(), q.subframe = p.readInt8(), q; case 88: if (q.subtype = 'timeSignature', 4 != t) throw 'Expected length for timeSignature event is 4, got ' + t; return q.numerator = p.readInt8(), q.denominator = Math.pow(2, p.readInt8()), q.metronome = p.readInt8(), q.thirtyseconds = p.readInt8(), q; case 89: if (q.subtype = 'keySignature', 2 != t) throw 'Expected length for keySignature event is 2, got ' + t; return q.key = p.readInt8(!0), q.scale = p.readInt8(), q; case 127: return q.subtype = 'sequencerSpecific', q.data = p.read(t), q; default: return q.subtype = 'unknown', q.data = p.read(t), q; } } else { if (240 == r) return q.type = 'sysEx', q.data = p.read(p.readVarInt()), q; if (247 == r) return q.type = 'dividedSysEx', q.data = p.read(p.readVarInt()), q; throw 'Unrecognised MIDI event type byte: ' + r } } for (var g = c.tracks.length, h = [], j = [], k = [], l = 0, p = 0; p < c.events.length; p++) { var q = c.events[p], r = q.track; h[r] == void 0 && (h[r] = [], j[r] = 0); var s = f(d(q.event)); s.deltaTime = q.tick - j[r], s.delta = q.tick - l, s.staff = q.staff, s.tick = q.tick, s.id = q.id, s.duration = q.duration, s.finger = q.finger, s.meas_start_tick = q.meas_start_tick, s.noteIndex = q.note, s.track = q.track, s.measure = q.measure, s.repeatIndex = q.repeatIndex, j[r] = q.tick, l = q.tick, h[r].push(s), k.push(s) } var m = Object.keys(c.measures); m.sort(function (p, q) { return p - q }); var n = 0; if (0 < m.length) { var p = m[m.length - 1]; n = +p + c.measures[p].duration } var o = { trackCount: g, totalTicks: n, beatInfos: c.beatInfos, leftHandTrack: c.leftHandTrack, rightHandTrack: c.rightHandTrack }; return { header: o, trackEvents: h, events: k, measures: c.measures, tempos: c.tempos, measureTicks: m, tracks: c.tracks } }


document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.input-xz').forEach(e => {
        var es = e.querySelectorAll('.xx');
        function sete(n) {
            es.forEach((e, i) => {
                if (i == n) e.classList.add('xz');
                else e.classList.remove('xz');
            });
            e.dataset.value = n;
        }
        es.forEach((e, i) => {
            e.addEventListener('click', () => {
                sete(i);
            });
        });
        sete(Number(e.dataset.value));
    })
});