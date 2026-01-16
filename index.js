const $ = e => document.querySelector(e);
document.addEventListener('DOMContentLoaded', () => {
    $('#inputfilebtn').onclick = () => $('input').click();

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
        dropZone.addEventListener(eventName, () => {
            $('#drop-zz').classList.add('show');
            dropZone.classList.add('dragover');
        });
    });

    // 移除拖入样式
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            $('#drop-zz').classList.remove('show');
            dropZone.classList.remove('dragover');
        });
    });

    $('input').onchange = e => start(e.target.files[0]);
    dropZone.ondrop = e => start(e.dataTransfer.files[0]);

    $('#shuqian-item').href = `javascript:(async()=>{
        const tourl='${location.origin + location.pathname}';
    try{
        const iframe = document.querySelector('iframe');
        if(!iframe) throw 1;

        const realUrl = new URL(iframe.src).searchParams.get('url');
        if(!realUrl) throw 1;

        const response = await fetch(realUrl);

        let filename = '';

        const cd = response.headers.get('content-disposition');
        if (cd) {
            const m =
                cd.match(/filename\\*=UTF-8''([^;]+)/i) ||
                cd.match(/filename="?([^";]+)"?/i);
            if (m) {
                filename = decodeURIComponent(m[1]);
            }
        }

        if (!filename) {
            const p = new URL(realUrl).pathname.split('/').pop();
            if (p) filename = decodeURIComponent(p);
        }

        if (!filename) filename = 'download.bin';

        const total = parseInt(response.headers.get('content-length'),10) || 0;
        const reader = response.body.getReader();

        const w = window.open(tourl);
        window.addEventListener('message', async e => {
            if (e.data !== 'READY') return;
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    w.postMessage({ action:'DONE', filename }, '*');
                    break;
                }
                w.postMessage(
                    { action:'CHUNK', chunk:value, total },
                    '*',
                    [value.buffer]
                );
            }
        });
    }catch(e){ window.open(tourl) }
    })();
`;
    document.addEventListener('dragover', e => e.preventDefault());
    document.addEventListener('drop', () => droppedInside = true);
    $('#shuqian-item').addEventListener('dragend', () => {
        setTimeout(() => {
            if (!droppedInside) {
                window.location.href = 'https://www.gangqinpu.com/search/0__0.htm';
            }
            droppedInside = false;
        }, 50);
    });

    readyTimer = setInterval(() => {
        if (window.opener) {
            window.opener.postMessage('READY', '*');
        }
    });

});


var buffer = null;
var running = 0;
var output = { array: null, name: '' };

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

const start = async file => {
    var buffer = await file.arrayBuffer();
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
            var data = await covert(buffer, {
                yinliang: [0.5, 1, 2, 3][Number($('#config-yinliang').dataset.value)],
                suofang: [0.25, 0.5, 1, 2][Number($('#config-suofang').dataset.value)]
            }, addinfo);
            output.array = data.array;
            output.name = data.name || file.name;
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

let droppedInside = false;

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
    var json = JSON.parse((
        await unzipFile(
            data,
            { 1: "data.ccmid", 2: "midi.json" }[type]
        )
    )[0]);
    var scoreInfo = JSON.parse((
        await unzipFile(
            data,
            { 1: "data.ccxml", 2: "score.json" }[type]
        )
    )[0]);
    infoe.innerText += "完成";

    return {
        array: await ccmztomidi(json, config, addinfo),
        name: scoreInfo?.title?.title
    }
}
function decodeCCMZ(buffer) {
    let type = (new Uint8Array(buffer.slice(0, 1)))[0];

    let data = new Uint8Array(buffer.slice(1));
    if (type == 1) return { type, data };
    else if (type == 2) {
        data = data.map(v => v % 2 == 0 ? v + 1 : v - 1);
        return { type, data };
    } else throw new Error(`文件解析失败：不支持的加密方式(${type})`);
}

async function unzipFile(zipBytes, fileName) {
    const zip = await JSZip.loadAsync(zipBytes);
    const result = [];
    const file = await zip.file(fileName);
    if (!file) throw new Error(`压缩包读取失败：读取${fileName}失败}`);
    const fileData = await file.async("string");
    result.push(fileData);
    return result;
}
async function ccmztomidi(json, config, addinfo) {
    var info = addinfo();
    info.innerText = "正在处理数据...";

    const midiData = MidiReader(json);
    const ppq = 480;

    const outputJson = {
        header: { ppq: ppq },
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

    // 为每个原始轨道创建独立的 Track 对象，完全不合并音符
    for (let trackIdx = 0; trackIdx < midiData.tracks.length; trackIdx++) {
        const trackEvents = midiData.trackEvents[trackIdx] || [];
        if (trackEvents.length === 0) continue;

        const currentTrack = {
            channel: trackIdx, // 统一使用通道 1，靠 Track 区分
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
                    velocity: Math.round(Math.min(1, Math.max((noteVelocity - 0.5) * config.yinliang + 0.5, 0)) * 127)
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
    info.innerText += "完成";
    var downloadarraybtn = document.createElement("div");
    downloadarraybtn.innerText = "下载JSON数据";
    downloadarraybtn.className = "infotext-btn";
    downloadarraybtn.onclick = function () {
        downloadArray(new TextEncoder().encode(JSON.stringify(outputJson, null, 2)), "music.json");
    }
    info.appendChild(downloadarraybtn);

    var info = addinfo();
    await wait(100);
    info.innerText = "合成MIDI...";
    var midiUint8Array = jsonToMidiUint8Array(outputJson);
    info.innerText += "完成";
    return midiUint8Array;
}

const jsonToMidiUint8Array = (json) => {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    const midi = new Midi();
    midi.header.ppq = data.header.ppq;

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

let chunks = [];
let loaded = 0;
let totalSize = 0;
let fileName = 'download.bin';

var readyTimer = null;

window.addEventListener('message', e => {
    const d = e.data;
    if (!d || d === 'READY') return;

    if (d.action === 'CHUNK') {
        chunks.push(d.chunk);
        loaded += d.chunk.length;
        totalSize = d.total || 0;
    }

    if (d.action === 'DONE') {
        clearInterval(readyTimer);
        fileName = d.filename || fileName;

        console.log('接收DONE - chunks长度:', chunks.length, 'loaded:', loaded, 'totalSize:', totalSize);
        const blob = new Blob(chunks);
        console.log('文件准备就绪:', fileName, blob, 'blob.size:', blob.size);

        if (blob.size === 0) {
            console.error('错误：接收到的数据为空！');
            return;
        }

        start({
            name: fileName,
            arrayBuffer: async () => await blob.arrayBuffer()
        })
        chunks = [];
        loaded = 0;
    }
});

'Stream'; var _createClass = function () { function a(c, d) { for (var f, e = 0; e < d.length; e++)f = d[e], f.enumerable = f.enumerable || !1, f.configurable = !0, "value" in f && (f.writable = !0), Object.defineProperty(c, f.key, f) } return function (c, d, e) { return d && a(c.prototype, d), e && a(c, e), c } }(); function _classCallCheck(a, c) { if (!(a instanceof c)) throw new TypeError("Cannot call a class as a function") } var Stream = function () { function a(c) { _classCallCheck(this, a), this.position = 0, this.str = c } return _createClass(a, [{ key: "read", value: function read(c) { var d = this.str.substr(this.position, c); return this.position += c, d } }, { key: "readInt32", value: function readInt32() { var c = (this.str.charCodeAt(this.position) << 24) + (this.str.charCodeAt(this.position + 1) << 16) + (this.str.charCodeAt(this.position + 2) << 8) + this.str.charCodeAt(this.position + 3); return this.position += 4, c } }, { key: "readInt16", value: function readInt16() { var c = (this.str.charCodeAt(this.position) << 8) + this.str.charCodeAt(this.position + 1); return this.position += 2, c } }, { key: "readInt8", value: function readInt8() { var c = 0 < arguments.length && void 0 !== arguments[0] && arguments[0], d = this.str.charCodeAt(this.position); return c && 127 < d && (d -= 256), this.position += 1, d } }, { key: "eof", value: function eof() { return this.position >= this.str.length } }, { key: "readVarInt", value: function readVarInt() { for (var d, c = 0; ;)if (d = this.readInt8(), 128 & d) c += 127 & d, c <<= 7; else return c + d } }]), a }();
'MidiReader'; function MidiReader(c) { function d(p) { for (var q = '', r = 0; r < p.length; r++)q += String.fromCharCode(p[r]); return new Stream(q) } function f(p) { var q = {}, r = p.readInt8(); if (240 != (240 & r)) { var v = p.readInt8(); var w = r >> 4; switch (q.channel = 15 & r, q.type = 'channel', w) { case 8: return q.subtype = 'noteOff', q.noteNumber = v, q.velocity = p.readInt8(), q; case 9: return q.noteNumber = v, q.velocity = p.readInt8(), q.subtype = 0 == q.velocity ? 'noteOff' : 'noteOn', q; case 10: return q.subtype = 'noteAftertouch', q.noteNumber = v, q.amount = p.readInt8(), q; case 11: return q.subtype = 'controller', q.controllerType = v, q.value = p.readInt8(), q; case 12: return q.subtype = 'programChange', q.programNumber = v, q; case 13: return q.subtype = 'channelAftertouch', q.amount = v, q; case 14: return q.subtype = 'pitchBend', q.value = v + (p.readInt8() << 7), q; default: throw 'Unrecognised MIDI event type: ' + w; } } else if (255 == r) { q.type = 'meta'; var s = p.readInt8(), t = p.readVarInt(); switch (s) { case 0: if (q.subtype = 'sequenceNumber', 2 != t) throw 'Expected length for sequenceNumber event is 2, got ' + t; return q.number = p.readInt16(), q; case 1: return q.subtype = 'text', q.text = p.read(t), q; case 2: return q.subtype = 'copyrightNotice', q.text = p.read(t), q; case 3: return q.subtype = 'trackName', q.text = p.read(t), q; case 4: return q.subtype = 'instrumentName', q.text = p.read(t), q; case 5: return q.subtype = 'lyrics', q.text = p.read(t), q; case 6: return q.subtype = 'marker', q.text = p.read(t), q; case 7: return q.subtype = 'cuePoint', q.text = p.read(t), q; case 32: if (q.subtype = 'midiChannelPrefix', 1 != t) throw 'Expected length for midiChannelPrefix event is 1, got ' + t; return q.channel = p.readInt8(), q; case 47: if (q.subtype = 'endOfTrack', 0 != t) throw 'Expected length for endOfTrack event is 0, got ' + t; return q; case 81: if (q.subtype = 'setTempo', console.lohg('setTempo'), 3 != t) throw 'Expected length for setTempo event is 3, got ' + t; return q.microsecondsPerBeat = (p.readInt8() << 16) + (p.readInt8() << 8) + p.readInt8(), q; case 84: if (q.subtype = 'smpteOffset', 5 != t) throw 'Expected length for smpteOffset event is 5, got ' + t; var u = p.readInt8(); return q.frameRate = { 0: 24, 32: 25, 64: 29, 96: 30 }[96 & u], q.hour = 31 & u, q.min = p.readInt8(), q.sec = p.readInt8(), q.frame = p.readInt8(), q.subframe = p.readInt8(), q; case 88: if (q.subtype = 'timeSignature', 4 != t) throw 'Expected length for timeSignature event is 4, got ' + t; return q.numerator = p.readInt8(), q.denominator = Math.pow(2, p.readInt8()), q.metronome = p.readInt8(), q.thirtyseconds = p.readInt8(), q; case 89: if (q.subtype = 'keySignature', 2 != t) throw 'Expected length for keySignature event is 2, got ' + t; return q.key = p.readInt8(!0), q.scale = p.readInt8(), q; case 127: return q.subtype = 'sequencerSpecific', q.data = p.read(t), q; default: return q.subtype = 'unknown', q.data = p.read(t), q; } } else { if (240 == r) return q.type = 'sysEx', q.data = p.read(p.readVarInt()), q; if (247 == r) return q.type = 'dividedSysEx', q.data = p.read(p.readVarInt()), q; throw 'Unrecognised MIDI event type byte: ' + r } } for (var g = c.tracks.length, h = [], j = [], k = [], l = 0, p = 0; p < c.events.length; p++) { var q = c.events[p], r = q.track; h[r] == void 0 && (h[r] = [], j[r] = 0); var s = f(d(q.event)); s.deltaTime = q.tick - j[r], s.delta = q.tick - l, s.staff = q.staff, s.tick = q.tick, s.id = q.id, s.duration = q.duration, s.finger = q.finger, s.meas_start_tick = q.meas_start_tick, s.noteIndex = q.note, s.track = q.track, s.measure = q.measure, s.repeatIndex = q.repeatIndex, j[r] = q.tick, l = q.tick, h[r].push(s), k.push(s) } var m = Object.keys(c.measures); m.sort(function (p, q) { return p - q }); var n = 0; if (0 < m.length) { var p = m[m.length - 1]; n = +p + c.measures[p].duration } var o = { trackCount: g, totalTicks: n, beatInfos: c.beatInfos, leftHandTrack: c.leftHandTrack, rightHandTrack: c.rightHandTrack }; return { header: o, trackEvents: h, events: k, measures: c.measures, tempos: c.tempos, measureTicks: m, tracks: c.tracks } }
