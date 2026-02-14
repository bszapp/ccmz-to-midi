export interface CCXML {
    ver: string;
    defaults: {
        wordfont: string;
        lines: {
            stemW: number;
            staffW: number;
            lbarW: number;
        };
        lyricfont: string;
    };
    parts: Part[];
    groups: any[];
    fifths: number;
    measInfo: number[][];
    page: {
        h: number;
        x: number;
        y: number;
        w: number;
    };
    title: {
        title: string;
        composer: string;
        subtitle: string;
    };
    lines: Line[];
}

interface Part {
    measures: Measure[];
}

interface Measure {
    notes: Note[];
    num: string;
    w: number;
    staves: number;
    dirs?: Direction[];
    fifths?: {
        fifths: number;
    };
    time?: Time;
    clefs?: Clef[];
    rbar?: {
        type: string;
    };
}

interface Note {
    x: number;
    col: number;
    staff: number;
    tick: number;
    type: number;
    v?: number; //声部ID
    dots?: number;
    elems?: NoteElement[];
    rest?: {
        nums: number;
    };
    //？？？
    stem?: {
        type: string;
        y: number;
        up?: boolean;
    };
    arts?: any[];//？？？
    slur?: "L" | "M" | "R"; // L: Start, M: Middle, R: End
    beams?: BeamInfo[];     // 处理连杠逻辑
    inbeam?: boolean;       // 是否处于连杠中
}

interface NoteElement {
    step: number;
    octave: number;
    id: string;
    line: number;
    alter?: number;
    tied?: "start" | "end"; // 标识延音线的开始或结束
    pairs?: TiePair[];      // 存储连音线的连接逻辑
}

interface TiePair {
    n2: number;      // 目标音符在 elems 中的索引
    m2: number;      // 目标小节的序号（通常是相对于当前小节的索引或编号）
    type: "tied" | "slur"; // 连线类型：tied（延音线）或 slur（圆滑线）
    x1: number;      // 曲线起点 X 相对位移
    y1: number;      // 曲线起点 Y 相对位移
    x2: number;      // 曲线终点 X 相对位移
    y2: number;      // 曲线终点 Y 相对位移
    up?: boolean;    // 曲线是否向上弯曲
}

interface BeamInfo {
    i: number;  // 连杠层级 (通常是 0)
    n2: number; // 连接到的目标音符索引
    y1: number; // 连杠左端高度
    y2: number; // 连杠右端高度
}

interface Direction {
    staff: number;
    tick: number;
    text?: string;
    type?: string;
    value?: string;
    notel?: number;
    param: {
        x: number;
        y: number;
        'font-size': number;
        'font-weight'?: string;
    };
}

interface Time {
    beats: number;
    beatu: number;
}

interface Clef {
    x: number;
    staff: number;
    tick: number;
    clef: "Treble" | "Bass" | string;
}

interface Line {
    m1: number;
    distance: number;
    top: number;
    m2: number;
    w: number;
    newpage: boolean;
    x: number;
    h: number;
    y: number;
    lineStaves: LineStaff[];
}

interface LineStaff {
    distances: number[];
    clef: Record<string, string>;
    y: number;
    staves: number;
    fifths: number;
    time: Time;
    parti: number;
    height: number;
}