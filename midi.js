!function (t, e) {
    if ("object" == typeof exports && "object" == typeof module)
        module.exports = e();
    else if ("function" == typeof define && define.amd)
        define([], e);
    else {
        var r = e();
        for (var n in r)
            ("object" == typeof exports ? exports : t)[n] = r[n]
    }
}("undefined" != typeof self ? self : this, (function () {
    return (() => {
        var t = {
            507: (t, e, r) => {
                "use strict";
                function n(t) {
                    var e = [];
                    return i(t, e),
                        e
                }
                function i(t, e) {
                    for (var r = 0; r < t.length; r++) {
                        var n = t[r];
                        Array.isArray(n) ? i(n, e) : e.push(n)
                    }
                }
                r.r(e),
                    r.d(e, {
                        flatten: () => n
                    })
            }
            ,
            289: (t, e, r) => {
                e.parseMidi = r(666),
                    e.writeMidi = r(865)
            }
            ,
            666: t => {
                function e(t) {
                    for (var e, n = new r(t), i = []; !n.eof();) {
                        var a = o();
                        i.push(a)
                    }
                    return i;
                    function o() {
                        var t = {};
                        t.deltaTime = n.readVarInt();
                        var r = n.readUInt8();
                        if (240 == (240 & r)) {
                            if (255 !== r) {
                                if (240 == r)
                                    return t.type = "sysEx",
                                        a = n.readVarInt(),
                                        t.data = n.readBytes(a),
                                        t;
                                if (247 == r)
                                    return t.type = "endSysEx",
                                        a = n.readVarInt(),
                                        t.data = n.readBytes(a),
                                        t;
                                throw "Unrecognised MIDI event type byte: " + r
                            }
                            t.meta = !0;
                            var i = n.readUInt8()
                                , a = n.readVarInt();
                            switch (i) {
                                case 0:
                                    if (t.type = "sequenceNumber",
                                        2 !== a)
                                        throw "Expected length for sequenceNumber event is 2, got " + a;
                                    return t.number = n.readUInt16(),
                                        t;
                                case 1:
                                    return t.type = "text",
                                        t.text = n.readString(a),
                                        t;
                                case 2:
                                    return t.type = "copyrightNotice",
                                        t.text = n.readString(a),
                                        t;
                                case 3:
                                    return t.type = "trackName",
                                        t.text = n.readString(a),
                                        t;
                                case 4:
                                    return t.type = "instrumentName",
                                        t.text = n.readString(a),
                                        t;
                                case 5:
                                    return t.type = "lyrics",
                                        t.text = n.readString(a),
                                        t;
                                case 6:
                                    return t.type = "marker",
                                        t.text = n.readString(a),
                                        t;
                                case 7:
                                    return t.type = "cuePoint",
                                        t.text = n.readString(a),
                                        t;
                                case 32:
                                    if (t.type = "channelPrefix",
                                        1 != a)
                                        throw "Expected length for channelPrefix event is 1, got " + a;
                                    return t.channel = n.readUInt8(),
                                        t;
                                case 33:
                                    if (t.type = "portPrefix",
                                        1 != a)
                                        throw "Expected length for portPrefix event is 1, got " + a;
                                    return t.port = n.readUInt8(),
                                        t;
                                case 47:
                                    if (t.type = "endOfTrack",
                                        0 != a)
                                        throw "Expected length for endOfTrack event is 0, got " + a;
                                    return t;
                                case 81:
                                    if (t.type = "setTempo",
                                        3 != a)
                                        throw "Expected length for setTempo event is 3, got " + a;
                                    return t.microsecondsPerBeat = n.readUInt24(),
                                        t;
                                case 84:
                                    if (t.type = "smpteOffset",
                                        5 != a)
                                        throw "Expected length for smpteOffset event is 5, got " + a;
                                    var o = n.readUInt8();
                                    return t.frameRate = {
                                        0: 24,
                                        32: 25,
                                        64: 29,
                                        96: 30
                                    }[96 & o],
                                        t.hour = 31 & o,
                                        t.min = n.readUInt8(),
                                        t.sec = n.readUInt8(),
                                        t.frame = n.readUInt8(),
                                        t.subFrame = n.readUInt8(),
                                        t;
                                case 88:
                                    if (t.type = "timeSignature",
                                        4 != a)
                                        throw "Expected length for timeSignature event is 4, got " + a;
                                    return t.numerator = n.readUInt8(),
                                        t.denominator = 1 << n.readUInt8(),
                                        t.metronome = n.readUInt8(),
                                        t.thirtyseconds = n.readUInt8(),
                                        t;
                                case 89:
                                    if (t.type = "keySignature",
                                        2 != a)
                                        throw "Expected length for keySignature event is 2, got " + a;
                                    return t.key = n.readInt8(),
                                        t.scale = n.readUInt8(),
                                        t;
                                case 127:
                                    return t.type = "sequencerSpecific",
                                        t.data = n.readBytes(a),
                                        t;
                                default:
                                    return t.type = "unknownMeta",
                                        t.data = n.readBytes(a),
                                        t.metatypeByte = i,
                                        t
                            }
                        } else {
                            var s;
                            if (0 == (128 & r)) {
                                if (null === e)
                                    throw "Running status byte encountered before status byte";
                                s = r,
                                    r = e,
                                    t.running = !0
                            } else
                                s = n.readUInt8(),
                                    e = r;
                            var c = r >> 4;
                            switch (t.channel = 15 & r,
                            c) {
                                case 8:
                                    return t.type = "noteOff",
                                        t.noteNumber = s,
                                        t.velocity = n.readUInt8(),
                                        t;
                                case 9:
                                    var u = n.readUInt8();
                                    return t.type = 0 === u ? "noteOff" : "noteOn",
                                        t.noteNumber = s,
                                        t.velocity = u,
                                        0 === u && (t.byte9 = !0),
                                        t;
                                case 10:
                                    return t.type = "noteAftertouch",
                                        t.noteNumber = s,
                                        t.amount = n.readUInt8(),
                                        t;
                                case 11:
                                    return t.type = "controller",
                                        t.controllerType = s,
                                        t.value = n.readUInt8(),
                                        t;
                                case 12:
                                    return t.type = "programChange",
                                        t.programNumber = s,
                                        t;
                                case 13:
                                    return t.type = "channelAftertouch",
                                        t.amount = s,
                                        t;
                                case 14:
                                    return t.type = "pitchBend",
                                        t.value = s + (n.readUInt8() << 7) - 8192,
                                        t;
                                default:
                                    throw "Unrecognised MIDI event type: " + c
                            }
                        }
                    }
                }
                function r(t) {
                    this.buffer = t,
                        this.bufferLen = this.buffer.length,
                        this.pos = 0
                }
                r.prototype.eof = function () {
                    return this.pos >= this.bufferLen
                }
                    ,
                    r.prototype.readUInt8 = function () {
                        var t = this.buffer[this.pos];
                        return this.pos += 1,
                            t
                    }
                    ,
                    r.prototype.readInt8 = function () {
                        var t = this.readUInt8();
                        return 128 & t ? t - 256 : t
                    }
                    ,
                    r.prototype.readUInt16 = function () {
                        return (this.readUInt8() << 8) + this.readUInt8()
                    }
                    ,
                    r.prototype.readInt16 = function () {
                        var t = this.readUInt16();
                        return 32768 & t ? t - 65536 : t
                    }
                    ,
                    r.prototype.readUInt24 = function () {
                        return (this.readUInt8() << 16) + (this.readUInt8() << 8) + this.readUInt8()
                    }
                    ,
                    r.prototype.readInt24 = function () {
                        var t = this.readUInt24();
                        return 8388608 & t ? t - 16777216 : t
                    }
                    ,
                    r.prototype.readUInt32 = function () {
                        return (this.readUInt8() << 24) + (this.readUInt8() << 16) + (this.readUInt8() << 8) + this.readUInt8()
                    }
                    ,
                    r.prototype.readBytes = function (t) {
                        var e = this.buffer.slice(this.pos, this.pos + t);
                        return this.pos += t,
                            e
                    }
                    ,
                    r.prototype.readString = function (t) {
                        var e = this.readBytes(t);
                        return String.fromCharCode.apply(null, e)
                    }
                    ,
                    r.prototype.readVarInt = function () {
                        for (var t = 0; !this.eof();) {
                            var e = this.readUInt8();
                            if (!(128 & e))
                                return t + e;
                            t += 127 & e,
                                t <<= 7
                        }
                        return t
                    }
                    ,
                    r.prototype.readChunk = function () {
                        var t = this.readString(4)
                            , e = this.readUInt32();
                        return {
                            id: t,
                            length: e,
                            data: this.readBytes(e)
                        }
                    }
                    ,
                    t.exports = function (t) {
                        var n = new r(t)
                            , i = n.readChunk();
                        if ("MThd" != i.id)
                            throw "Bad MIDI file.  Expected 'MHdr', got: '" + i.id + "'";
                        for (var a = function (t) {
                            var e = new r(t)
                                , n = {
                                    format: e.readUInt16(),
                                    numTracks: e.readUInt16()
                                }
                                , i = e.readUInt16();
                            return 32768 & i ? (n.framesPerSecond = 256 - (i >> 8),
                                n.ticksPerFrame = 255 & i) : n.ticksPerBeat = i,
                                n
                        }(i.data), o = [], s = 0; !n.eof() && s < a.numTracks; s++) {
                            var c = n.readChunk();
                            if ("MTrk" != c.id)
                                throw "Bad MIDI file.  Expected 'MTrk', got: '" + c.id + "'";
                            var u = e(c.data);
                            o.push(u)
                        }
                        return {
                            header: a,
                            tracks: o
                        }
                    }
            }
            ,
            865: t => {
                function e(t, e, i) {
                    var a, o = new n, s = e.length, c = null;
                    for (a = 0; a < s; a++)
                        !1 !== i.running && (i.running || e[a].running) || (c = null),
                            c = r(o, e[a], c, i.useByte9ForNoteOff);
                    t.writeChunk("MTrk", o.buffer)
                }
                function r(t, e, r, n) {
                    var i = e.type
                        , a = e.deltaTime
                        , o = e.text || ""
                        , s = e.data || []
                        , c = null;
                    switch (t.writeVarInt(a),
                    i) {
                        case "sequenceNumber":
                            t.writeUInt8(255),
                                t.writeUInt8(0),
                                t.writeVarInt(2),
                                t.writeUInt16(e.number);
                            break;
                        case "text":
                            t.writeUInt8(255),
                                t.writeUInt8(1),
                                t.writeVarInt(o.length),
                                t.writeString(o);
                            break;
                        case "copyrightNotice":
                            t.writeUInt8(255),
                                t.writeUInt8(2),
                                t.writeVarInt(o.length),
                                t.writeString(o);
                            break;
                        case "trackName":
                            t.writeUInt8(255),
                                t.writeUInt8(3),
                                t.writeVarInt(o.length),
                                t.writeString(o);
                            break;
                        case "instrumentName":
                            t.writeUInt8(255),
                                t.writeUInt8(4),
                                t.writeVarInt(o.length),
                                t.writeString(o);
                            break;
                        case "lyrics":
                            t.writeUInt8(255),
                                t.writeUInt8(5),
                                t.writeVarInt(o.length),
                                t.writeString(o);
                            break;
                        case "marker":
                            t.writeUInt8(255),
                                t.writeUInt8(6),
                                t.writeVarInt(o.length),
                                t.writeString(o);
                            break;
                        case "cuePoint":
                            t.writeUInt8(255),
                                t.writeUInt8(7),
                                t.writeVarInt(o.length),
                                t.writeString(o);
                            break;
                        case "channelPrefix":
                            t.writeUInt8(255),
                                t.writeUInt8(32),
                                t.writeVarInt(1),
                                t.writeUInt8(e.channel);
                            break;
                        case "portPrefix":
                            t.writeUInt8(255),
                                t.writeUInt8(33),
                                t.writeVarInt(1),
                                t.writeUInt8(e.port);
                            break;
                        case "endOfTrack":
                            t.writeUInt8(255),
                                t.writeUInt8(47),
                                t.writeVarInt(0);
                            break;
                        case "setTempo":
                            t.writeUInt8(255),
                                t.writeUInt8(81),
                                t.writeVarInt(3),
                                t.writeUInt24(e.microsecondsPerBeat);
                            break;
                        case "smpteOffset":
                            t.writeUInt8(255),
                                t.writeUInt8(84),
                                t.writeVarInt(5);
                            var u = 31 & e.hour | {
                                24: 0,
                                25: 32,
                                29: 64,
                                30: 96
                            }[e.frameRate];
                            t.writeUInt8(u),
                                t.writeUInt8(e.min),
                                t.writeUInt8(e.sec),
                                t.writeUInt8(e.frame),
                                t.writeUInt8(e.subFrame);
                            break;
                        case "timeSignature":
                            t.writeUInt8(255),
                                t.writeUInt8(88),
                                t.writeVarInt(4),
                                t.writeUInt8(e.numerator);
                            var h = 255 & Math.floor(Math.log(e.denominator) / Math.LN2);
                            t.writeUInt8(h),
                                t.writeUInt8(e.metronome),
                                t.writeUInt8(e.thirtyseconds || 8);
                            break;
                        case "keySignature":
                            t.writeUInt8(255),
                                t.writeUInt8(89),
                                t.writeVarInt(2),
                                t.writeInt8(e.key),
                                t.writeUInt8(e.scale);
                            break;
                        case "sequencerSpecific":
                            t.writeUInt8(255),
                                t.writeUInt8(127),
                                t.writeVarInt(s.length),
                                t.writeBytes(s);
                            break;
                        case "unknownMeta":
                            null != e.metatypeByte && (t.writeUInt8(255),
                                t.writeUInt8(e.metatypeByte),
                                t.writeVarInt(s.length),
                                t.writeBytes(s));
                            break;
                        case "sysEx":
                            t.writeUInt8(240),
                                t.writeVarInt(s.length),
                                t.writeBytes(s);
                            break;
                        case "endSysEx":
                            t.writeUInt8(247),
                                t.writeVarInt(s.length),
                                t.writeBytes(s);
                            break;
                        case "noteOff":
                            (c = (!1 !== n && e.byte9 || n && 0 == e.velocity ? 144 : 128) | e.channel) !== r && t.writeUInt8(c),
                                t.writeUInt8(e.noteNumber),
                                t.writeUInt8(e.velocity);
                            break;
                        case "noteOn":
                            (c = 144 | e.channel) !== r && t.writeUInt8(c),
                                t.writeUInt8(e.noteNumber),
                                t.writeUInt8(e.velocity);
                            break;
                        case "noteAftertouch":
                            (c = 160 | e.channel) !== r && t.writeUInt8(c),
                                t.writeUInt8(e.noteNumber),
                                t.writeUInt8(e.amount);
                            break;
                        case "controller":
                            (c = 176 | e.channel) !== r && t.writeUInt8(c),
                                t.writeUInt8(e.controllerType),
                                t.writeUInt8(e.value);
                            break;
                        case "programChange":
                            (c = 192 | e.channel) !== r && t.writeUInt8(c),
                                t.writeUInt8(e.programNumber);
                            break;
                        case "channelAftertouch":
                            (c = 208 | e.channel) !== r && t.writeUInt8(c),
                                t.writeUInt8(e.amount);
                            break;
                        case "pitchBend":
                            (c = 224 | e.channel) !== r && t.writeUInt8(c);
                            var f = 8192 + e.value
                                , p = 127 & f
                                , l = f >> 7 & 127;
                            t.writeUInt8(p),
                                t.writeUInt8(l);
                            break;
                        default:
                            throw "Unrecognized event type: " + i
                    }
                    return c
                }
                function n() {
                    this.buffer = []
                }
                n.prototype.writeUInt8 = function (t) {
                    this.buffer.push(255 & t)
                }
                    ,
                    n.prototype.writeInt8 = n.prototype.writeUInt8,
                    n.prototype.writeUInt16 = function (t) {
                        var e = t >> 8 & 255
                            , r = 255 & t;
                        this.writeUInt8(e),
                            this.writeUInt8(r)
                    }
                    ,
                    n.prototype.writeInt16 = n.prototype.writeUInt16,
                    n.prototype.writeUInt24 = function (t) {
                        var e = t >> 16 & 255
                            , r = t >> 8 & 255
                            , n = 255 & t;
                        this.writeUInt8(e),
                            this.writeUInt8(r),
                            this.writeUInt8(n)
                    }
                    ,
                    n.prototype.writeInt24 = n.prototype.writeUInt24,
                    n.prototype.writeUInt32 = function (t) {
                        var e = t >> 24 & 255
                            , r = t >> 16 & 255
                            , n = t >> 8 & 255
                            , i = 255 & t;
                        this.writeUInt8(e),
                            this.writeUInt8(r),
                            this.writeUInt8(n),
                            this.writeUInt8(i)
                    }
                    ,
                    n.prototype.writeInt32 = n.prototype.writeUInt32,
                    n.prototype.writeBytes = function (t) {
                        this.buffer = this.buffer.concat(Array.prototype.slice.call(t, 0))
                    }
                    ,
                    n.prototype.writeString = function (t) {
                        var e, r = t.length, n = [];
                        for (e = 0; e < r; e++)
                            n.push(t.codePointAt(e));
                        this.writeBytes(n)
                    }
                    ,
                    n.prototype.writeVarInt = function (t) {
                        if (t < 0)
                            throw "Cannot write negative variable-length integer";
                        if (t <= 127)
                            this.writeUInt8(t);
                        else {
                            var e = t
                                , r = [];
                            for (r.push(127 & e),
                                e >>= 7; e;) {
                                var n = 127 & e | 128;
                                r.push(n),
                                    e >>= 7
                            }
                            this.writeBytes(r.reverse())
                        }
                    }
                    ,
                    n.prototype.writeChunk = function (t, e) {
                        this.writeString(t),
                            this.writeUInt32(e.length),
                            this.writeBytes(e)
                    }
                    ,
                    t.exports = function (t, r) {
                        if ("object" != typeof t)
                            throw "Invalid MIDI data";
                        r = r || {};
                        var i, a = t.header || {}, o = t.tracks || [], s = o.length, c = new n;
                        for (function (t, e, r) {
                            var i = null == e.format ? 1 : e.format
                                , a = 128;
                            e.timeDivision ? a = e.timeDivision : e.ticksPerFrame && e.framesPerSecond ? a = -(255 & e.framesPerSecond) << 8 | 255 & e.ticksPerFrame : e.ticksPerBeat && (a = 32767 & e.ticksPerBeat);
                            var o = new n;
                            o.writeUInt16(i),
                                o.writeUInt16(r),
                                o.writeUInt16(a),
                                t.writeChunk("MThd", o.buffer)
                        }(c, a, s),
                            i = 0; i < s; i++)
                            e(c, o[i], r);
                        return c.buffer
                    }
            }
            ,
            805: (t, e) => {
                "use strict";
                function r(t, e, r) {
                    void 0 === r && (r = "ticks");
                    var n = 0
                        , i = t.length
                        , a = i;
                    if (i > 0 && t[i - 1][r] <= e)
                        return i - 1;
                    for (; n < a;) {
                        var o = Math.floor(n + (a - n) / 2)
                            , s = t[o]
                            , c = t[o + 1];
                        if (s[r] === e) {
                            for (var u = o; u < t.length; u++)
                                t[u][r] === e && (o = u);
                            return o
                        }
                        if (s[r] < e && c[r] > e)
                            return o;
                        s[r] > e ? a = o : s[r] < e && (n = o + 1)
                    }
                    return -1
                }
                Object.defineProperty(e, "__esModule", {
                    value: !0
                }),
                    e.insert = e.search = void 0,
                    e.search = r,
                    e.insert = function (t, e, n) {
                        if (void 0 === n && (n = "ticks"),
                            t.length) {
                            var i = r(t, e[n], n);
                            t.splice(i + 1, 0, e)
                        } else
                            t.push(e)
                    }
            }
            ,
            543: (t, e) => {
                "use strict";
                Object.defineProperty(e, "__esModule", {
                    value: !0
                }),
                    e.ControlChange = e.controlChangeIds = e.controlChangeNames = void 0,
                    e.controlChangeNames = {
                        1: "modulationWheel",
                        2: "breath",
                        4: "footController",
                        5: "portamentoTime",
                        7: "volume",
                        8: "balance",
                        10: "pan",
                        64: "sustain",
                        65: "portamentoTime",
                        66: "sostenuto",
                        67: "softPedal",
                        68: "legatoFootswitch",
                        84: "portamentoControl"
                    },
                    e.controlChangeIds = Object.keys(e.controlChangeNames).reduce((function (t, r) {
                        return t[e.controlChangeNames[r]] = r,
                            t
                    }
                    ), {});
                var r = new WeakMap
                    , n = new WeakMap
                    , i = function () {
                        function t(t, e) {
                            r.set(this, e),
                                n.set(this, t.controllerType),
                                this.ticks = t.absoluteTime,
                                this.value = t.value
                        }
                        return Object.defineProperty(t.prototype, "number", {
                            get: function () {
                                return n.get(this)
                            },
                            enumerable: !1,
                            configurable: !0
                        }),
                            Object.defineProperty(t.prototype, "name", {
                                get: function () {
                                    return e.controlChangeNames[this.number] ? e.controlChangeNames[this.number] : null
                                },
                                enumerable: !1,
                                configurable: !0
                            }),
                            Object.defineProperty(t.prototype, "time", {
                                get: function () {
                                    return r.get(this).ticksToSeconds(this.ticks)
                                },
                                set: function (t) {
                                    var e = r.get(this);
                                    this.ticks = e.secondsToTicks(t)
                                },
                                enumerable: !1,
                                configurable: !0
                            }),
                            t.prototype.toJSON = function () {
                                return {
                                    number: this.number,
                                    ticks: this.ticks,
                                    time: this.time,
                                    value: this.value
                                }
                            }
                            ,
                            t
                    }();
                e.ControlChange = i
            }
            ,
            906: (t, e, r) => {
                "use strict";
                Object.defineProperty(e, "__esModule", {
                    value: !0
                }),
                    e.createControlChanges = void 0;
                var n = r(543);
                e.createControlChanges = function () {
                    return new Proxy({}, {
                        get: function (t, e) {
                            return t[e] ? t[e] : n.controlChangeIds.hasOwnProperty(e) ? t[n.controlChangeIds[e]] : void 0
                        },
                        set: function (t, e, r) {
                            return n.controlChangeIds.hasOwnProperty(e) ? t[n.controlChangeIds[e]] = r : t[e] = r,
                                !0
                        }
                    })
                }
            }
            ,
            54: function (t, e, r) {
                "use strict";
                var n = this && this.__spreadArray || function (t, e, r) {
                    if (r || 2 === arguments.length)
                        for (var n, i = 0, a = e.length; i < a; i++)
                            !n && i in e || (n || (n = Array.prototype.slice.call(e, 0, i)),
                                n[i] = e[i]);
                    return t.concat(n || Array.prototype.slice.call(e))
                }
                    ;
                Object.defineProperty(e, "__esModule", {
                    value: !0
                }),
                    e.encode = void 0;
                var i = r(289)
                    , a = r(535)
                    , o = r(507);
                function s(t, e) {
                    return {
                        absoluteTime: t.ticks,
                        channel: e,
                        controllerType: t.number,
                        deltaTime: 0,
                        type: "controller",
                        value: Math.floor(127 * t.value)
                    }
                }
                function c(t) {
                    return {
                        absoluteTime: 0,
                        channel: t.channel,
                        deltaTime: 0,
                        programNumber: t.instrument.number,
                        type: "programChange"
                    }
                }
                e.encode = function (t) {
                    var e = {
                        header: {
                            format: 1,
                            numTracks: t.tracks.length + 1,
                            ticksPerBeat: t.header.ppq
                        },
                        tracks: n([n(n(n(n([{
                            absoluteTime: 0,
                            deltaTime: 0,
                            meta: !0,
                            text: t.header.name,
                            type: "trackName"
                        }], t.header.keySignatures.map((function (t) {
                            return function (t) {
                                var e = a.keySignatureKeys.indexOf(t.key);
                                return {
                                    absoluteTime: t.ticks,
                                    deltaTime: 0,
                                    key: e + 7,
                                    meta: !0,
                                    scale: "major" === t.scale ? 0 : 1,
                                    type: "keySignature"
                                }
                            }(t)
                        }
                        )), !0), t.header.meta.map((function (t) {
                            return {
                                absoluteTime: (e = t).ticks,
                                deltaTime: 0,
                                meta: !0,
                                text: e.text,
                                type: e.type
                            };
                            var e
                        }
                        )), !0), t.header.tempos.map((function (t) {
                            return function (t) {
                                return {
                                    absoluteTime: t.ticks,
                                    deltaTime: 0,
                                    meta: !0,
                                    microsecondsPerBeat: Math.floor(6e7 / t.bpm),
                                    type: "setTempo"
                                }
                            }(t)
                        }
                        )), !0), t.header.timeSignatures.map((function (t) {
                            return function (t) {
                                return {
                                    absoluteTime: t.ticks,
                                    deltaTime: 0,
                                    denominator: t.timeSignature[1],
                                    meta: !0,
                                    metronome: 24,
                                    numerator: t.timeSignature[0],
                                    thirtyseconds: 8,
                                    type: "timeSignature"
                                }
                            }(t)
                        }
                        )), !0)], t.tracks.map((function (t) {
                            return n(n(n([(e = t.name,
                            {
                                absoluteTime: 0,
                                deltaTime: 0,
                                meta: !0,
                                text: e,
                                type: "trackName"
                            }), c(t)], function (t) {
                                return (0,
                                    o.flatten)(t.notes.map((function (e) {
                                        return function (t, e) {
                                            return [{
                                                absoluteTime: t.ticks,
                                                channel: e,
                                                deltaTime: 0,
                                                noteNumber: t.midi,
                                                type: "noteOn",
                                                velocity: Math.floor(127 * t.velocity)
                                            }, {
                                                absoluteTime: t.ticks + t.durationTicks,
                                                channel: e,
                                                deltaTime: 0,
                                                noteNumber: t.midi,
                                                type: "noteOff",
                                                velocity: Math.floor(127 * t.noteOffVelocity)
                                            }]
                                        }(e, t.channel)
                                    }
                                    )))
                            }(t), !0), function (t) {
                                for (var e = [], r = 0; r < 127; r++)
                                    t.controlChanges.hasOwnProperty(r) && t.controlChanges[r].forEach((function (r) {
                                        e.push(s(r, t.channel))
                                    }
                                    ));
                                return e
                            }(t), !0), function (t) {
                                var e = [];
                                return t.pitchBends.forEach((function (r) {
                                    e.push(function (t, e) {
                                        return {
                                            absoluteTime: t.ticks,
                                            channel: e,
                                            deltaTime: 0,
                                            type: "pitchBend",
                                            value: t.value
                                        }
                                    }(r, t.channel))
                                }
                                )),
                                    e
                            }(t), !0);
                            var e
                        }
                        )), !0)
                    };
                    return e.tracks = e.tracks.map((function (t) {
                        t = t.sort((function (t, e) {
                            return t.absoluteTime - e.absoluteTime
                        }
                        ));
                        var e = 0;
                        return t.forEach((function (t) {
                            t.deltaTime = t.absoluteTime - e,
                                e = t.absoluteTime,
                                delete t.absoluteTime
                        }
                        )),
                            t.push({
                                deltaTime: 0,
                                meta: !0,
                                type: "endOfTrack"
                            }),
                            t
                    }
                    )),
                        new Uint8Array((0,
                            i.writeMidi)(e))
                }
            },
            535: (t, e, r) => {
                "use strict";
                Object.defineProperty(e, "__esModule", {
                    value: !0
                }),
                    e.Header = e.keySignatureKeys = void 0;
                var n = r(805)
                    , i = new WeakMap;
                e.keySignatureKeys = ["Cb", "Gb", "Db", "Ab", "Eb", "Bb", "F", "C", "G", "D", "A", "E", "B", "F#", "C#"];
                var a = function () {
                    function t(t) {
                        var r = this;
                        if (this.tempos = [],
                            this.timeSignatures = [],
                            this.keySignatures = [],
                            this.meta = [],
                            this.name = "",
                            i.set(this, 480),
                            t) {
                            i.set(this, t.header.ticksPerBeat),
                                t.tracks.forEach((function (t) {
                                    t.forEach((function (t) {
                                        t.meta && ("timeSignature" === t.type ? r.timeSignatures.push({
                                            ticks: t.absoluteTime,
                                            timeSignature: [t.numerator, t.denominator]
                                        }) : "setTempo" === t.type ? r.tempos.push({
                                            bpm: 6e7 / t.microsecondsPerBeat,
                                            ticks: t.absoluteTime
                                        }) : "keySignature" === t.type && r.keySignatures.push({
                                            key: e.keySignatureKeys[t.key + 7],
                                            scale: 0 === t.scale ? "major" : "minor",
                                            ticks: t.absoluteTime
                                        }))
                                    }
                                    ))
                                }
                                ));
                            var n = 0;
                            t.tracks[0].forEach((function (t) {
                                n += t.deltaTime,
                                    t.meta && ("trackName" === t.type ? r.name = t.text : "text" !== t.type && "cuePoint" !== t.type && "marker" !== t.type && "lyrics" !== t.type || r.meta.push({
                                        text: t.text,
                                        ticks: n,
                                        type: t.type
                                    }))
                            }
                            )),
                                this.update()
                        }
                    }
                    return t.prototype.update = function () {
                        var t = this
                            , e = 0
                            , r = 0;
                        this.tempos.sort((function (t, e) {
                            return t.ticks - e.ticks
                        }
                        )),
                            this.tempos.forEach((function (n, i) {
                                var a = i > 0 ? t.tempos[i - 1].bpm : t.tempos[0].bpm
                                    , o = n.ticks / t.ppq - r
                                    , s = 60 / a * o;
                                n.time = s + e,
                                    e = n.time,
                                    r += o
                            }
                            )),
                            this.timeSignatures.sort((function (t, e) {
                                return t.ticks - e.ticks
                            }
                            )),
                            this.timeSignatures.forEach((function (e, r) {
                                var n = r > 0 ? t.timeSignatures[r - 1] : t.timeSignatures[0]
                                    , i = (e.ticks - n.ticks) / t.ppq / n.timeSignature[0] / (n.timeSignature[1] / 4);
                                n.measures = n.measures || 0,
                                    e.measures = i + n.measures
                            }
                            ))
                    }
                        ,
                        t.prototype.ticksToSeconds = function (t) {
                            var e = (0,
                                n.search)(this.tempos, t);
                            if (-1 !== e) {
                                var r = this.tempos[e]
                                    , i = r.time
                                    , a = (t - r.ticks) / this.ppq;
                                return i + 60 / r.bpm * a
                            }
                            return t / this.ppq * .5
                        }
                        ,
                        t.prototype.ticksToMeasures = function (t) {
                            var e = (0,
                                n.search)(this.timeSignatures, t);
                            if (-1 !== e) {
                                var r = this.timeSignatures[e]
                                    , i = (t - r.ticks) / this.ppq;
                                return r.measures + i / (r.timeSignature[0] / r.timeSignature[1]) / 4
                            }
                            return t / this.ppq / 4
                        }
                        ,
                        Object.defineProperty(t.prototype, "ppq", {
                            get: function () {
                                return i.get(this)
                            },
                            enumerable: !1,
                            configurable: !0
                        }),
                        t.prototype.secondsToTicks = function (t) {
                            var e = (0,
                                n.search)(this.tempos, t, "time");
                            if (-1 !== e) {
                                var r = this.tempos[e]
                                    , i = (t - r.time) / (60 / r.bpm);
                                return Math.round(r.ticks + i * this.ppq)
                            }
                            var a = t / .5;
                            return Math.round(a * this.ppq)
                        }
                        ,
                        t.prototype.toJSON = function () {
                            return {
                                keySignatures: this.keySignatures,
                                meta: this.meta,
                                name: this.name,
                                ppq: this.ppq,
                                tempos: this.tempos.map((function (t) {
                                    return {
                                        bpm: t.bpm,
                                        ticks: t.ticks
                                    }
                                }
                                )),
                                timeSignatures: this.timeSignatures
                            }
                        }
                        ,
                        t.prototype.fromJSON = function (t) {
                            this.name = t.name,
                                this.tempos = t.tempos.map((function (t) {
                                    return Object.assign({}, t)
                                }
                                )),
                                this.timeSignatures = t.timeSignatures.map((function (t) {
                                    return Object.assign({}, t)
                                }
                                )),
                                this.keySignatures = t.keySignatures.map((function (t) {
                                    return Object.assign({}, t)
                                }
                                )),
                                this.meta = t.meta.map((function (t) {
                                    return Object.assign({}, t)
                                }
                                )),
                                i.set(this, t.ppq),
                                this.update()
                        }
                        ,
                        t.prototype.setTempo = function (t) {
                            this.tempos = [{
                                bpm: t,
                                ticks: 0
                            }],
                                this.update()
                        }
                        ,
                        t
                }();
                e.Header = a
            }
            ,
            362: (t, e, r) => {
                "use strict";
                Object.defineProperty(e, "__esModule", {
                    value: !0
                }),
                    e.Instrument = void 0;
                var n = r(438)
                    , i = new WeakMap
                    , a = function () {
                        function t(t, e) {
                            if (this.number = 0,
                                i.set(this, e),
                                this.number = 0,
                                t) {
                                var r = t.find((function (t) {
                                    return "programChange" === t.type
                                }
                                ));
                                r && (this.number = r.programNumber)
                            }
                        }
                        return Object.defineProperty(t.prototype, "name", {
                            get: function () {
                                return this.percussion ? n.DrumKitByPatchID[this.number] : n.instrumentByPatchID[this.number]
                            },
                            set: function (t) {
                                var e = n.instrumentByPatchID.indexOf(t);
                                -1 !== e && (this.number = e)
                            },
                            enumerable: !1,
                            configurable: !0
                        }),
                            Object.defineProperty(t.prototype, "family", {
                                get: function () {
                                    return this.percussion ? "drums" : n.InstrumentFamilyByID[Math.floor(this.number / 8)]
                                },
                                enumerable: !1,
                                configurable: !0
                            }),
                            Object.defineProperty(t.prototype, "percussion", {
                                get: function () {
                                    return 9 === i.get(this).channel
                                },
                                enumerable: !1,
                                configurable: !0
                            }),
                            t.prototype.toJSON = function () {
                                return {
                                    family: this.family,
                                    number: this.number,
                                    name: this.name
                                }
                            }
                            ,
                            t.prototype.fromJSON = function (t) {
                                this.number = t.number
                            }
                            ,
                            t
                    }();
                e.Instrument = a
            }
            ,
            438: (t, e) => {
                "use strict";
                Object.defineProperty(e, "__esModule", {
                    value: !0
                }),
                    e.DrumKitByPatchID = e.InstrumentFamilyByID = e.instrumentByPatchID = void 0,
                    e.instrumentByPatchID = ["acoustic grand piano", "bright acoustic piano", "electric grand piano", "honky-tonk piano", "electric piano 1", "electric piano 2", "harpsichord", "clavi", "celesta", "glockenspiel", "music box", "vibraphone", "marimba", "xylophone", "tubular bells", "dulcimer", "drawbar organ", "percussive organ", "rock organ", "church organ", "reed organ", "accordion", "harmonica", "tango accordion", "acoustic guitar (nylon)", "acoustic guitar (steel)", "electric guitar (jazz)", "electric guitar (clean)", "electric guitar (muted)", "overdriven guitar", "distortion guitar", "guitar harmonics", "acoustic bass", "electric bass (finger)", "electric bass (pick)", "fretless bass", "slap bass 1", "slap bass 2", "synth bass 1", "synth bass 2", "violin", "viola", "cello", "contrabass", "tremolo strings", "pizzicato strings", "orchestral harp", "timpani", "string ensemble 1", "string ensemble 2", "synthstrings 1", "synthstrings 2", "choir aahs", "voice oohs", "synth voice", "orchestra hit", "trumpet", "trombone", "tuba", "muted trumpet", "french horn", "brass section", "synthbrass 1", "synthbrass 2", "soprano sax", "alto sax", "tenor sax", "baritone sax", "oboe", "english horn", "bassoon", "clarinet", "piccolo", "flute", "recorder", "pan flute", "blown bottle", "shakuhachi", "whistle", "ocarina", "lead 1 (square)", "lead 2 (sawtooth)", "lead 3 (calliope)", "lead 4 (chiff)", "lead 5 (charang)", "lead 6 (voice)", "lead 7 (fifths)", "lead 8 (bass + lead)", "pad 1 (new age)", "pad 2 (warm)", "pad 3 (polysynth)", "pad 4 (choir)", "pad 5 (bowed)", "pad 6 (metallic)", "pad 7 (halo)", "pad 8 (sweep)", "fx 1 (rain)", "fx 2 (soundtrack)", "fx 3 (crystal)", "fx 4 (atmosphere)", "fx 5 (brightness)", "fx 6 (goblins)", "fx 7 (echoes)", "fx 8 (sci-fi)", "sitar", "banjo", "shamisen", "koto", "kalimba", "bag pipe", "fiddle", "shanai", "tinkle bell", "agogo", "steel drums", "woodblock", "taiko drum", "melodic tom", "synth drum", "reverse cymbal", "guitar fret noise", "breath noise", "seashore", "bird tweet", "telephone ring", "helicopter", "applause", "gunshot"],
                    e.InstrumentFamilyByID = ["piano", "chromatic percussion", "organ", "guitar", "bass", "strings", "ensemble", "brass", "reed", "pipe", "synth lead", "synth pad", "synth effects", "world", "percussive", "sound effects"],
                    e.DrumKitByPatchID = {
                        0: "standard kit",
                        8: "room kit",
                        16: "power kit",
                        24: "electronic kit",
                        25: "tr-808 kit",
                        32: "jazz kit",
                        40: "brush kit",
                        48: "orchestra kit",
                        56: "sound fx kit"
                    }
            }
            ,
            233: function (t, e, r) {
                "use strict";
                var n = this && this.__awaiter || function (t, e, r, n) {
                    return new (r || (r = Promise))((function (i, a) {
                        function o(t) {
                            try {
                                c(n.next(t))
                            } catch (t) {
                                a(t)
                            }
                        }
                        function s(t) {
                            try {
                                c(n.throw(t))
                            } catch (t) {
                                a(t)
                            }
                        }
                        function c(t) {
                            var e;
                            t.done ? i(t.value) : (e = t.value,
                                e instanceof r ? e : new r((function (t) {
                                    t(e)
                                }
                                ))).then(o, s)
                        }
                        c((n = n.apply(t, e || [])).next())
                    }
                    ))
                }
                    , i = this && this.__generator || function (t, e) {
                        var r, n, i, a, o = {
                            label: 0,
                            sent: function () {
                                if (1 & i[0])
                                    throw i[1];
                                return i[1]
                            },
                            trys: [],
                            ops: []
                        };
                        return a = {
                            next: s(0),
                            throw: s(1),
                            return: s(2)
                        },
                            "function" == typeof Symbol && (a[Symbol.iterator] = function () {
                                return this
                            }
                            ),
                            a;
                        function s(a) {
                            return function (s) {
                                return function (a) {
                                    if (r)
                                        throw new TypeError("Generator is already executing.");
                                    for (; o;)
                                        try {
                                            if (r = 1,
                                                n && (i = 2 & a[0] ? n.return : a[0] ? n.throw || ((i = n.return) && i.call(n),
                                                    0) : n.next) && !(i = i.call(n, a[1])).done)
                                                return i;
                                            switch (n = 0,
                                            i && (a = [2 & a[0], i.value]),
                                            a[0]) {
                                                case 0:
                                                case 1:
                                                    i = a;
                                                    break;
                                                case 4:
                                                    return o.label++,
                                                    {
                                                        value: a[1],
                                                        done: !1
                                                    };
                                                case 5:
                                                    o.label++,
                                                        n = a[1],
                                                        a = [0];
                                                    continue;
                                                case 7:
                                                    a = o.ops.pop(),
                                                        o.trys.pop();
                                                    continue;
                                                default:
                                                    if (!((i = (i = o.trys).length > 0 && i[i.length - 1]) || 6 !== a[0] && 2 !== a[0])) {
                                                        o = 0;
                                                        continue
                                                    }
                                                    if (3 === a[0] && (!i || a[1] > i[0] && a[1] < i[3])) {
                                                        o.label = a[1];
                                                        break
                                                    }
                                                    if (6 === a[0] && o.label < i[1]) {
                                                        o.label = i[1],
                                                            i = a;
                                                        break
                                                    }
                                                    if (i && o.label < i[2]) {
                                                        o.label = i[2],
                                                            o.ops.push(a);
                                                        break
                                                    }
                                                    i[2] && o.ops.pop(),
                                                        o.trys.pop();
                                                    continue
                                            }
                                            a = e.call(t, o)
                                        } catch (t) {
                                            a = [6, t],
                                                n = 0
                                        } finally {
                                            r = i = 0
                                        }
                                    if (5 & a[0])
                                        throw a[1];
                                    return {
                                        value: a[0] ? a[1] : void 0,
                                        done: !0
                                    }
                                }([a, s])
                            }
                        }
                    }
                    ;
                Object.defineProperty(e, "__esModule", {
                    value: !0
                }),
                    e.Header = e.Track = e.Midi = void 0;
                var a = r(289)
                    , o = r(535)
                    , s = r(334)
                    , c = r(54)
                    , u = function () {
                        function t(t) {
                            var e = this
                                , r = null;
                            if (t) {
                                var n = t instanceof ArrayBuffer ? new Uint8Array(t) : t;
                                (r = (0,
                                    a.parseMidi)(n)).tracks.forEach((function (t) {
                                        var e = 0;
                                        t.forEach((function (t) {
                                            e += t.deltaTime,
                                                t.absoluteTime = e
                                        }
                                        ))
                                    }
                                    )),
                                    r.tracks = function (t) {
                                        for (var e = [], r = 0; r < t.length; r++)
                                            for (var n = e.length, i = new Map, a = Array(16).fill(0), o = 0, s = t[r]; o < s.length; o++) {
                                                var c = s[o]
                                                    , u = n
                                                    , h = c.channel;
                                                if (void 0 !== h) {
                                                    "programChange" === c.type && (a[h] = c.programNumber);
                                                    var f = a[h]
                                                        , p = "".concat(f, " ").concat(h);
                                                    i.has(p) ? u = i.get(p) : (u = n + i.size,
                                                        i.set(p, u))
                                                }
                                                e[u] || e.push([]),
                                                    e[u].push(c)
                                            }
                                        return e
                                    }(r.tracks)
                            }
                            this.header = new o.Header(r),
                                this.tracks = [],
                                t && (this.tracks = r.tracks.map((function (t) {
                                    return new s.Track(t, e.header)
                                }
                                )),
                                    1 === r.header.format && 0 === this.tracks[0].duration && this.tracks.shift())
                        }
                        return t.fromUrl = function (e) {
                            return n(this, void 0, void 0, (function () {
                                var r;
                                return i(this, (function (n) {
                                    switch (n.label) {
                                        case 0:
                                            return [4, fetch(e)];
                                        case 1:
                                            return (r = n.sent()).ok ? [4, r.arrayBuffer()] : [3, 3];
                                        case 2:
                                            return [2, new t(n.sent())];
                                        case 3:
                                            throw new Error("Could not load '".concat(e, "'"))
                                    }
                                }
                                ))
                            }
                            ))
                        }
                            ,
                            Object.defineProperty(t.prototype, "name", {
                                get: function () {
                                    return this.header.name
                                },
                                set: function (t) {
                                    this.header.name = t
                                },
                                enumerable: !1,
                                configurable: !0
                            }),
                            Object.defineProperty(t.prototype, "duration", {
                                get: function () {
                                    var t = this.tracks.map((function (t) {
                                        return t.duration
                                    }
                                    ));
                                    return Math.max.apply(Math, t)
                                },
                                enumerable: !1,
                                configurable: !0
                            }),
                            Object.defineProperty(t.prototype, "durationTicks", {
                                get: function () {
                                    var t = this.tracks.map((function (t) {
                                        return t.durationTicks
                                    }
                                    ));
                                    return Math.max.apply(Math, t)
                                },
                                enumerable: !1,
                                configurable: !0
                            }),
                            t.prototype.addTrack = function () {
                                var t = new s.Track(void 0, this.header);
                                return this.tracks.push(t),
                                    t
                            }
                            ,
                            t.prototype.toArray = function () {
                                return (0,
                                    c.encode)(this)
                            }
                            ,
                            t.prototype.toJSON = function () {
                                return {
                                    header: this.header.toJSON(),
                                    tracks: this.tracks.map((function (t) {
                                        return t.toJSON()
                                    }
                                    ))
                                }
                            }
                            ,
                            t.prototype.fromJSON = function (t) {
                                var e = this;
                                this.header = new o.Header,
                                    this.header.fromJSON(t.header),
                                    this.tracks = t.tracks.map((function (t) {
                                        var r = new s.Track(void 0, e.header);
                                        return r.fromJSON(t),
                                            r
                                    }
                                    ))
                            }
                            ,
                            t.prototype.clone = function () {
                                var e = new t;
                                return e.fromJSON(this.toJSON()),
                                    e
                            }
                            ,
                            t
                    }();
                e.Midi = u;
                var h = r(334);
                Object.defineProperty(e, "Track", {
                    enumerable: !0,
                    get: function () {
                        return h.Track
                    }
                });
                var f = r(535);
                Object.defineProperty(e, "Header", {
                    enumerable: !0,
                    get: function () {
                        return f.Header
                    }
                })
            },
            518: (t, e) => {
                "use strict";
                function r(t) {
                    return ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][t % 12]
                }
                Object.defineProperty(e, "__esModule", {
                    value: !0
                }),
                    e.Note = void 0;
                var n, i, a = (n = /^([a-g]{1}(?:b|#|x|bb)?)(-?[0-9]+)/i,
                    i = {
                        cbb: -2,
                        cb: -1,
                        c: 0,
                        "c#": 1,
                        cx: 2,
                        dbb: 0,
                        db: 1,
                        d: 2,
                        "d#": 3,
                        dx: 4,
                        ebb: 2,
                        eb: 3,
                        e: 4,
                        "e#": 5,
                        ex: 6,
                        fbb: 3,
                        fb: 4,
                        f: 5,
                        "f#": 6,
                        fx: 7,
                        gbb: 5,
                        gb: 6,
                        g: 7,
                        "g#": 8,
                        gx: 9,
                        abb: 7,
                        ab: 8,
                        a: 9,
                        "a#": 10,
                        ax: 11,
                        bbb: 9,
                        bb: 10,
                        b: 11,
                        "b#": 12,
                        bx: 13
                    },
                    function (t) {
                        var e = n.exec(t)
                            , r = e[1]
                            , a = e[2];
                        return i[r.toLowerCase()] + 12 * (parseInt(a, 10) + 1)
                    }
                ), o = new WeakMap, s = function () {
                    function t(t, e, r) {
                        o.set(this, r),
                            this.midi = t.midi,
                            this.velocity = t.velocity,
                            this.noteOffVelocity = e.velocity,
                            this.ticks = t.ticks,
                            this.durationTicks = e.ticks - t.ticks
                    }
                    return Object.defineProperty(t.prototype, "name", {
                        get: function () {
                            return t = this.midi,
                                e = Math.floor(t / 12) - 1,
                                r(t) + e.toString();
                            var t, e
                        },
                        set: function (t) {
                            this.midi = a(t)
                        },
                        enumerable: !1,
                        configurable: !0
                    }),
                        Object.defineProperty(t.prototype, "octave", {
                            get: function () {
                                return Math.floor(this.midi / 12) - 1
                            },
                            set: function (t) {
                                var e = t - this.octave;
                                this.midi += 12 * e
                            },
                            enumerable: !1,
                            configurable: !0
                        }),
                        Object.defineProperty(t.prototype, "pitch", {
                            get: function () {
                                return r(this.midi)
                            },
                            set: function (t) {
                                this.midi = 12 * (this.octave + 1) + ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].indexOf(t)
                            },
                            enumerable: !1,
                            configurable: !0
                        }),
                        Object.defineProperty(t.prototype, "duration", {
                            get: function () {
                                var t = o.get(this);
                                return t.ticksToSeconds(this.ticks + this.durationTicks) - t.ticksToSeconds(this.ticks)
                            },
                            set: function (t) {
                                var e = o.get(this).secondsToTicks(this.time + t);
                                this.durationTicks = e - this.ticks
                            },
                            enumerable: !1,
                            configurable: !0
                        }),
                        Object.defineProperty(t.prototype, "time", {
                            get: function () {
                                return o.get(this).ticksToSeconds(this.ticks)
                            },
                            set: function (t) {
                                var e = o.get(this);
                                this.ticks = e.secondsToTicks(t)
                            },
                            enumerable: !1,
                            configurable: !0
                        }),
                        Object.defineProperty(t.prototype, "bars", {
                            get: function () {
                                return o.get(this).ticksToMeasures(this.ticks)
                            },
                            enumerable: !1,
                            configurable: !0
                        }),
                        t.prototype.toJSON = function () {
                            return {
                                duration: this.duration,
                                durationTicks: this.durationTicks,
                                midi: this.midi,
                                name: this.name,
                                ticks: this.ticks,
                                time: this.time,
                                velocity: this.velocity
                            }
                        }
                        ,
                        t
                }();
                e.Note = s
            }
            ,
            882: (t, e) => {
                "use strict";
                Object.defineProperty(e, "__esModule", {
                    value: !0
                }),
                    e.PitchBend = void 0;
                var r = new WeakMap
                    , n = function () {
                        function t(t, e) {
                            r.set(this, e),
                                this.ticks = t.absoluteTime,
                                this.value = t.value
                        }
                        return Object.defineProperty(t.prototype, "time", {
                            get: function () {
                                return r.get(this).ticksToSeconds(this.ticks)
                            },
                            set: function (t) {
                                var e = r.get(this);
                                this.ticks = e.secondsToTicks(t)
                            },
                            enumerable: !1,
                            configurable: !0
                        }),
                            t.prototype.toJSON = function () {
                                return {
                                    ticks: this.ticks,
                                    time: this.time,
                                    value: this.value
                                }
                            }
                            ,
                            t
                    }();
                e.PitchBend = n
            }
            ,
            334: (t, e, r) => {
                "use strict";
                Object.defineProperty(e, "__esModule", {
                    value: !0
                }),
                    e.Track = void 0;
                var n = r(805)
                    , i = r(543)
                    , a = r(906)
                    , o = r(882)
                    , s = r(362)
                    , c = r(518)
                    , u = new WeakMap
                    , h = function () {
                        function t(t, e) {
                            var r = this;
                            if (this.name = "",
                                this.notes = [],
                                this.controlChanges = (0,
                                    a.createControlChanges)(),
                                this.pitchBends = [],
                                u.set(this, e),
                                t) {
                                var n = t.find((function (t) {
                                    return "trackName" === t.type
                                }
                                ));
                                this.name = n ? n.text : ""
                            }
                            if (this.instrument = new s.Instrument(t, this),
                                this.channel = 0,
                                t) {
                                for (var i = t.filter((function (t) {
                                    return "noteOn" === t.type
                                }
                                )), o = t.filter((function (t) {
                                    return "noteOff" === t.type
                                }
                                )), c = function () {
                                    var t = i.shift();
                                    h.channel = t.channel;
                                    var e = o.findIndex((function (e) {
                                        return e.noteNumber === t.noteNumber && e.absoluteTime >= t.absoluteTime
                                    }
                                    ));
                                    if (-1 !== e) {
                                        var r = o.splice(e, 1)[0];
                                        h.addNote({
                                            durationTicks: r.absoluteTime - t.absoluteTime,
                                            midi: t.noteNumber,
                                            noteOffVelocity: r.velocity / 127,
                                            ticks: t.absoluteTime,
                                            velocity: t.velocity / 127
                                        })
                                    }
                                }, h = this; i.length;)
                                    c();
                                t.filter((function (t) {
                                    return "controller" === t.type
                                }
                                )).forEach((function (t) {
                                    r.addCC({
                                        number: t.controllerType,
                                        ticks: t.absoluteTime,
                                        value: t.value / 127
                                    })
                                }
                                )),
                                    t.filter((function (t) {
                                        return "pitchBend" === t.type
                                    }
                                    )).forEach((function (t) {
                                        r.addPitchBend({
                                            ticks: t.absoluteTime,
                                            value: t.value / Math.pow(2, 13)
                                        })
                                    }
                                    ));
                                var f = t.find((function (t) {
                                    return "endOfTrack" === t.type
                                }
                                ));
                                this.endOfTrackTicks = void 0 !== f ? f.absoluteTime : void 0
                            }
                        }
                        return t.prototype.addNote = function (t) {
                            var e = u.get(this)
                                , r = new c.Note({
                                    midi: 0,
                                    ticks: 0,
                                    velocity: 1
                                }, {
                                    ticks: 0,
                                    velocity: 0
                                }, e);
                            return Object.assign(r, t),
                                (0,
                                    n.insert)(this.notes, r, "ticks"),
                                this
                        }
                            ,
                            t.prototype.addCC = function (t) {
                                var e = u.get(this)
                                    , r = new i.ControlChange({
                                        controllerType: t.number
                                    }, e);
                                return delete t.number,
                                    Object.assign(r, t),
                                    Array.isArray(this.controlChanges[r.number]) || (this.controlChanges[r.number] = []),
                                    (0,
                                        n.insert)(this.controlChanges[r.number], r, "ticks"),
                                    this
                            }
                            ,
                            t.prototype.addPitchBend = function (t) {
                                var e = u.get(this)
                                    , r = new o.PitchBend({}, e);
                                return Object.assign(r, t),
                                    (0,
                                        n.insert)(this.pitchBends, r, "ticks"),
                                    this
                            }
                            ,
                            Object.defineProperty(t.prototype, "duration", {
                                get: function () {
                                    if (!this.notes.length)
                                        return 0;
                                    for (var t = this.notes[this.notes.length - 1].time + this.notes[this.notes.length - 1].duration, e = 0; e < this.notes.length - 1; e++) {
                                        var r = this.notes[e].time + this.notes[e].duration;
                                        t < r && (t = r)
                                    }
                                    return t
                                },
                                enumerable: !1,
                                configurable: !0
                            }),
                            Object.defineProperty(t.prototype, "durationTicks", {
                                get: function () {
                                    if (!this.notes.length)
                                        return 0;
                                    for (var t = this.notes[this.notes.length - 1].ticks + this.notes[this.notes.length - 1].durationTicks, e = 0; e < this.notes.length - 1; e++) {
                                        var r = this.notes[e].ticks + this.notes[e].durationTicks;
                                        t < r && (t = r)
                                    }
                                    return t
                                },
                                enumerable: !1,
                                configurable: !0
                            }),
                            t.prototype.fromJSON = function (t) {
                                var e = this;
                                for (var r in this.name = t.name,
                                    this.channel = t.channel,
                                    this.instrument = new s.Instrument(void 0, this),
                                    this.instrument.fromJSON(t.instrument),
                                    void 0 !== t.endOfTrackTicks && (this.endOfTrackTicks = t.endOfTrackTicks),
                                    t.controlChanges)
                                    t.controlChanges[r] && t.controlChanges[r].forEach((function (t) {
                                        e.addCC({
                                            number: t.number,
                                            ticks: t.ticks,
                                            value: t.value
                                        })
                                    }
                                    ));
                                t.notes.forEach((function (t) {
                                    e.addNote({
                                        durationTicks: t.durationTicks,
                                        midi: t.midi,
                                        ticks: t.ticks,
                                        velocity: t.velocity
                                    })
                                }
                                ))
                            }
                            ,
                            t.prototype.toJSON = function () {
                                for (var t = {}, e = 0; e < 127; e++)
                                    this.controlChanges.hasOwnProperty(e) && (t[e] = this.controlChanges[e].map((function (t) {
                                        return t.toJSON()
                                    }
                                    )));
                                var r = {
                                    channel: this.channel,
                                    controlChanges: t,
                                    pitchBends: this.pitchBends.map((function (t) {
                                        return t.toJSON()
                                    }
                                    )),
                                    instrument: this.instrument.toJSON(),
                                    name: this.name,
                                    notes: this.notes.map((function (t) {
                                        return t.toJSON()
                                    }
                                    ))
                                };
                                return void 0 !== this.endOfTrackTicks && (r.endOfTrackTicks = this.endOfTrackTicks),
                                    r
                            }
                            ,
                            t
                    }();
                e.Track = h
            }
        }
            , e = {};
        function r(n) {
            var i = e[n];
            if (void 0 !== i)
                return i.exports;
            var a = e[n] = {
                exports: {}
            };
            return t[n].call(a.exports, a, a.exports, r),
                a.exports
        }
        return r.d = (t, e) => {
            for (var n in e)
                r.o(e, n) && !r.o(t, n) && Object.defineProperty(t, n, {
                    enumerable: !0,
                    get: e[n]
                })
        }
            ,
            r.o = (t, e) => Object.prototype.hasOwnProperty.call(t, e),
            r.r = t => {
                "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(t, Symbol.toStringTag, {
                    value: "Module"
                }),
                    Object.defineProperty(t, "__esModule", {
                        value: !0
                    })
            }
            ,
            r(233)
    }
    )()
}
));
//# sourceMappingURL=Midi.js.map
