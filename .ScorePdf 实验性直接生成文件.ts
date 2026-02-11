// @ts-ignore
import { SvgScore } from "./xmlscore.esm.min.js";
import { jsPDF } from "jspdf";
import "svg2pdf.js";

export const loadPdf = async (
    scoreData: any,
    onLog: (message: string, action: { label: string; onClick: () => void } | null, replaceLast?: boolean) => void
): Promise<{ resultInfo: { fileName: string; pageCount: number }; destroy: () => void }> => {
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

        onLog("下载字体...", null);

        // 按需加载：Music 必须，Times 首选，Serif 备选
        const [musicB64, timesB64, serifB64] = await Promise.all([
            fetchFont(`${baseUrl}music.ttf`),
            fetchFont(`${baseUrl}times.ttf`),
            fetchFont(`${baseUrl}serif.ttf`)
        ]);

        if (!musicB64) throw new Error("关键核心字体 music.ttf 加载失败");
        onLog("下载字体...完成", null, true);
        onLog("渲染页面...", null);

        const mainTextB64 = timesB64 || serifB64;
        const mainTextName = timesB64 ? "TimesFont" : "SerifFont";

        const script = iframeDoc.createElement('script');
        script.src = `${baseUrl}vue.min.js`;
        iframeDoc.head.appendChild(script);
        await new Promise((resolve) => script.onload = resolve);

        const style = iframeDoc.createElement('style');
        style.innerHTML = `
            @font-face { font-family: 'MusicFont'; src: url(data:font/ttf;base64,${musicB64}) format('truetype'); }
            ${mainTextB64 ? `@font-face { font-family: '${mainTextName}'; src: url(data:font/ttf;base64,${mainTextB64}) format('truetype'); }` : ''}
        `;
        iframeDoc.head.appendChild(style);

        const vm = new (iframeWin.Vue)({
            render: (h: any) => h(SvgScore, {
                props: { score: scoreData, lineh: 10, config: { display: "onepage", showall: true, displayParam: { paged: true } } }
            })
        }).$mount(iframeDoc.createElement('div'));
        iframeDoc.body.appendChild(vm.$el);

        await iframeWin.document.fonts.ready;

        onLog("渲染页面...完成", null, true);
        onLog("合成PDF...", null);

        const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });

        pdf.addFileToVFS("MusicFont.ttf", musicB64);
        pdf.addFont("MusicFont.ttf", "MusicFont", "normal");
        if (mainTextB64) {
            pdf.addFileToVFS(`${mainTextName}.ttf`, mainTextB64);
            pdf.addFont(`${mainTextName}.ttf`, mainTextName, "normal");
        }

        const pageGroups = Array.from(vm.$el.querySelectorAll('g[id^="page_"]'));

        for (let i = 0; i < pageGroups.length; i++) {
            if (i > 0) pdf.addPage('a4', 'p');

            const originalPageG = pageGroups[i] as SVGGElement;
            const bBox = originalPageG.getBBox();

            const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            const pdfW = 595.28;
            const pdfH = 841.89;

            const renderHeight = bBox.height * (pdfW / bBox.width);

            const offsetY = pdfH - renderHeight;

            tempSvg.setAttribute("viewBox", `${bBox.x} ${bBox.y} ${bBox.width} ${bBox.height}`);
            tempSvg.setAttribute("width", pdfW.toString());
            tempSvg.setAttribute("height", renderHeight.toString());

            const clonedGroup = originalPageG.cloneNode(true) as SVGGElement;
            clonedGroup.removeAttribute("transform");
            clonedGroup.querySelectorAll('.noprint').forEach(el => el.remove());

            clonedGroup.querySelectorAll('text').forEach(txt => {
                const textContent = txt.textContent || "";
                const hasData = Array.from(txt.attributes).some(a => a.name.includes('data-'));

                const isNumericOrEqual = hasData && /^[0-9.=]+$/.test(textContent);

                const font = isNumericOrEqual ? (timesB64 ? "TimesFont" : "MusicFont") : (hasData ? mainTextName : "MusicFont");

                txt.setAttribute('font-family', font);
                txt.style.fontFamily = font;
            });

            tempSvg.appendChild(clonedGroup);
            document.body.appendChild(tempSvg);

            await pdf.svg(tempSvg, {
                x: 0,
                y: offsetY,
                width: pdfW,
                height: renderHeight,
                fontCallback: (family: any) => {
                    if (family === mainTextName) return mainTextName;
                    return "MusicFont";
                }
            } as any);
        }

        pdf.save(`${scoreData?.title?.title || 'score'}.pdf`);
        onLog("合成PDF...完成", null, true);
        return { resultInfo: { fileName: 'score', pageCount: pageGroups.length }, destroy };

    } catch (error: any) {
        destroy();
        throw error;
    }
};