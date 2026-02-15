import type { CCXML } from "./ccxml.ts";
import { create } from 'xmlbuilder2';
import { formatXmlNotes, notesToXmlNotes, xmlNodeDuration, type XmlNoteElement } from "./xmltype.ts";

export default function app(input: CCXML) {
    const root = create({ version: '1.0', encoding: 'UTF-8' })
        .dtd({
            pubID: '-//Recordare//DTD MusicXML 4.0 Partwise//EN',
            sysID: 'http://www.musicxml.org/dtds/partwise.dtd'
        })
        .ele('score-partwise', { version: "4.0" });


    const scoreTitle = input.title.title; //标题
    //#region-以下全是废话：
    // Work
    root.ele('work').ele('work-title').txt(scoreTitle);

    // Identification
    const ident = root.ele('identification');
    ident.ele('creator', { type: "composer" }).txt("作曲 / 编排");
    const encoding = ident.ele('encoding');
    encoding.ele('software').txt("bszapp/ccmz-to-midi");
    encoding.ele('encoding-date').txt(new Date().toISOString().split('T')[0] || "");
    encoding.ele('supports', { element: "accidental", type: "yes" });
    encoding.ele('supports', { element: "beam", type: "yes" });
    encoding.ele('supports', { element: "print", attribute: "new-page", type: "yes", value: "yes" });
    encoding.ele('supports', { element: "print", attribute: "new-system", type: "yes", value: "yes" });
    encoding.ele('supports', { element: "stem", type: "yes" });
    const misc = ident.ele('miscellaneous');
    misc.ele('miscellaneous-field', { name: "creationDate" }).txt("1145-01-04");
    misc.ele('miscellaneous-field', { name: "platform" }).txt("Microsoft Windows");
    misc.ele('miscellaneous-field', { name: "subtitle" }).txt("副标题");

    // Defaults
    const defs = root.ele('defaults');
    defs.ele('scaling').ele('millimeters').txt("6.99911").up().ele('tenths').txt("40");
    const pgLayout = defs.ele('page-layout');

    //页面尺寸
    pgLayout.ele('page-height').txt((input.page.h || 1700).toString());
    pgLayout.ele('page-width').txt((input.page.w || 1200).toString());

    pgLayout.ele('page-margins', { type: "even" }).ele('left-margin').txt("85.7252").up().ele('right-margin').txt("85.7252").up().ele('top-margin').txt("85.7252").up().ele('bottom-margin').txt("85.7252");
    pgLayout.ele('page-margins', { type: "odd" }).ele('left-margin').txt("85.7252").up().ele('right-margin').txt("85.7252").up().ele('top-margin').txt("85.7252").up().ele('bottom-margin').txt("85.7252");

    const apper = defs.ele('appearance');
    const lineLayouts = [
        { type: "light barline", val: "1.8" }, { type: "heavy barline", val: "5.5" }, { type: "beam", val: "5" },
        { type: "bracket", val: "4.5" }, { type: "dashes", val: "1" }, { type: "enclosure", val: "1" },
        { type: "ending", val: "1.1" }, { type: "extend", val: "1" }, { type: "leger", val: "1.6" },
        { type: "pedal", val: "1.1" }, { type: "octave shift", val: "1.1" }, { type: "slur middle", val: "2.1" },
        { type: "slur tip", val: "0.5" }, { type: "staff", val: "1.1" }, { type: "stem", val: "1" },
        { type: "tie middle", val: "2.1" }, { type: "tie tip", val: "0.5" }, { type: "tuplet bracket", val: "1" },
        { type: "wedge", val: "1.2" }
    ];
    lineLayouts.forEach(l => apper.ele('line-width', { type: l.type }).txt(l.val));
    apper.ele('note-size', { type: "cue" }).txt("70");
    apper.ele('note-size', { type: "grace" }).txt("70");
    apper.ele('note-size', { type: "grace-cue" }).txt("49");

    defs.ele('music-font', { 'font-family': "Leland" });
    defs.ele('word-font', { 'font-family': "Edwin", 'font-size': "10" });
    defs.ele('lyric-font', { 'font-family': "Edwin", 'font-size': "10" });

    // Credit
    const c1 = root.ele('credit', { page: "1" });
    c1.ele('credit-type').txt("title");
    c1.ele('credit-words', {
        'default-x': "600.241935",
        'default-y': "1611.210312",
        justify: "center",
        valign: "top",
        'font-size': "22"
    }).txt(scoreTitle);

    const c2 = root.ele('credit', { page: "1" });
    c2.ele('credit-type').txt("composer");
    c2.ele('credit-words', {
        'default-x': "1114.7587",
        'default-y': "1511.210312",
        justify: "right",
        valign: "bottom"
    }).txt(input.title.composer);
    //#region =========

    const typeMap: Record<number, string> = { 1: 'whole', 2: 'half', 4: 'quarter', 8: 'eighth', 16: '16th', 32: '32nd' };

    const partList = root.ele('part-list');
    input.parts.forEach((p, i) => {
        const pid = `P${i + 1}`;
        const scorePart = partList.ele('score-part', { id: pid });
        // 接口无 partName，使用标题或默认值
        scorePart.ele('part-name').txt(input.title.title || "Piano").up()
            .ele('part-abbreviation').txt(pid).up()
            .ele('score-instrument', { id: `${pid}-I1` }).ele('instrument-name').txt("Piano").up().ele('instrument-sound').txt("keyboard.piano").up().up()
            .ele('midi-device', { id: `${pid}-I1`, port: "1" }).up()
            .ele('midi-instrument', { id: `${pid}-I1` })
            .ele('midi-channel').txt("1").up()
            .ele('midi-program').txt("1").up()
            .ele('volume').txt("78.7402").up()
            .ele('pan').txt("0");
    });

    input.parts.forEach((p, pIdx) => {
        //#region-1:分每个乐器
        //（钢琴？小提琴？……）

        const part = root.ele('part', { id: `P${pIdx + 1}` });

        //圆滑线记录
        const slurStatus = new Map<number, number>();

        p.measures.forEach((m, mIdx) => {
            //#region-2:分小节
            //（第一小节、第二小节……）

            console.log(`===========\n第${mIdx + 1}小节`);

            if ([9].includes(mIdx + 1)) {
                console.log('TEST', JSON.stringify(m))
            }

            const meas = part.ele('measure', { number: m.num, width: m.w.toString() });

            // 换行
            if (input.lines.some(line => line.m1 === mIdx)) {

                let p1;
                if (mIdx === 0) {
                    p1 = meas.ele('print');
                    const sysLayout = p1.ele('system-layout');
                    sysLayout.ele('system-margins').ele('left-margin').txt("50").up().ele('right-margin').txt("0");
                    sysLayout.ele('top-system-distance').txt("170");
                } else {
                    p1 = meas.ele('print', { 'new-system': 'yes' });
                    const sysLayout = p1.ele('system-layout');
                    sysLayout.ele('system-margins').ele('left-margin').txt("0").up().ele('right-margin').txt("0");
                    sysLayout.ele('system-distance').txt("237.5");
                }

                if (m.staves > 1) {
                    p1.ele('staff-layout', { number: "2" }).ele('staff-distance').txt("65");
                }
            }

            // 属性设置
            if (mIdx === 0 || m.fifths || m.time || m.clefs) {
                const attr = meas.ele('attributes');
                //刻度？
                attr.ele('divisions').txt("4");
                if (m.fifths) attr.ele('key').ele('fifths').txt(m.fifths.fifths.toString());
                if (m.time) attr.ele('time').ele('beats').txt(m.time.beats.toString()).up().ele('beat-type').txt(m.time.beatu.toString());
                if (m.staves) attr.ele('staves').txt(m.staves.toString());
                if (m.clefs) {
                    m.clefs.forEach(c => {
                        const clef = attr.ele('clef', { number: c.staff.toString() });
                        const isTreble = c.clef === 'Treble';
                        clef.ele('sign').txt(isTreble ? 'G' : 'F').up().ele('line').txt(isTreble ? '2' : '4');
                    });
                }
            }

            // 速度标记
            if (m.dirs) {
                m.dirs.forEach(d => {
                    if (d.type === 'metronome') {
                        const dir = meas.ele('direction', { placement: "above" });
                        const met = dir.ele('direction-type').ele('metronome', { parentheses: "no" });
                        met.att('default-x', d.param.x.toString()).att('relative-y', "20");
                        met.ele('beat-unit').txt("quarter").up().ele('per-minute').txt(d.value || "60");
                        dir.ele('staff').txt(d.staff.toString());
                        dir.ele('sound', { tempo: d.value || "60" });
                    }
                });
            }

            const xmlNotes = notesToXmlNotes(m);
            xmlNotes.forEach((xmlNote, xmlNoteIdx) => {
                //#region-3:分声部+谱表
                console.log(`声部${xmlNote.trackId}:${formatXmlNotes(xmlNote.notes)}`);

                let trackTotalDuration = 0;

                xmlNote.notes.forEach((xn) => {
                    //#region-4:分音符

                    const durRaw = xmlNodeDuration(xn);
                    trackTotalDuration += durRaw;
                    const duration = durRaw / 120;
                    const voice = (xmlNote.trackId % 4 + 1).toString();
                    const staff = (Math.floor(xmlNote.trackId / 4) + 1).toString();

                    if ("items" in xn) {
                        xn.items.forEach(dir => {
                            const direction = meas.ele('direction', { placement: dir.param.y > 0 ? 'below' : 'above' });

                            // 1. 处理节拍器 (Metronome)
                            if (dir.type === 'metronome') {
                                const typep = direction.ele('direction-type');
                                const metro = typep.ele('metronome');
                                if (dir.items) {
                                    const beatUnit = dir.items.find(i => i.note)?.note;
                                    const textVal = dir.items.find(i => i.text === '=') ? dir.value : null;

                                    metro.ele('beat-unit').txt(typeMap[beatUnit || 4] || 'quarter');
                                    if (textVal) metro.ele('per-minute').txt(textVal);
                                }
                            }
                            // 2. 处理踏板 (Pedal)
                            else if (dir.type === 'pedal') {
                                const typep = direction.ele('direction-type');
                                const pedalAttr: any = { type: dir.text === 'start' ? 'start' : 'stop' };
                                if (dir.line) pedalAttr.line = 'yes';
                                typep.ele('pedal', pedalAttr);
                            }
                            // 3. 处理普通文本 (Words)
                            else if (dir.text) {
                                const typep = direction.ele('direction-type');
                                typep.ele('words').txt(dir.text);
                            }

                            direction.ele('staff').txt(staff);
                            return;
                        })
                        return;
                    }

                    const isRest = xn.isRest;

                    if (isRest) {
                        const restInfo = xn.elems as { nums: number; show: boolean };
                        const n = restInfo.show ? meas.ele('note') : meas.ele('note', { 'print-object': 'no' });

                        n.ele('rest');
                        n.ele('duration').txt(duration.toString());
                        n.ele('voice').txt(voice);
                        n.ele('type').txt(typeMap[xn.lenType] || 'quarter');

                        if (xn.dots > 0) {
                            for (let i = 0; i < xn.dots; i++) n.ele('dot');
                        }

                        n.ele('staff').txt(staff);
                    } else {
                        (xn.elems as XmlNoteElement[]).forEach((el, elIdx) => {
                            //#region 5:分音调

                            const n = meas.ele('note');

                            // 1. [grace / chord]
                            if (xn.grace) {
                                const graceAttr: any = {};
                                if (xn.grace.slash) graceAttr.slash = 'yes';
                                n.ele('grace', graceAttr);
                            }
                            if (elIdx > 0) n.ele('chord');

                            // 2. [pitch]
                            const p = n.ele('pitch');
                            p.ele('step').txt(el.step);
                            if (el.alter !== undefined && el.alter !== 0) p.ele('alter').txt(el.alter.toString());
                            p.ele('octave').txt(el.octave.toString());

                            // 3. [duration] (装饰音不写 duration)
                            if (!xn.grace) {
                                n.ele('duration').txt(duration.toString());
                            }

                            // 4. [tie]
                            if (el.tied) {
                                n.ele('tie', { type: el.tied.isStart ? 'start' : 'stop' });
                            }

                            // 5. [voice]
                            n.ele('voice').txt(voice);

                            // 6. [type]
                            n.ele('type').txt(typeMap[xn.lenType] || 'quarter');

                            // 7. [dot]
                            if (xn.dots > 0) {
                                for (let i = 0; i < xn.dots; i++) n.ele('dot');
                            }

                            // 8. [time-modification]
                            if (xn.tuplet) {
                                const timeMod = n.ele('time-modification');
                                timeMod.ele('actual-notes').txt(xn.tuplet.actual.toString());
                                timeMod.ele('normal-notes').txt(xn.tuplet.normal.toString());
                            }

                            // 9. [stem]
                            if (xn.stem) n.ele('stem').txt(xn.stem);

                            // 10. [staff]
                            n.ele('staff').txt(staff);

                            // 11. [beam]
                            if (xn.beams) {
                                xn.beams.forEach((beam) => {
                                    n.ele('beam', { number: beam.level + 1 }).txt(beam.type);
                                });
                            }

                            // 12. [notations]
                            const notations = n.ele('notations');

                            // 连音标记 (tuplet bracket)
                            if (xn.tuplet && (xn.tuplet.type === 'start' || xn.tuplet.type === 'end')) {
                                const tType = xn.tuplet.type === 'start' ? 'start' : 'stop';
                                notations.ele('tuplet', { type: tType, bracket: 'yes' });
                            }

                            // 连音线 (tied)
                            if (el.tied) {
                                notations.ele('tied', {
                                    type: el.tied.isStart ? 'start' : 'stop',
                                    placement: el.tied.isStart ? (el.tied.isUp ? 'above' : 'below') : undefined
                                });
                            }

                            // 琶音 (arpeggiate)
                            xn.arts?.forEach(art => {
                                if (art.type == 'arpeggiate') {
                                    notations.ele('arpeggiate');
                                }
                            });
                        });
                    }
                });

                if (xmlNoteIdx < xmlNotes.length - 1) {
                    meas.ele('backup').ele('duration').txt((trackTotalDuration / 120).toString());
                }
            });

            if (m.rbar) {
                meas.ele('barline', { location: "right" }).ele('bar-style').txt(m.rbar.type);
            }
            //#endregion 2
        });
        //#endregion 1
    });

    return root.end({ prettyPrint: true });
}

