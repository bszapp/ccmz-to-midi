export const loadPdf = async (
    scoreData: any,
    onLog: (message: string, action: { label: string; onClick: () => void } | null, replaceLast?: boolean) => void
): Promise<{ resultInfo: { fileName: string; pageCount: number }; print: () => void; destroy: () => void }> => {
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    onLog("初始化环境...", null);
    await wait(100);

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
        onLog("加载xmlscore...", null);

        // 1. 获取混淆的代码文本
        const jsResponse = await fetch(`${baseUrl}xmlscore.esm.min.js`);
        if (!jsResponse.ok) throw new Error("无法获取 xmlscore.esm.min.js，请检查 public 目录");
        let jsText = await jsResponse.text();

        // 2. 正则“手术”：
        // 移除 core-js 导入
        jsText = jsText.replace(/import\s+['"]core-js\/[^'"]+['"];?/g, '');
        // 将 import t from "vue" 替换为从 iframe 全局获取 Vue (Vue2)
        jsText = jsText.replace(/import\s+(\w+)\s+from\s+['"]vue['"];?/, 'const $1 = window.Vue;');

        const blob = new Blob([jsText], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);

        onLog("加载xmlscore...完成", null, true);
        onLog("加载 Vue 环境...", null);
        const vueScript = iframeDoc.createElement('script');
        vueScript.src = `${baseUrl}vue.min.js`;
        iframeDoc.head.appendChild(vueScript);
        await new Promise(r => vueScript.onload = r);

        // 5. 注入修复后的核心模块
        const coreScript = iframeDoc.createElement('script');
        coreScript.type = 'module';
        coreScript.innerHTML = `
            import { SvgScore } from '${blobUrl}';
            window.SvgScore = SvgScore;
            console.log('Core Component Injected.');
        `;
        iframeDoc.head.appendChild(coreScript);

        // 6. 轮询检查挂载
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
        const Vue2 = iframeWin.Vue;
        onLog("加载核心组件...完成", null, true);

        // 7. 样式注入
        const style = iframeDoc.createElement('style');
        style.innerHTML = `
            @font-face { 
                font-family: 'Aloisen New'; 
                src: url('${baseUrl}music.woff') format('woff');
                font-display: block;
            }
            html, body { margin: 0; padding: 0; background: white; }
            svg { display: block; width: 100% !important; height: auto !important; page-break-after: always; break-after: page; }
            .scorefont[data-v-1d111dd8]{font-family:Aloisen New,Arial,serif}
            @media print{
                @page { size: A4; margin: 0; }
                .noprint { display: none; }
            }
        `;
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
            print: () => { iframeWin.print(); },
            destroy
        };

    } catch (error) {
        console.error(error);
        destroy();
        throw error;
    }
};