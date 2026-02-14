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

export interface Measure {
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

export interface Note {
    x: number;               //// 音符在画布/页面上的水平渲染坐标
    col: number;             //// 布局列索引，用于对齐同一竖轴的音符

    //音轨
    staff: number;           // 谱表编号，通常 1 为高音谱表，2 为低音谱表
    v?: number;              // 声部 ID (Voice)，用于同一谱表内的多声部逻辑

    //位置
    tick: number;            // [位置] 时间戳偏移量，表示从小节开始经过的刻度值（Start Time）
    type: number;            // [长度] 音符时值类型，如 4 代表四分音符，8 代表八分音符

    dots?: number;           // 附点数量，0 或 undefined 表示无附点
    elems?: NoteElement[];   // 音符包含的具体音高元素，若有多个则构成和弦

    rest?: {                 // 休止符属性，存在此对象则表示该音符为休止符
        nums: number;        // 休止符占据的单位长度或数量
    };
    stem?: {                 // 符干属性
        type: string;        // 符干方向，如 "up" 或 "down"
        y: number;           // 符干端点的垂直坐标
        up?: boolean;        // 是否向上延长
    };
    arts?: any[];            // 装饰音/演奏记号，如 staccato (断奏), accent (重音) 等
    slur?: "L" | "M" | "R";  // 圆滑线标记：L 代表开始 (Left)，M 代表中间 (Middle)，R 代表结束 (Right)

    beams?: BeamInfo[];      // 连杠信息数组，定义多杠连杠的起始、继续或结束
    inbeam?: boolean;        // 标识该音符当前是否处于连杠组合中
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

export interface TiePair {
    n2: number;      // 目标音符在 elems 中的索引
    m2: number;      // 目标小节的序号（通常是相对于当前小节的索引或编号）
    type: "tied" | "slur"; // 连线类型：tied（延音线）或 slur（圆滑线）
    x1: number;      // 曲线起点 X 相对位移
    y1: number;      // 曲线起点 Y 相对位移
    x2: number;      // 曲线终点 X 相对位移
    y2: number;      // 曲线终点 Y 相对位移
    up?: boolean;    // 曲线是否向上弯曲
}

export interface BeamInfo {
    y1: number; // 连杠左端高度
    y2: number; // 连杠右端高度

    i: number;  // 连杠层级
    n2: number; // 连接到的目标音符索引
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