import type { Clef, Direction, Lyric, Measure, Note, NoteArts, Pdir, TiePair } from "./ccxml.ts";

export type XmlItem = XmlNote | Directions;

export interface XmlNotes {
    trackId: number;
    notes: XmlItem[];
}

export interface Directions {
    staff: number;
    tick: number;
    items: (Direction | Clef | PdirInfo)[];
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
    cue?: boolean | undefined;
    beams?: XmlBeamInfo[]; // 连杠信息列表
    tuplet?: TupletInfo | undefined; // 连音信息
    arts?: NoteArts[] | undefined;
    pairs?: PairInfo[] | undefined;
    lyrics?: Lyric[] | undefined;

    x?: number | undefined;
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

//延音
interface TiedInfo {
    type: 'start' | 'continue' | 'stop';
    isUp?: boolean | undefined;
}

interface PairInfo {
    type: 'start' | 'stop';
    pair: TiePair,
}

interface PdirInfo {
    type: 'start' | 'stop';
    pdir: Pdir,
}

//#region 计算音符长度
export function xmlNodeDuration(note: XmlNote | Directions): number {
    const divisions = 480;

    if ('items' in note) {
        return 0;
    }

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

function remapTick(tick: number) {
    const step = 60;//480*4/32
    return Math.round(tick / step) * step;
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

//#region-主入口
//把ccNotes（基于对象）转换为XmlNotes（基于文档）
export function notesToXmlNotes(mIdx: number, measure: Measure, pairList: TiePair[], pdirList: Pdir[]): XmlNotes[] {
    const trackMap = new Map<number, AbsXmlNote[]>();
    const notes = measure.notes;

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

    //连音信息、圆滑线信息
    const tuplets: {
        startI: number;
        endI: number;
        value: number;
    }[] = [];
    notes.forEach((note, noteI) => {
        const trackId = noteTrackId(note);
        const allPairs = [];
        if (note.elems) {
            note.elems.forEach(el => { if (el.pairs) allPairs.push(...el.pairs); });
        }
        if (note.rest && note.rest.pairs) {
            //休止符也有三连音？（来自Are You Lost）
            allPairs.push(...note.rest.pairs);
        }

        allPairs.forEach(pair => {
            if (pair.type === "tuplet") {
                const tupletData = {
                    startI: noteI,
                    endI: pair.n2 !== undefined ? pair.n2 : (noteI + (pair.value || 1) - 1),
                    value: pair.value || 0
                }
                tuplets.push(tupletData);
            } else {
                //先写入标记数据
                pair.m1 = mIdx;
                pair.n1 = noteI;
                pair.trackId = trackId;
                pair.id = pairList.filter(p => p.type == pair.type).length + 1;
                pairList.push(pair);
            }
        });
    });

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

        // 圆滑线、滑音处理
        var pairInfo: PairInfo[] = [];
        const idsToDelete: TiePair[] = [];

        pairList.forEach(e => {
            if (mIdx === e.m1 && noteI === e.n1) {
                pairInfo.push({
                    type: 'start',
                    pair: e
                });
            } else if (mIdx === e.m2 && noteI === e.n2
                || e.m2 === undefined && e.n2 === undefined && e.trackId === trackId //有始无终？
            ) {
                pairInfo.push({
                    type: 'stop',
                    pair: e
                });
                // 记录需要删除的 id
                idsToDelete.push(e);
            }
        });
        if (idsToDelete.length > 0) {
            idsToDelete.forEach(e => {
                const idx = pairList.indexOf(e);
                if (idx !== -1) pairList.splice(idx, 1);
            });
        }

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
                    const hasTiedPair = el.pairs?.some(p => p.type === "tied");
                    const isTiedEnd = el.tied === 'end';

                    if (hasTiedPair || isTiedEnd) {
                        let tiedType: 'start' | 'continue' | 'stop' = 'start';

                        if (hasTiedPair && isTiedEnd) {
                            tiedType = 'continue';
                        } else if (isTiedEnd) {
                            tiedType = 'stop';
                        } else {
                            tiedType = 'start';
                        }

                        elem.tied = {
                            type: tiedType,
                            isUp: el.pairs?.find(p => p.type === "tied")?.up ?? false
                        };
                    }

                    return elem;
                }),
                stem: note.stem?.type as "up" | "down",
                beams: noteBeams,
                arts: note.arts,
                cue: note.cue,
                tuplet: tupletInfo,
                pairs: pairInfo,
                grace: note.grace,
                lyrics: note.lyrics,
                x: note.x
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
        if (xmlNotesLen(res) > measure.ticks) {
            console.log('W: 时长超出4小节', JSON.stringify(notes));
        }
        return res;
    });

    //#region 合并并插入Direction/Clef/Pdir
    const dirMap = new Map<string, Directions>();

    //控制符号（踏板/变速）
    measure.dirs?.forEach(dir => {
        const key = `${dir.staff}-${dir.tick}`;
        if (!dirMap.has(key)) {
            dirMap.set(key, {
                staff: dir.staff,
                tick: dir.tick,
                items: []
            });
        }
        dirMap.get(key)!.items.push(dir);
    });
    //高低音变化
    measure.clefs?.forEach(dir => {
        const key = `${dir.staff}-${dir.tick}`;
        if (!dirMap.has(key)) {
            dirMap.set(key, {
                staff: dir.staff,
                tick: dir.tick,
                items: []
            });
        }
        dirMap.get(key)!.items.push(dir);
    });

    const mergedDirs = Array.from(dirMap.values());

    //#region 插入控制信息
    mergedDirs.forEach(dirGroup => {
        const staffBaseTrack = (dirGroup.staff - 1) * 4;
        const potentialTracks = result
            .filter(r => r.trackId >= staffBaseTrack && r.trackId < staffBaseTrack + 4)
            .sort((a, b) => a.trackId - b.trackId);

        let inserted = false;
        const targetTick = remapTick(dirGroup.tick);

        // 检查是否包含需要强制插入的信息（如谱号转换）
        const isForceInsert = dirGroup.items?.some(item => 'clef' in item);

        for (const track of potentialTracks) {
            let currentTick = 0;
            let bestIndex = -1;

            for (let i = 0; i <= track.notes.length; i++) {
                // 情况 A: 完美匹配
                if (Math.abs(currentTick - targetTick) < 1e-5) {
                    track.notes.splice(i, 0, dirGroup);
                    inserted = true;
                    break;
                }

                // 情况 B: 记录第一个超过目标时间点的位置（作为“最近缝隙”）
                if (currentTick > targetTick && bestIndex === -1) {
                    bestIndex = i;
                }

                if (i < track.notes.length) {
                    const note = track.notes[i];
                    if (note) currentTick += xmlNodeDuration(note);
                }
            }

            if (inserted) break;

            // 如果没找到完美匹配，但属于强制插入类型（如 Clef）
            if (isForceInsert) {
                // 如果 targetTick 比全曲还长，插在末尾；否则插在找到的最近缝隙
                const finalIndex = bestIndex !== -1 ? bestIndex : track.notes.length;
                track.notes.splice(finalIndex, 0, dirGroup);
                inserted = true;
                if (measure._DEBUG_) console.log(`W: 强制插入控制信息`, JSON.stringify(dirGroup));
                break;
            }
        }

        if (!inserted) {
            console.warn("W: 无法插入", JSON.stringify(dirGroup));
        }
    });

    //#region 高音区域标记

    // 记录新数据顺便加上id
    measure.pdirs?.forEach(pdir => {
        pdir.id = pdirList.length + 1;
        pdirList.push(pdir)
    });

    // 匹配坐标并插入
    const pdirsToRemove: Pdir[] = [];

    pdirList.forEach(pdir => {
        if (measure._DEBUG_) console.log("------\n测试：", JSON.stringify(pdir))
        result.forEach(xmlNotes => {
            const currentStaff = Math.floor(xmlNotes.trackId / 4) + 1;
            if (pdir.staff !== currentStaff) return;

            xmlNotes.notes.forEach(note => {
                if (!('x' in note)) return;


                if (measure._DEBUG_) console.log('note.x:', note.x)

                // 处理开始标记：插入在音符前面
                if (pdir.x1 !== undefined && pdir.x1 <= note.x!) {
                    if (measure._DEBUG_) console.log('在前方插入开始标记', JSON.stringify(pdir))
                    injectPdirInfo(xmlNotes.notes, note, 'before', { type: 'start', pdir });
                    pdir.x1 = undefined;
                }

                // 处理结束标记：插入在音符后面
                if (pdir.stopx !== undefined && pdir.stopx < note.x!) {
                    if (measure._DEBUG_) console.log('在前方插入结束标记', JSON.stringify(pdir))
                    injectPdirInfo(xmlNotes.notes, note, 'before', { type: 'stop', pdir });
                    pdir.stopx = undefined;

                    // 只有当起始和结束都已处理，才标记为可移除
                    if (pdir.x1 === undefined) {
                        pdirsToRemove.push(pdir);
                    }
                }
            });
        });
        if (measure._DEBUG_) console.log("--------")
    });
    pdirsToRemove.forEach(p => {
        const idx = pdirList.indexOf(p);
        if (idx !== -1) pdirList.splice(idx, 1);
    });
    //#endregion


    // 最后左移旧数据（跨小节坐标转换）
    pdirList.forEach(pdir => {
        if (pdir.x1 !== undefined) pdir.x1 -= measure.w;
        if (pdir.stopx !== undefined) pdir.stopx -= measure.w;
    });

    return result;
}
//#region ========

/**
 * 在指定的 XmlNote 前面或后面插入 PdirInfo
 * @param notes 数组引用
 * @param targetNote 目标音符对象
 * @param position 插入位置：'before' | 'after'
 * @param pdirInfo 要插入的数据
 */
function injectPdirInfo(notes: XmlItem[], targetNote: XmlNote, position: 'before' | 'after', pdirInfo: PdirInfo) {
    const noteIndex = notes.indexOf(targetNote);
    if (noteIndex === -1) return;

    // 确定目标插入点的索引
    const insertIndex = position === 'before' ? noteIndex : noteIndex + 1;
    const potentialDir = notes[insertIndex];

    // 如果该位置已经是 Directions 节点，则合并 items
    if (potentialDir && 'items' in potentialDir) {
        potentialDir.items.push(pdirInfo);
    } else {
        // 否则新建一个 Directions 节点
        const newDir: Directions = {
            staff: pdirInfo.pdir.staff,
            tick: 0,
            items: [pdirInfo]
        };
        notes.splice(insertIndex, 0, newDir);
    }
}

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

export function formatXmlNotes(notes: (XmlNote | Directions)[]): string {
    return notes.map(note => {
        if ("items" in note) {
            return `[(${note.items.map((e: Clef | Direction | PdirInfo) => {
                if ('clef' in e) return `高低音${e.clef}`
                if ('size' in e) return `音高${e.size}`
                if (e.type == 'metronome') return `变速${e.value}`
                if (e.type == 'pedal') return `踏板${e.text}`
                return `${e.type}`
            }).join(",")})-D]`;
        }

        const duration = xmlNodeDuration(note);

        if (note.isRest) {
            const restInfo = note.elems as { nums: number; show: boolean };
            const label = restInfo.show ? "休止" : "空白";
            return `[${label} -${duration}]`;
        }

        // 处理常规音符
        const elements = note.elems as XmlNoteElement[];
        if (!elements || elements.length === 0) return "";

        const pitchStr = elements.length > 1
            ? `(${elements.map(e => `${e.step}${e.octave}`).join(",")})`
            : elements.length > 0 ? `${elements[0]!.step}${elements[0]!.octave}` : '()';

        return `[${pitchStr}-${duration}]`;
    }).join("");
}

function xmlNotesLen(xmlNotes: XmlNotes): number {
    return xmlNotes.notes.reduce((total, note) => {
        return total + xmlNodeDuration(note);
    }, 0);
}