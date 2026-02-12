export const scorePdfFile = async (
    scoreData: any,
    onLog: (message: string, action: { label: string; onClick: () => void } | null, replaceLast?: boolean) => void
): Promise<File> => {
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const { origin, pathname } = window.location;
    const baseUrl = origin + pathname.substring(0, pathname.lastIndexOf('/') + 1);

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:0;left:0;width:1500px;height:3000px;visibility:hidden;z-index:-1;';
    document.body.appendChild(iframe);

    const iframeWin = iframe.contentWindow as any;
    const iframeDoc = iframe.contentDocument || iframeWin.document;

    const destroy = () => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
    };

    try {
        const fetchFont = async (url: string) => {
            const res = await fetch(url);
            if (!res.ok) return null;
            const buffer = await res.arrayBuffer();
            return btoa(Array.from(new Uint8Array(buffer), b => String.fromCharCode(b)).join(""));
        };

        const loadScript = (url: string) => new Promise((resolve, reject) => {
            const script = iframeDoc.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            iframeDoc.head.appendChild(script);
        });

        onLog("下载资源...", null);
        const [musicB64, timesB64, jsResponse] = await Promise.all([
            fetchFont(`${baseUrl}music.ttf`),
            fetchFont(`${baseUrl}times.ttf`),
            fetch(`${baseUrl}xmlscore.esm.min.js`)
        ]);

        if (!musicB64 || !timesB64 || !jsResponse.ok) throw new Error("基础资源加载失败");

        // 动态加载 jsPDF 和 svg2pdf
        onLog("加载 PDF 引擎...", null);
        await loadScript(`${baseUrl}jspdf.umd.min.js`);
        await loadScript(`${baseUrl}svg2pdf.umd.min.js`);

        // 处理 XMLScore 脚本
        let jsText = await jsResponse.text();
        jsText = jsText.replace(/import\s+['"]core-js\/[^'"]+['"];?/g, '');
        jsText = jsText.replace(/import\s+(\w+)\s+from\s+['"]vue['"];?/, 'const $1 = window.Vue;');
        const jsBlobUrl = URL.createObjectURL(new Blob([jsText], { type: 'application/javascript' }));

        onLog("初始化 Vue...", null);
        await loadScript(`${baseUrl}vue.min.js`);

        const coreScript = iframeDoc.createElement('script');
        coreScript.type = 'module';
        coreScript.innerHTML = `import { SvgScore } from '${jsBlobUrl}'; window.SvgScore = SvgScore;`;
        iframeDoc.head.appendChild(coreScript);

        await new Promise((resolve, reject) => {
            let retry = 0;
            const check = () => {
                if (iframeWin.SvgScore) {
                    URL.revokeObjectURL(jsBlobUrl);
                    resolve(true);
                } else if (retry > 60) {
                    URL.revokeObjectURL(jsBlobUrl);
                    reject(new Error("核心组件初始化超时"));
                } else {
                    retry++;
                    setTimeout(check, 100);
                }
            };
            check();
        });

        onLog("渲染页面...", null);
        const mainTextName = "TimesFont";
        const style = iframeDoc.createElement('style');
        style.innerHTML = `
            @font-face { font-family: 'MusicFont'; src: url(data:font/ttf;base64,${musicB64}) format('truetype'); }
            @font-face { font-family: '${mainTextName}'; src: url(data:font/ttf;base64,${timesB64}) format('truetype'); }
            html, body { margin: 0; padding: 0; background: white; }
            svg { display: block; }
        `;
        iframeDoc.head.appendChild(style);

        const appDir = iframeDoc.createElement('div');
        iframeDoc.body.appendChild(appDir);

        const vm = new (iframeWin.Vue)({
            render: (h: any) => h(iframeWin.SvgScore, {
                props: { score: scoreData, lineh: 10, config: { display: "onepage", showall: true, displayParam: { paged: true } } }
            })
        }).$mount(appDir);

        await iframeWin.document.fonts.ready;
        await wait(100);

        onLog("合成PDF...", null);
        const { jsPDF } = iframeWin.jspdf;
        const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });

        pdf.addFileToVFS("MusicFont.ttf", musicB64);
        pdf.addFont("MusicFont.ttf", "MusicFont", "normal");
        pdf.addFileToVFS(`${mainTextName}.ttf`, timesB64);
        pdf.addFont(`${mainTextName}.ttf`, mainTextName, "normal");

        const container = vm.$el.nodeType === 1 ? vm.$el : iframeDoc.body;

        container.querySelectorAll('[fill="#696969"]').forEach((el: any) => el.style.opacity = 0);

        const pageGroups = Array.from(container.querySelectorAll('g[id^="page_"]'));

        for (let i = 0; i < pageGroups.length; i++) {
            onLog(`合成PDF... (${i}/${pageGroups.length})`, null, true);
            await wait(10);

            if (i > 0) pdf.addPage('a4', 'p');

            const originalPageG = pageGroups[i] as SVGGElement;
            const bBox = originalPageG.getBBox();

            const pdfW = 595.28;
            const pdfH = 841.89;

            const scale = pdfW / bBox.width;
            const contentRequiredSvgHeight = pdfH / scale;
            const viewVBoxY = (bBox.y + bBox.height) - contentRequiredSvgHeight;

            const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            tempSvg.setAttribute("viewBox", `${bBox.x} ${viewVBoxY} ${bBox.width} ${contentRequiredSvgHeight}`);
            tempSvg.setAttribute("width", pdfW.toString());
            tempSvg.setAttribute("height", pdfH.toString());

            const internalStyle = document.createElementNS("http://www.w3.org/2000/svg", "style");
            internalStyle.innerHTML = `
        @font-face { font-family: 'MusicFont'; src: url(data:font/ttf;base64,${musicB64}) format('truetype'); }
        @font-face { font-family: '${mainTextName}'; src: url(data:font/ttf;base64,${timesB64}) format('truetype'); }
        text { font-family: 'MusicFont'; }
    `;
            tempSvg.appendChild(internalStyle);

            const clonedGroup = originalPageG.cloneNode(true) as SVGGElement;
            clonedGroup.removeAttribute("transform");
            clonedGroup.querySelectorAll('text').forEach(txt => {
                const textContent = txt.textContent || "";
                const hasData = Array.from(txt.attributes).some(a => a.name.includes('data-'));
                const isNumericOrEqual = hasData && /^[0-9.=]+$/.test(textContent);
                const font = isNumericOrEqual ? mainTextName : (hasData ? mainTextName : "MusicFont");
                txt.setAttribute('font-family', font);
                txt.style.fontFamily = font;
            });

            tempSvg.appendChild(clonedGroup);
            document.body.appendChild(tempSvg);

            await pdf.svg(tempSvg, {
                x: 0,
                y: 0,
                width: pdfW,
                height: pdfH,
                fontCallback: (family: string) => family.includes("Times") ? mainTextName : "MusicFont"
            });

            document.body.removeChild(tempSvg);
        }

        const pdfFile = new File([pdf.output('blob')], `${scoreData?.title?.title || 'score'}.pdf`, {
            type: 'application/pdf'
        });

        destroy();
        return pdfFile;

    } catch (error: any) {
        destroy();
        throw error;
    }
};