// @ts-ignore
import { SvgScore } from "./xmlscore.esm.min.js";

export const loadPdf = async (
    scoreData: any,
    onLog: (message: string, action: { label: string; onClick: () => void } | null, replaceLast?: boolean) => void
): Promise<{ resultInfo: { fileName: string; pageCount: number }; print: () => void; destroy: () => void }> => {

    onLog("初始化环境...", null);

    const { origin, pathname } = window.location;
    const baseUrl = origin + pathname.substring(0, pathname.lastIndexOf('/') + 1);

    const iframe = document.createElement('iframe');
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const iframeWin = iframe.contentWindow as any;
    const iframeDoc = iframe.contentDocument || iframeWin.document;

    const destroy = () => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
    };

    onLog("初始化环境...完成", null, true);

    try {

        onLog("加载vue2...", null);

        const script = iframeDoc.createElement('script');
        script.src = `${baseUrl}vue.min.js`;
        iframeDoc.head.appendChild(script);

        await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Vue 加载失败: ${script.src}`));
        });

        const Vue2 = iframeWin.Vue;


        const style = iframeDoc.createElement('style');
        style.innerHTML = `
            @font-face { 
                font-family: 'Aloisen New'; 
                src: url('${baseUrl}music.woff') format('woff');
                font-display: block;
            }
            html, body { margin: 0; padding: 0; background: white; }
            svg { display: block; width: 100% !important; height: auto !important; page-break-after: always; break-after: page; }
            
            .disable0 .track0,.disable1 .track1,.disable10 .track10,.disable11 .track11,.disable2 .track2,.disable3 .track3,.disable4 .track4,.disable5 .track5,.disable6 .track6,.disable7 .track7,.disable8 .track8,.disable9 .track9{fill:#d3d3d3;stroke:#d3d3d3}
            .scorefont[data-v-1d111dd8]{font-family:Aloisen New,Arial,Times New Roman,Times,serif}
            @media print{
                .noprint[data-v-1d111dd8]{display:none}
                .print[data-v-1d111dd8]{display:block}
                @page { size: A4; margin: 0; }
            }
            @media screen{.print[data-v-1d111dd8]{display:none}}
            .title[data-v-9ea6a786]{font-family:Times New Roman,Times,serif;white-space:pre}
            .slurline[data-v-fe23292a]{stroke-width:.5;fill:#000;stroke:#000}
            .num[data-v-fe23292a]{fill:#000;font-style:italic;font-size:16px}
            .slurline[data-v-35a9c118]{stroke-width:.5;fill:#000;stroke:#000}
            .slurlinejp[data-v-35a9c118]{stroke-width:2;fill:transparent;stroke:#000}
            .footer[data-v-5c1c5b43]{font-family:Times New Roman,Times,serif;white-space:pre}
            .qrcode[data-v-38b00224]{font-family:Times New Roman,Times,serif;white-space:pre}
        `;
        iframeDoc.head.appendChild(style);

        const appDir = iframeDoc.createElement('div');
        appDir.id = 'app';
        iframeDoc.body.appendChild(appDir);

        onLog("加载vue2...完成", null, true);
        onLog("渲染页面...", null);

        const vm = new Vue2({
            render: (h: any) => h(SvgScore, {
                props: {
                    score: scoreData,
                    lineh: 10,
                    config: { display: "onepage", showall: true, displayParam: { paged: true } }
                }
            })
        }).$mount(appDir);

        onLog("渲染页面...完成", null, true);
        onLog("加载字体...", null);

        await iframeWin.document.fonts.load('1em "Aloisen New"');
        await iframeWin.document.fonts.ready;

        const pageCount = Array.from(vm.$el.children).filter((node: any) =>
            node.tagName.toLowerCase() === 'g' && node.id.startsWith('page_')
        ).length;

        const fileName = scoreData?.title?.title || 'output';
        iframeWin.document.title = fileName;

        onLog("加载字体...完成", null, true);

        return {
            resultInfo: { fileName, pageCount },
            print: () => {
                iframeWin.print();
            },
            destroy
        };

    } catch (error) {
        destroy();
        throw error;
    }
};