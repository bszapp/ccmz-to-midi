import type { Note, NoteArts } from "./ccxml.ts";

export interface XmlNotes {
    trackId: number;//音轨id，由谱表、声部共同决定
    notes: XmlNote[];
}

export interface XmlNote {
    lenType: number; // 音符的基本时值类型（如4代表四分音符，8代表八分音符）
    dots: number; // 附点数量
    isRest: boolean; // 是否为休止符
    grace?: {                //装饰音不计时长
        slash?: boolean;     // 是否带有斜线 (碎音/Acciaccatura)
    } | undefined;
    elems: XmlNoteElement[] | {
        nums: number; // 休止符占据的单位长度
        show: boolean; // 是否显示
    };
    stem?: "up" | "down" | undefined; // 符干方向：向上或向下
    beams?: XmlBeamInfo[]; // 连杠信息列表
    tuplet?: TupletInfo | undefined; // 连音信息
    arts?: NoteArts[] | undefined;
    slur?: "L" | "M" | "R" | undefined; // 连奏线标记：L(Left/开始), M(Middle/中间), R(Right/结束)
}

interface AbsXmlNote {
    tick: number;
    note: XmlNote;
}

interface XmlBeamInfo {
    type: 'begin' | 'continue' | 'end';
    level: number;
}

interface TupletInfo {
    type: 'start' | 'continue' | 'end';
    actual: number;
    normal: number;
}

export interface XmlNoteElement {
    step: string;   // "C", "D", "E" ...
    octave: number;
    alter?: number;
    accidental?: string; // 临时记号类型
    tied?: TiedInfo;
}

interface TiedInfo {
    isStart: boolean;
    isUp?: boolean | undefined;
}


//#region 计算音符长度
export function xmlNodeDuration(note: XmlNote): number {
    const divisions = 480;

    if (note.grace) return 0;

    // 如果是休止符且 elems 中包含 nums 逻辑长度，优先使用
    if (note.lenType == 1 && note.isRest && note.elems && "nums" in note.elems) {
        return note.elems.nums * divisions;
    }

    // 常规音符或普通休止符计算
    let base = divisions * (4 / note.lenType);
    let extra = 0;
    let current = base;

    for (let i = 0; i < note.dots; i++) {
        current /= 2;
        extra += current;
    }

    //连音需要重新缩放
    const scale = note.tuplet ? note.tuplet.normal / note.tuplet.actual : 1;

    return (base + extra) * scale;
}

function getTupletNotes(n: number) {
    if (n <= 1) return { actual: 1, normal: 1 };
    const normal = Math.pow(2, Math.floor(Math.log2(n - 0.1)));
    return {
        actual: n,
        normal: normal
    };
}

function noteTrackId(note: Note) {
    return (note.staff - 1) * 4 + (note.v || 0);
}
const getStepStr = (s: number) => ["C", "D", "E", "F", "G", "A", "B"][s - 1] || "";

//#region 主入口
//把ccNotes（基于对象）转换为XmlNotes（基于文档）
export function notesToXmlNotes(notes: Note[]): XmlNotes[] {
    const trackMap = new Map<number, AbsXmlNote[]>();

    //#region 先处理一下小节的全局信息
    //连杠信息
    const beams: {
        startI: number;
        endI: number
        level: number;
    }[] = [];
    notes.forEach((note, noteI) => {
        note.beams?.forEach(beam => {
            beams.push({
                startI: noteI,
                endI: beam.n2,
                level: beam.i
            })
        });
    });

    //连音信息
    const tuplets: {
        startI: number;
        endI: number;
        value: number;
    }[] = [];
    notes.forEach((note, noteI) => {
        note.elems?.forEach(el => {
            el.pairs?.forEach(pair => {
                if (pair.type === "tuplet") {
                    tuplets.push({
                        startI: noteI,
                        endI: pair.n2 !== undefined ? pair.n2 : (noteI + (pair.value || 1) - 1),
                        value: pair.value || 0
                    });
                }
            });
        });
    });

    console.log("连音：", tuplets)

    //#region 主循环，映射到AbsXmlNote[]
    notes.forEach((note, noteI) => {

        if (note.hide) return;

        const trackId = noteTrackId(note);
        if (!trackMap.has(trackId)) trackMap.set(trackId, []);

        //根据之前的记录添加连杠
        const noteBeams: XmlBeamInfo[] = [];
        beams.forEach(beam => {
            if (noteI > beam.startI && noteI < beam.endI) {
                noteBeams.push({
                    type: 'continue',
                    level: beam.level
                });
            } else if (noteI === beam.startI) {
                noteBeams.push({
                    type: 'begin',
                    level: beam.level
                });
            } else if (noteI === beam.endI) {
                noteBeams.push({
                    type: 'end',
                    level: beam.level
                });
            }
        });

        //添加连音，顺便音符长度缩放
        var tupletInfo: TupletInfo | undefined;
        tuplets.forEach(tuplet => {
            const { actual, normal } = getTupletNotes(tuplet.value);
            if (noteI > tuplet.startI && noteI < tuplet.endI) {
                tupletInfo = {
                    type: 'continue',
                    actual: actual,
                    normal: normal
                };
            } else if (noteI === tuplet.startI) {
                tupletInfo = {
                    type: 'start',
                    actual: actual,
                    normal: normal
                };
            } else if (noteI === tuplet.endI) {
                tupletInfo = {
                    type: 'end',
                    actual: actual,
                    normal: normal
                };
            }
        });

        //处理正常音符信息
        const isRest = !!note.rest;

        const xmlNote: AbsXmlNote = {
            tick: note.tick,
            note: {
                lenType: note.type,
                dots: note.dots || 0,
                isRest: isRest,
                elems: isRest ? { nums: note.rest?.nums || 0, show: true } : (note.elems || []).map(el => {
                    const elem: XmlNoteElement = {
                        step: getStepStr(el.step),
                        octave: el.octave
                    };
                    if (el.alter !== undefined) elem.alter = el.alter;

                    //延音
                    el.pairs?.forEach(pair => {
                        if (pair.type === "tied") {
                            elem.tied = {
                                isStart: true,
                                isUp: pair.up
                            }
                        }
                    })
                    if (el.tied) {
                        elem.tied = {
                            isStart: el.tied == 'start',
                            isUp: el.tied === "start"
                        }
                    }

                    return elem;
                }),
                stem: note.stem?.type as "up" | "down",
                slur: note.slur,
                beams: noteBeams,
                arts: note.arts,
                tuplet: tupletInfo,
                grace: note.grace
            }
        };

        trackMap.get(trackId)!.push(xmlNote);
    });

    //#region 最后处理数据，填充真空区域
    const result: XmlNotes[] = Array.from(trackMap.entries()).map(([trackId, absNotes]) => {
        // 1. 排序
        const sorted = absNotes.sort((a, b) => a.tick - b.tick);
        const filled: XmlNote[] = [];
        let cursor = 0;

        // 2. 遍历并填充空隙
        for (const item of sorted) {
            if (item.tick > cursor) {
                filled.push(...createRestNotes(item.tick - cursor));
            }
            filled.push(item.note);
            cursor = item.tick + xmlNodeDuration(item.note);
        }
        const res = {
            trackId,
            notes: filled
        };
        if (xmlNotesLen(res) > 480 * 4) {
            console.log('W: 时长超出4小节', JSON.stringify(notes));
        }
        return res;
    });

    return result;
}
//#region ========

function createRestNotes(duration: number): XmlNote[] {
    const rests: XmlNote[] = [];
    let remaining = duration;

    const presets = [
        { t: 1920, type: 1 },  // 全音符
        { t: 960, type: 2 },  // 二分
        { t: 480, type: 4 },  // 四分
        { t: 240, type: 8 },  // 八分
        { t: 120, type: 16 }, // 十六分
        { t: 60, type: 32 }  // 三十二分
    ];

    for (const p of presets) {
        while (remaining >= p.t) {
            rests.push({
                lenType: p.type,
                dots: 0,
                isRest: true,
                elems: { nums: p.t / 480, show: false } // 空白占位符
            });
            remaining -= p.t;
        }
    }
    return rests;
}


export function formatXmlNotes(notes: XmlNote[]): string {
    return notes.map(note => {
        const duration = xmlNodeDuration(note);

        if (note.isRest) {
            const restInfo = note.elems as { nums: number; show: boolean };

            const label = restInfo.show ? "休止" : "空白";
            return `[${label}-${duration}]`;
        }

        // 处理常规音符
        const elements = note.elems as XmlNoteElement[];
        const pitchStr = elements.length > 1
            ? `(${elements.map(e => `${e.step}${e.octave}`).join(",")})`
            : `${elements[0]?.step || ""}${elements[0]?.octave || ""}`;

        return `[${pitchStr}-${duration}]`;
    }).join("");
}

function xmlNotesLen(xmlNotes: XmlNotes): number {
    return xmlNotes.notes.reduce((total, note) => {
        return total + xmlNodeDuration(note);
    }, 0);
}