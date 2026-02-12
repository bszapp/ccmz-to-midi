export const loadPdf = async (
    scoreData: any,
    onLog: (message: string, action: { label: string; onClick: () => void } | null, replaceLast?: boolean) => void
): Promise<{ resultInfo: { fileName: string; pageCount: number }; print: () => void; destroy: () => void }> => {
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    onLog("初始化环境...", null);
    await wait(100);

    const { origin, pathname } = window.location;
    const baseUrl = origin + pathname.substring(0, pathname.lastIndexOf('/') + 1);

    var st: HTMLElement | null = null;
    var es: HTMLElement | null = null;
    const iframe = document.createElement('iframe');
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const iframeWin = iframe.contentWindow as any;
    const iframeDoc = iframe.contentDocument || iframeWin.document;

    const title = document.title;

    let mainStyle: HTMLStyleElement | null = null;
    let fontBlobUrl = "";

    const destroy = () => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
        if (mainStyle && mainStyle.parentNode) {
            mainStyle.parentNode.removeChild(mainStyle);
        }
        document.title = title;
        if (fontBlobUrl) URL.revokeObjectURL(fontBlobUrl);
        if (st != null) document.head.removeChild(st);
        if (es != null) es.remove();
    };

    onLog("初始化环境...完成", null, true);

    try {

        onLog("加载 Vue 环境...", null);
        const vueScript = iframeDoc.createElement('script');
        vueScript.src = `${baseUrl}vue.min.js`;
        iframeDoc.head.appendChild(vueScript);
        await new Promise(r => vueScript.onload = r);
        const Vue2 = iframeWin.Vue;
        onLog("加载 Vue 环境...完成", null, true);


        onLog("加载xmlscore (0/3)", null);

        //拉取脚本
        const jsResponse = await fetch(`${baseUrl}xmlscore.esm.min.js`);
        if (!jsResponse.ok) throw new Error("xmlscore脚本拉取失败");
        let jsText = await jsResponse.text();
        onLog("加载xmlscore... (1/3)", null, true);

        //处理、载入脚本
        jsText = jsText.replace(/import\s+['"]core-js\/[^'"]+['"];?/g, '');
        jsText = jsText.replace(/import\s+(\w+)\s+from\s+['"]vue['"];?/, 'const $1 = window.Vue;');

        const blob = new Blob([jsText], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);


        const coreScript = iframeDoc.createElement('script');
        coreScript.type = 'module';
        coreScript.innerHTML = `
            import { SvgScore } from '${blobUrl}';
            window.SvgScore = SvgScore;
        `;
        iframeDoc.head.appendChild(coreScript);
        onLog("加载xmlscore... (2/3)", null, true);



        await new Promise((resolve, reject) => {
            let retry = 0;
            const check = () => {
                if (iframeWin.SvgScore) {
                    URL.revokeObjectURL(blobUrl);
                    resolve(true);
                } else if (retry > 60) {
                    URL.revokeObjectURL(blobUrl);
                    reject(new Error("核心组件初始化超时"));
                } else {
                    retry++;
                    setTimeout(check, 100);
                }
            };
            check();
        });

        const SvgScore = iframeWin.SvgScore;

        onLog("加载xmlscore... (3/3)", null, true);

        // 7. 样式注入
        const style = iframeDoc.createElement('style');
        const styleText = `
            html, body { margin: 0; padding: 0; }
            svg { display: block; width: 100% !important; height: auto !important; page-break-after: always; break-after: page; }
            .scorefont[data-v-1d111dd8]{font-family:Aloisen New,Arial,serif}
            @media print{
                @page { size: A4; margin: 0; }
                .noprint { display: none; }
            }
        `;

        style.innerHTML = styleText;
        iframeDoc.head.appendChild(style);

        const appDir = iframeDoc.createElement('div');
        appDir.id = 'app';
        iframeDoc.body.appendChild(appDir);

        onLog("渲染页面...", null);
        await wait(200);

        // 8. 执行渲染
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

        const fontRes = await fetch(`${baseUrl}music.woff`);
        const fontBlob = await fontRes.blob();
        fontBlobUrl = URL.createObjectURL(fontBlob);

        const fontFontFace = `
            @font-face { 
                font-family: 'Aloisen New'; 
                src: url('${fontBlobUrl}') format('woff');
                font-display: block;
            }
        `;

        mainStyle = document.createElement('style');
        mainStyle.innerHTML = fontFontFace;
        document.head.appendChild(mainStyle);

        const iframeFontStyle = iframeDoc.createElement('style');
        iframeFontStyle.innerHTML = fontFontFace;
        iframeDoc.head.appendChild(iframeFontStyle);

        await document.fonts.load('1em "Aloisen New"');
        await document.fonts.ready;

        await iframeWin.document.fonts.load('1em "Aloisen New"');
        await iframeWin.document.fonts.ready;

        const pageCount = Array.from(vm.$el.children).filter((node: any) =>
            node.tagName?.toLowerCase() === 'g' && node.id?.startsWith('page_')
        ).length;

        const fileName = scoreData?.title?.title || 'output';
        iframeWin.document.title = fileName;

        onLog("加载字体...完成", null, true);

        return {
            resultInfo: { fileName, pageCount },
            print: async () => {
                const s = performance.now();
                iframeWin.print();
                const diff = performance.now() - s;
                if (diff < 100) {
                    //实测via浏览器打印iframe的内容无响应

                    if (st != null) document.head.removeChild(st);
                    if (es != null) es.remove();

                    const s: HTMLElement = iframeWin.document.querySelector('svg');
                    es = s.cloneNode(true) as HTMLElement;
                    document.documentElement.appendChild(es);

                    st = document.createElement('style');
                    st.innerHTML = `
    @media screen { 
        .scorefont { display: none !important; } 
    } 
    @media print { 
        body { display: none !important; }
    }
    ${styleText}
    svg { display: block; width: 100%; height: auto; page-break-after: always; break-after: page; }
    
    .scorefont[data-v-1d111dd8] { font-family: 'Aloisen New', Arial, 'Times New Roman', Times, serif; }
    .title[data-v-9ea6a786], .footer[data-v-5c1c5b43] { font-family: 'Times New Roman', Times, serif; white-space: pre; }
    
    .slurline[data-v-fe23292a], .slurline[data-v-35a9c118] { stroke-width: .5; fill: #000; stroke: #000; }
    .num[data-v-fe23292a] { fill: #000; font-style: italic; font-size: 16px; }
    .slurlinejp[data-v-35a9c118] { stroke-width: 2; fill: transparent; stroke: #000; }

    .disable0 .track0, .disable1 .track1, .disable2 .track2, .disable3 .track3, 
    .disable4 .track4, .disable5 .track5, .disable6 .track6, .disable7 .track7, 
    .disable8 .track8, .disable9 .track9, .disable10 .track10, .disable11 .track11 { 
        fill: #d3d3d3; stroke: #d3d3d3; 
    }

    @media print {
        @page { size: A4; margin: 0; }
        .noprint, .noprint[data-v-1d111dd8] { display: none; }
        .print[data-v-1d111dd8] { display: block; }
    }

    @media screen {
        .print[data-v-1d111dd8] { display: none; }
    }
`;

                    document.head.appendChild(st);
                    document.title = fileName;
                    print();
                }
            },
            destroy
        };

    } catch (error) {
        console.error(error);
        destroy();
        throw error;
    }
};