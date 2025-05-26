
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('input').onchange = async e => {
        var buffer = await e.target.files[0].arrayBuffer();
        var { data, type } = decodeCCMZ(buffer);
        var json = JSON.parse((await unzipFiles(data, { 1: ["data.ccmid"], 2: ["midi.json"] }[type]))[0]);
        downloadArray(ccmztomidi(json), e.target.files[0].name + ".mid");
    };
});

function decodeCCMZ(buffer) {
    let type = (new Uint8Array(buffer.slice(0, 1)))[0];
    console.log("加密方式：", type);

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

function ccmztomidi(json) {
    const midiData = MidiReader(json);
    const midi = new Midi();

    midiData.tracks.forEach((trackData, trackIdx) => {

        const track = midi.addTrack();
        const trackEvents = midiData.trackEvents[trackIdx] || [];

        trackEvents.forEach(event => {
            if (event.type === 'meta') {
                if (event.subtype === 'timeSignature') {
                    // Time signatures are also global and added to midi.header
                    midi.header.timeSignatures.push({
                        ticks: event.tick,
                        timeSignature: [event.numerator, event.denominator],
                        // measures: event.measure // The library might automatically calculate this or not use it directly for export
                    });
                    console.log(`Time Signature changed at tick ${event.tick} (time ${event.tick / midi.header.ppq}s): ${event.numerator}/${event.denominator}`);
                } else if (event.subtype === 'trackName') {
                    // Track name is added to the specific track
                    track.name = event.text; // Assign directly to track.name
                }
            } else if (event.type === 'channel' && event.subtype === 'noteOn' && event.velocity > 0) {
                const noteStart = event.tick / midi.header.ppq;
                const noteDuration = event.duration / midi.header.ppq;
                const noteVelocity = event.velocity / 127;
                track.addNote({
                    midi: event.noteNumber,
                    time: noteStart,
                    duration: noteDuration,
                    velocity: noteVelocity
                });
                console.log(`Track ${trackIdx}, Note: ${event.noteNumber}, Start: ${noteStart}s, Duration: ${noteDuration}s, Volume: ${noteVelocity}`);
            }
        });
    });
    return midi.toArray();
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

class Stream {
    constructor(str) {
        this.str = str
    }

    position = 0

    read(length) {
        const result = this.str.substr(this.position, length)
        this.position += length
        return result
    }

    readInt32() {
        const result =
            (this.str.charCodeAt(this.position) << 24) +
            (this.str.charCodeAt(this.position + 1) << 16) +
            (this.str.charCodeAt(this.position + 2) << 8) +
            this.str.charCodeAt(this.position + 3)
        this.position += 4
        return result
    }

    readInt16() {
        const result =
            (this.str.charCodeAt(this.position) << 8) +
            this.str.charCodeAt(this.position + 1)
        this.position += 2
        return result
    }

    readInt8(signed = false) {
        let result = this.str.charCodeAt(this.position)
        if (signed && result > 127) result -= 256
        this.position += 1
        return result
    }

    eof() {
        return this.position >= this.str.length
    }

    readVarInt() {
        let result = 0
        while (true) {
            const b = this.readInt8()
            if (b & 0x80) {
                result += b & 0x7f
                result <<= 7
            } else {
                return result + b
            }
        }
    }
}

function MidiReader(data) {
    function intArrayToStream(arr) {
        let str = ''
        for (let i = 0; i < arr.length; i++) {
            str += String.fromCharCode(arr[i])
        }
        return new Stream(str)
    }
    function readEvent(stream) {
        var event = {};
        var eventTypeByte = stream.readInt8();
        if ((eventTypeByte & 0xf0) == 0xf0) {
            if (eventTypeByte == 0xff) {
                event.type = 'meta';
                var subtypeByte = stream.readInt8();
                var length = stream.readVarInt();
                switch (subtypeByte) {
                    case 0x00:
                        event.subtype = 'sequenceNumber';
                        if (length != 2) throw "Expected length for sequenceNumber event is 2, got " + length;
                        event.number = stream.readInt16();
                        return event;
                    case 0x01:
                        event.subtype = 'text';
                        event.text = stream.read(length);
                        return event;
                    case 0x02:
                        event.subtype = 'copyrightNotice';
                        event.text = stream.read(length);
                        return event;
                    case 0x03:
                        event.subtype = 'trackName';
                        event.text = stream.read(length);
                        return event;
                    case 0x04:
                        event.subtype = 'instrumentName';
                        event.text = stream.read(length);
                        return event;
                    case 0x05:
                        event.subtype = 'lyrics';
                        event.text = stream.read(length);
                        return event;
                    case 0x06:
                        event.subtype = 'marker';
                        event.text = stream.read(length);
                        return event;
                    case 0x07:
                        event.subtype = 'cuePoint';
                        event.text = stream.read(length);
                        return event;
                    case 0x20:
                        event.subtype = 'midiChannelPrefix';
                        if (length != 1) throw "Expected length for midiChannelPrefix event is 1, got " + length;
                        event.channel = stream.readInt8();
                        return event;
                    case 0x2f:
                        event.subtype = 'endOfTrack';
                        if (length != 0) throw "Expected length for endOfTrack event is 0, got " + length;
                        return event;
                    case 0x51:
                        event.subtype = 'setTempo';
                        console.lohg("setTempo");
                        if (length != 3) throw "Expected length for setTempo event is 3, got " + length;
                        event.microsecondsPerBeat = (
                            (stream.readInt8() << 16)
                            + (stream.readInt8() << 8)
                            + stream.readInt8()
                        )
                        return event;
                    case 0x54:
                        event.subtype = 'smpteOffset';
                        if (length != 5) throw "Expected length for smpteOffset event is 5, got " + length;
                        var hourByte = stream.readInt8();
                        event.frameRate = {
                            0x00: 24, 0x20: 25, 0x40: 29, 0x60: 30
                        }[hourByte & 0x60];
                        event.hour = hourByte & 0x1f;
                        event.min = stream.readInt8();
                        event.sec = stream.readInt8();
                        event.frame = stream.readInt8();
                        event.subframe = stream.readInt8();
                        return event;
                    case 0x58:
                        event.subtype = 'timeSignature';
                        if (length != 4) throw "Expected length for timeSignature event is 4, got " + length;
                        event.numerator = stream.readInt8();
                        event.denominator = Math.pow(2, stream.readInt8());
                        event.metronome = stream.readInt8();
                        event.thirtyseconds = stream.readInt8();
                        return event;
                    case 0x59:
                        event.subtype = 'keySignature';
                        if (length != 2) throw "Expected length for keySignature event is 2, got " + length;
                        event.key = stream.readInt8(true);
                        event.scale = stream.readInt8();
                        return event;
                    case 0x7f:
                        event.subtype = 'sequencerSpecific';
                        event.data = stream.read(length);
                        return event;
                    default:
                        event.subtype = 'unknown'
                        event.data = stream.read(length);
                        return event;
                }
            } else if (eventTypeByte == 0xf0) {
                event.type = 'sysEx';
                event.data = stream.read(stream.readVarInt());
                return event;
            } else if (eventTypeByte == 0xf7) {
                event.type = 'dividedSysEx';
                event.data = stream.read(stream.readVarInt());
                return event;
            } else {
                throw "Unrecognised MIDI event type byte: " + eventTypeByte;
            }
        } else {
            var param1;
            param1 = stream.readInt8();
            var eventType = eventTypeByte >> 4;
            event.channel = eventTypeByte & 0x0f;
            event.type = 'channel';
            switch (eventType) {
                case 0x08:
                    event.subtype = 'noteOff';
                    event.noteNumber = param1;
                    event.velocity = stream.readInt8();
                    return event;
                case 0x09:
                    event.noteNumber = param1;
                    event.velocity = stream.readInt8();
                    if (event.velocity == 0) {
                        event.subtype = 'noteOff';
                    } else {
                        event.subtype = 'noteOn';
                    }
                    return event;
                case 0x0a:
                    event.subtype = 'noteAftertouch';
                    event.noteNumber = param1;
                    event.amount = stream.readInt8();
                    return event;
                case 0x0b:
                    event.subtype = 'controller';
                    event.controllerType = param1;
                    event.value = stream.readInt8();
                    return event;
                case 0x0c:
                    event.subtype = 'programChange';
                    event.programNumber = param1;
                    return event;
                case 0x0d:
                    event.subtype = 'channelAftertouch';
                    event.amount = param1;
                    return event;
                case 0x0e:
                    event.subtype = 'pitchBend';
                    event.value = param1 + (stream.readInt8() << 7);
                    return event;
                default:
                    throw "Unrecognised MIDI event type: " + eventType
            }
        }
    }
    const trackCount = data.tracks.length
    let trackEvents = []
    let tickOfTrack = []
    let events = []
    let lastEventTime = 0
    for (let i = 0; i < data.events.length; i++) {
        const event = data.events[i]
        const track = event.track
        if (trackEvents[track] == undefined) {
            trackEvents[track] = []
            tickOfTrack[track] = 0
        }
        let e = readEvent(intArrayToStream(event.event))
        e.deltaTime = event.tick - tickOfTrack[track]
        e.delta = event.tick - lastEventTime
        e.staff = event.staff
        e.tick = event.tick
        e.id = event.id
        e.duration = event.duration
        e.finger = event.finger
        e.meas_start_tick = event.meas_start_tick
        e.noteIndex = event.note
        e.track = event.track
        e.measure = event.measure
        e.repeatIndex = event.repeatIndex
        tickOfTrack[track] = event.tick
        lastEventTime = event.tick

        trackEvents[track].push(e)
        events.push(e)
    }

    let measureTicks = Object.keys(data.measures)
    measureTicks.sort((a, b) => { return a - b })

    let totalTicks = 0
    if (measureTicks.length > 0) {
        let lastMeasureTick = measureTicks[measureTicks.length - 1]
        totalTicks = +lastMeasureTick + data.measures[lastMeasureTick].duration
    }

    var header = {
        'trackCount': trackCount,
        'totalTicks': totalTicks,
        'beatInfos': data.beatInfos,
        'leftHandTrack': data.leftHandTrack,
        'rightHandTrack': data.rightHandTrack
    }
    return {
        'header': header,
        'trackEvents': trackEvents,
        'events': events,
        'measures': data.measures,
        'tempos': data.tempos,
        'measureTicks': measureTicks,
        'tracks': data.tracks
    }
}