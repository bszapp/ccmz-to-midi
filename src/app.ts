import type { CCXML } from "./types/ccxml.ts";
import { create } from 'xmlbuilder2';

export default function app(input: CCXML) {
    const root = create({ version: '1.0', encoding: 'UTF-8' })
        .dtd({
            pubID: '-//Recordare//DTD MusicXML 4.0 Partwise//EN',
            sysID: 'http://www.musicxml.org/dtds/partwise.dtd'
        })
        .ele('score-partwise', { version: "4.0" });


    const scoreTitle = input.title.title; //标题
    //#region-废话：
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
    pgLayout.ele('page-height').txt(input.page.h.toString());
    pgLayout.ele('page-width').txt(input.page.w.toString());

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
    //#region=========

    const stepMap: Record<number, string> = { 1: 'C', 2: 'D', 3: 'E', 4: 'F', 5: 'G', 6: 'A', 7: 'B' };
    const typeMap: Record<number, string> = { 1: 'whole', 2: 'half', 4: 'quarter', 8: 'eighth', 16: '16th', 32: '32nd' };
    const lineTypeMap: Record<string, string> = { 'tied': 'tied', 'slur': 'slur' };

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


    //1:分每个乐器（钢琴？小提琴？……）
    input.parts.forEach((p, pIdx) => {
        const part = root.ele('part', { id: `P${pIdx + 1}` });

        //圆滑线记录
        const slurStatus = new Map<number, number>();

        //2:分小节（第一小节、第二小节……）
        p.measures.forEach((m, mIdx) => {
            console.log("mIdx", mIdx);
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
                attr.ele('divisions').txt("1");
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
                        const dir = meas.ele('direction', { placement: "above", system: "only-top" });
                        const met = dir.ele('direction-type').ele('metronome', { parentheses: "no" });
                        met.att('default-x', d.param.x.toString()).att('relative-y', "20");
                        met.ele('beat-unit').txt("quarter").up().ele('per-minute').txt(d.value || "60");
                        dir.ele('staff').txt(d.staff.toString());
                        dir.ele('sound', { tempo: d.value || "60" });
                    }
                });
            }

            const totalStaves = m.staves || 1;
            const measureDuration = m.time ? m.time.beats : 4;

            //3:分谱表（高音部、低音部……）
            for (let s = 1; s <= totalStaves; s++) {
                const staffNotes = m.notes.filter(n => n.staff === s);

                //4:这一小块的每个音符
                staffNotes.forEach((n, nIdx) => {
                    const note = meas.ele('note');
                    note.att('default-x', n.x.toString());

                    //单个音符内容
                    if (n.rest) {
                        note.ele('rest', n.rest.nums >= measureDuration ? { measure: "yes" } : {}).up()
                            .ele('duration').txt(n.rest.nums.toString());
                    } else if (n.elems && n.elems.length > 0) {
                        const head = n.elems[0];
                        if (head) {
                            const pth = note.ele('pitch');
                            pth.ele('step').txt(stepMap[head.step] || 'C').up();

                            // 音高偏移
                            if (head.alter !== undefined && head.alter !== 0) {
                                pth.ele('alter').txt(head.alter.toString()).up();
                            }

                            pth.ele('octave').txt(head.octave.toString());
                        }
                        note.ele('duration').txt(measureDuration.toString());
                    }

                    note.ele('voice').txt(s === 1 ? "1" : "5").up()
                        .ele('type').txt(typeMap[n.type] || "whole").up();
                    if (n.dots && n.dots > 0) {
                        for (let i = 0; i < n.dots; i++) {
                            note.ele('dot');
                        }
                    }
                    note.ele('staff').txt(s.toString());

                    // 1. 处理 Beam (连杠)
                    if (n.inbeam) {
                        // 逻辑：如果有 beams 数组则是起始(begin)，否则是结束(end)
                        const beamValue = (n.beams && n.beams.length > 0) ? 'begin' : 'end';
                        note.ele('beam', { number: '1' }).txt(beamValue);
                    }

                    if (n.elems && n.elems.length > 0) {
                        const notations = note.ele('notations');
                        let hasAction = false;

                        n.elems.forEach(el => {
                            // 1. 处理连接线 (Tied)
                            if (el.tied) {
                                hasAction = true;
                                const tieType = el.tied === 'start' ? 'start' : 'stop';
                                note.ele('tied', { type: tieType });
                                notations.ele('tied', { type: tieType });
                            }

                            // 2. 处理开始标记 (Slur 或 Tied)
                            if (el.pairs && el.pairs.length > 0) {
                                el.pairs.forEach(pair => {
                                    hasAction = true;
                                    const tag = pair.type === 'slur' ? 'slur' : 'tied';
                                    if (tag === 'slur' && pair.m2 !== undefined) {
                                        slurStatus.set(s, pair.m2);
                                    }
                                    notations.ele(tag, {
                                        type: 'start',
                                        number: '1',
                                        placement: pair.up ? 'above' : 'below'
                                    });
                                });
                            }

                            // 3. 闭合逻辑 (包含跨小节自动停止)
                            const isTargetMeasure = slurStatus.has(s) && p.measures.indexOf(m) === slurStatus.get(s);
                            const isLastInStaff = nIdx === m.notes.reduce((last, curr, idx) => curr.staff === s ? idx : last, -1);

                            if (n.slur === 'R' || (el.tied === 'end') || (isTargetMeasure && isLastInStaff)) {
                                hasAction = true;
                                notations.ele('slur', { type: 'stop', number: '1' });
                                if (isTargetMeasure && isLastInStaff) slurStatus.delete(s);
                            }
                        });

                        if (!hasAction) notations.remove();
                    }
                });

                if (s < totalStaves) {
                    meas.ele('backup').ele('duration').txt(measureDuration.toString());
                }
            }

            if (m.rbar) {
                meas.ele('barline', { location: "right" }).ele('bar-style').txt(m.rbar.type);
            }
        });
    });

    return root.end({ prettyPrint: true });
}