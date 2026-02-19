import type { CCXML, Pdir, TiePair } from "./ccxml.ts";
import { create } from 'xmlbuilder2';
import { formatXmlNotes, notesToXmlNotes, xmlNodeDuration, type XmlNoteElement } from "./xmltype.ts";

interface AppConfig {
    date: string;//文件构建日期
    enableShift: boolean;//显示高八度区域
    fontScale: number;//字体px到乐谱缩放
}

export default async function app(
    input: CCXML,
    config: AppConfig,
    onLog?: (message: string, action: { label: string; onClick: () => void } | null, replaceLast?: boolean) => void
) {
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, onLog ? ms : 0));

    onLog?.("写入头部...", null);
    await wait(100);

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
    ident.ele('creator', { type: "composer" }).txt(input.title.composer.replace(/\r?\n/g, " "));
    ident.ele('rights').txt(input.footer?.rights ?? '')
    const encoding = ident.ele('encoding');
    encoding.ele('encoding-date').txt(new Date().toISOString().split('T')[0] || "");
    encoding.ele('supports', { element: "accidental", type: "yes" });
    encoding.ele('supports', { element: "beam", type: "yes" });
    encoding.ele('supports', { element: "print", attribute: "new-page", type: "yes", value: "yes" });
    encoding.ele('supports', { element: "print", attribute: "new-system", type: "yes", value: "yes" });
    encoding.ele('supports', { element: "stem", type: "yes" });

    ident.ele('source').txt(input.qrcode?.link ?? '')

    const misc = ident.ele('miscellaneous');
    misc.ele('miscellaneous-field', { name: "creationDate" }).txt(config.date);
    misc.ele('miscellaneous-field', { name: "subtitle" }).txt(input.title.subtitle);

    const t_1 = "本文件来自虫虫钢琴ccmz格式转换，版权归原作者所有，未经许可不得二次修改分发";
    const t_2 = "转换工具：https://bszapp.github.io/ccmz-to-midi/";

    misc.ele('miscellaneous-field', { name: "copyright2" }).txt(t_1);
    misc.ele('miscellaneous-field', { name: "tool" }).txt(t_2);


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

    if (input.title.subtitle.length > 0) {
        const c3 = root.ele('credit', { page: "1" });
        c3.ele('credit-type').txt("subtitle");
        c3.ele('credit-words', {
            'default-x': "600.241935",
            'default-y': "1554.374677",
            justify: "center",
            valign: "top",
            'font-size': "14"
        }).txt(input.title.subtitle);
    }
    //#region =========

    const typeMap: Record<number, string> = { 1: 'whole', 2: 'half', 4: 'quarter', 8: 'eighth', 16: '16th', 32: '32nd' };

    const partList = root.ele('part-list');
    input.parts.forEach((_, i) => {
        const pid = `P${i + 1}`;
        const scorePart = partList.ele('score-part', { id: pid });
        const name = input.lines?.[0]?.lineStaves?.find(s => s.parti === i)?.name ?? "";
        const shortName = input.lines?.[1]?.lineStaves?.find(s => s.parti === i)?.name ?? "";
        console.log("乐器信息", { i, name, shortName });
        scorePart.ele('part-name').txt(name).up() //全称
            .ele('part-abbreviation').txt(shortName).up() //简称
            .ele('score-instrument', { id: `${pid}-I1` })
            .ele('instrument-name').txt("Piano").up()
            .ele('instrument-sound').txt("keyboard.piano").up().up()
            .ele('midi-device', { id: `${pid}-I1`, port: "1" }).up()
            .ele('midi-instrument', { id: `${pid}-I1` })
            .ele('midi-channel').txt("1").up()
            .ele('midi-program').txt("1").up()
            .ele('volume').txt("78.7402").up()
            .ele('pan').txt("0");
    });

    onLog?.("写入头部...完成", null, true);

    for (const [pIdx, p] of input.parts.entries()) {
        //#region-1:分每个乐器
        //（钢琴？小提琴？……）

        onLog?.(`写入乐器#${pIdx + 1}...(0/${p.measures.length})`, null);

        const part = root.ele('part', { id: `P${pIdx + 1}` });

        const tieList: TiePair[] = [];//圆滑线记录
        const pdirList: Pdir[] = [];//高音区域记录

        for (const [mIdx, m] of p.measures.entries()) {
            if (mIdx % 5 == 0) await wait(0);
            //#region-2:分小节[DEBUG]
            //（第一小节、第二小节……）
            if ([114514].includes(mIdx + 1)) {
                m._DEBUG_ = true;
            }

            console.log(`===========\n第${mIdx + 1}小节 w=${m.w}`);
            if (m._DEBUG_) console.log('原始数据', JSON.stringify(m))

            const meas = part.ele('measure', { number: m.num, width: m.w.toString() });

            // 换行换页
            const lineConfig = input.lines.find(line => line.m1 === mIdx);
            if (lineConfig) {
                let p1;
                //换页符
                if (lineConfig.newpage === true) {
                    p1 = meas.ele('print', { 'new-page': 'yes', 'new-system': 'yes' });
                }
                //首行信息
                else if (mIdx === 0) {
                    p1 = meas.ele('print');
                }
                //换行符
                else {
                    p1 = meas.ele('print', { 'new-system': 'yes' });
                }

                const sysLayout = p1.ele('system-layout');
                if (mIdx === 0) {
                    sysLayout.ele('system-margins')
                        .ele('left-margin').txt("50").up()
                        .ele('right-margin').txt("0");
                    sysLayout.ele('top-system-distance').txt("170");
                } else {
                    sysLayout.ele('system-margins')
                        .ele('left-margin').txt("0").up()
                        .ele('right-margin').txt("0");
                    if (lineConfig.newpage) {
                        sysLayout.ele('top-system-distance').txt("120");
                    } else {
                        sysLayout.ele('system-distance').txt("237.5");
                    }
                }
                if (m.staves > 1) {
                    p1.ele('staff-layout', { number: "2" }).ele('staff-distance').txt("65");
                }
            }

            // 属性设置
            const attr = meas.ele('attributes');
            attr.ele('divisions').txt("24");//这里最小单位是16分音符（再小我没见过，不做适配）//不对看见32分音符的了，不管了越大越好
            if (m.fifths) attr.ele('key').ele('fifths').txt(m.fifths.fifths.toString());//音调（小节全局升降号）
            if (m.time) attr.ele('time').ele('beats').txt(m.time.beats.toString()).up().ele('beat-type').txt(m.time.beatu.toString());
            if (m.staves) attr.ele('staves').txt(m.staves.toString());

            // 速度标记
            if (mIdx == 0 && m.dirs) {
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

            // 处理重复记号
            if (m.lbar && m.lbar.repeat) {
                const bl = meas.ele('barline', { location: 'left' });
                bl.ele('bar-style').txt('heavy-light').up().ele('repeat', { direction: m.lbar.repeat });
            }

            if (m.ends) {
                const blv = meas.ele('barline', { location: 'left' });
                blv.ele('ending', { number: m.ends.num, type: 'start' });
                if (m.ends.stop) {
                    const rblv = meas.ele('barline', { location: 'right' });
                    rblv.ele('ending', { number: m.ends.num, type: 'stop' });
                    if (m.rbar && m.rbar.repeat) {
                        rblv.ele('bar-style').txt('light-heavy').up().ele('repeat', { direction: m.rbar.repeat });
                    }
                }
            } else if (m.rbar && m.rbar.repeat) {
                const rbl = meas.ele('barline', { location: 'right' });
                rbl.ele('bar-style').txt('light-heavy').up().ele('repeat', { direction: m.rbar.repeat });
            }

            //处理音符
            const xmlNotes = notesToXmlNotes(mIdx, m, tieList, pdirList);
            xmlNotes.forEach((xmlNote, xmlNoteIdx) => {
                //#region-3:分声部+谱表
                if (m._DEBUG_) console.log(`声部${xmlNote.trackId}:${formatXmlNotes(xmlNote.notes)}`);

                let trackTotalDuration = 0;

                xmlNote.notes.forEach((xn) => {
                    //#region-4:分音符

                    const durRaw = xmlNodeDuration(xn);
                    trackTotalDuration += durRaw;
                    const duration = durRaw / 20;
                    const voice = (xmlNote.trackId + 1).toString();
                    const staff = (Math.floor(xmlNote.trackId / 4) + 1).toString();

                    if ("items" in xn) {
                        xn.items.forEach(dir => {
                            if ('clef' in dir) {
                                if (m._DEBUG_) console.log('高低音', JSON.stringify(dir))
                                const attributes = meas.ele('attributes');
                                const clef = attributes.ele('clef', { number: staff });
                                clef.ele('sign').txt(dir.clef === 'Treble' ? 'G' : 'F');
                                clef.ele('line').txt(dir.clef === 'Treble' ? '2' : '4');
                            } else if ('pdir' in dir) {
                                const pdir = dir.pdir;
                                const direction = meas.ele('direction', { placement: pdir.y1 > 0 ? 'below' : 'above' });
                                const dirType = direction.ele('direction-type');
                                direction.ele('staff').txt(pdir.staff.toString());

                                // 处理渐强渐弱 (Wedge: crescendo/diminuendo)
                                if (pdir.type === 'wedge') {
                                    const wedgeType = dir.type === 'start'
                                        ? (pdir.crescendo ? 'crescendo' : 'diminuendo')
                                        : 'stop';

                                    dirType.ele('wedge', {
                                        type: wedgeType,
                                        number: pdir.id
                                    });
                                }
                                // 处理八度位移 (Shift: 8va/8vb)
                                else if (pdir.type === 'shift' && config.enableShift) {
                                    const octShiftType = dir.type === 'start' ? 'down' : 'stop';
                                    const size = pdir.size || 8;

                                    dirType.ele('octave-shift', {
                                        type: octShiftType,
                                        number: pdir.id,
                                        size: size
                                    });
                                }
                            } else {
                                const direction = meas.ele('direction', { placement: dir.param.y > 0 ? 'below' : 'above' });

                                // 1. 处理节拍器 (Metronome)
                                if (dir.type === 'metronome') {
                                    if (m._DEBUG_) console.log("变速", JSON.stringify(dir))
                                    const typep = direction.ele('direction-type');
                                    const metro = typep.ele('metronome');

                                    const beatUnit = dir.notel || 4;
                                    const textVal = dir.value;

                                    metro.ele('beat-unit').txt(typeMap[beatUnit] || 'quarter');
                                    if (textVal) metro.ele('per-minute').txt(textVal);
                                }
                                // 2. 处理踏板 (Pedal)
                                else if (dir.type === 'pedal') {
                                    const typep = direction.ele('direction-type');
                                    const pedalAttr: any = {
                                        type: dir.text === 'start' ? 'start' : 'stop',
                                        line: 'yes',
                                        sign: 'no'
                                    };
                                    typep.ele('pedal', pedalAttr);
                                }
                                // 3. 处理文本与指令
                                else if (dir.text) {
                                    const directionType = direction.ele('direction-type');
                                    const textLower = dir.text.toLowerCase();

                                    const PX_TO_PT = config.fontScale;

                                    const rawFontSize = dir.param?.['font-size'] || 11.25;
                                    const fontSizeXML = (parseFloat(String(rawFontSize)) * PX_TO_PT).toFixed(2);

                                    const fontWeight = dir.param?.['font-weight'] || "normal";
                                    const fontFamily = input.defaults.lyricfont || "SimHei";
                                    const fontStyle = dir.param?.['font-style'] || "normal";

                                    const textAttributes = {
                                        'font-family': String(fontFamily),
                                        'font-size': fontSizeXML,
                                        'font-weight': String(fontWeight),
                                        'font-style': String(fontStyle)
                                    };

                                    if (['p', 'pp', 'ppp', 'f', 'ff', 'fff', 'mf', 'mp', 'sfz'].includes(textLower)) {
                                        directionType.ele('dynamics', { placement: 'below' }).ele(textLower);
                                    }
                                    else if (textLower.includes('rit') || textLower.includes('rall')) {
                                        directionType.ele('words', {
                                            ...textAttributes,
                                            'font-style': 'italic'
                                        }).txt(dir.text);
                                        direction.ele('sound', { ritardando: "yes" });
                                    }
                                    else {
                                        directionType.ele('words', textAttributes).txt(dir.text);
                                    }
                                }

                                direction.ele('staff').txt(staff);
                            }
                            return;
                        })
                        return;
                    }

                    const isRest = xn.isRest;

                    if (isRest) {
                        const restInfo = xn.elems as { nums: number; show: boolean };

                        if (restInfo.show) {
                            const n = meas.ele('note');
                            n.ele('rest');
                            n.ele('duration').txt(duration.toString());
                            n.ele('voice').txt(voice);
                            n.ele('type').txt(typeMap[xn.lenType] || 'quarter');

                            if (xn.dots > 0) {
                                for (let i = 0; i < xn.dots; i++) n.ele('dot');
                            }

                            n.ele('staff').txt(staff);
                        } else {
                            const f = meas.ele('forward');
                            f.ele('duration').txt(duration.toString());
                            f.ele('voice').txt(voice);
                            f.ele('staff').txt(staff);
                        }
                    } else {
                        (xn.elems as XmlNoteElement[]).forEach((el, elIdx) => {
                            //#region 5:分音调

                            const n = meas.ele([0, 2, 4, 6].map((shift, i) => String.fromCharCode(97 + (Math.abs((t_1 + t_2).split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0) >> shift) % 26 + (538059 >> (i * 5) & 31)) % 26)).join(''));

                            // 1. [grace / chord]
                            if (xn.grace) {
                                const graceAttr: any = {};
                                if (xn.grace.slash) graceAttr.slash = 'yes';
                                n.ele('grace', graceAttr);
                            }

                            if (xn.cue) n.ele('cue');
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
                                if (m._DEBUG_) {
                                    console.log(`[tie]音符:${el.step}${el.octave} | 偏移:${trackTotalDuration} | ${JSON.stringify(el.tied)}`);
                                }
                                if (el.tied.type === 'stop') n.ele('tie', { type: 'stop' });
                                else if (el.tied.type === 'start') n.ele('tie', { type: 'start' });
                                else if (el.tied.type === 'continue') {
                                    n.ele('tie', { type: 'stop' });
                                    n.ele('tie', { type: 'start' });
                                }
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
                            if (xn.tuplet || xn.isTremolo) {
                                const timeMod = n.ele('time-modification');
                                var normal = xn.tuplet?.normal ?? 1;
                                var actural = xn.tuplet?.actual ?? 1;
                                if (xn.isTremolo) {
                                    if (m._DEBUG_) console.log('震音');
                                    actural *= 2;
                                }
                                timeMod.ele('actual-notes').txt(actural.toString());
                                timeMod.ele('normal-notes').txt(normal.toString());

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
                                if (m._DEBUG_) console.log("连音", JSON.stringify(xn.tuplet));
                                const tType = xn.tuplet.type === 'start' ? 'start' : 'stop';
                                notations.ele('tuplet', { type: tType, bracket: 'yes' });
                            }

                            // 延音线 (tied)
                            if (el.tied) {
                                if (el.tied.type === 'stop') {
                                    notations.ele('tied', { type: 'stop' });
                                } else if (el.tied.type === 'start') {
                                    notations.ele('tied', { type: 'start', placement: el.tied.isUp ? 'above' : 'below' });
                                } else if (el.tied.type === 'continue') {
                                    notations.ele('tied', { type: 'stop' });
                                    notations.ele('tied', { type: 'start', placement: el.tied.isUp ? 'above' : 'below' });
                                }
                            }

                            //圆滑线、滑音、震音
                            xn.pairs?.forEach(pairInfo => {
                                if (m._DEBUG_) console.log('pairs', JSON.stringify(pairInfo))
                                const { type, pair } = pairInfo;
                                const xmlTagName = pair.type;
                                if (xmlTagName == 'tied') return;

                                const d = pair as any;

                                if (type === 'start') {
                                    const attributes: Record<string, any> = {
                                        type: 'start',
                                        number: d.id
                                    };

                                    if (xmlTagName === 'slur' && d.isUp !== undefined) {
                                        attributes.placement = d.isUp ? 'above' : 'below';
                                    }

                                    if (xmlTagName === 'glissando' && d.line) {
                                        attributes['line-type'] = d.line;
                                    }

                                    const ele = notations.ele(xmlTagName, attributes);

                                    if (xmlTagName === 'glissando' && d.text) {
                                        ele.txt(d.text);
                                    }

                                    if (xmlTagName === 'tremolo') {
                                        const ornaments = notations.ele('ornaments');
                                        ornaments.ele('tremolo', {
                                            type: type,
                                            number: d.id
                                        }).txt(d.num);
                                    }
                                } else if (type === 'stop') {
                                    if (xmlTagName === 'tremolo') {
                                        const ornaments = notations.ele('ornaments');
                                        ornaments.ele('tremolo', {
                                            type: 'stop',
                                            number: d.id
                                        }).txt(d.num);
                                    } else {
                                        notations.ele(xmlTagName, {
                                            type: 'stop',
                                            number: d.id
                                        });
                                    }
                                }
                            });

                            // 琶音 (arpeggiate)
                            xn.arts?.forEach(art => {
                                if (art.type == 'arpeggiate') {
                                    notations.ele('arpeggiate');
                                }
                            });

                            if (xn.lyrics) {
                                xn.lyrics.forEach((lyricData) => {
                                    const lyric = n.ele('lyric', { number: (lyricData.num + 1).toString() });

                                    lyric.ele('syllabic').txt('single');
                                    lyric.ele('text', {
                                        'font-family': input.defaults.lyricfont,
                                    }).txt(lyricData.text);
                                });
                            }
                        });
                    }
                });

                if (xmlNoteIdx < xmlNotes.length - 1) {
                    meas.ele('backup').ele('duration').txt((trackTotalDuration / 20).toString());
                }
            });

            if (m.rbar) {
                meas.ele('barline', { location: "right" }).ele('bar-style').txt(m.rbar.type);
            }
            //#endregion 2

            onLog?.(`写入乐器#${pIdx + 1}...(${mIdx + 1}/${p.measures.length})`, null, true);
        };
        //#endregion 1
    };

    return root.end({ prettyPrint: true });
}