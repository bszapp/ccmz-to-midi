import Vue, { type CreateElement } from "vue";
// @ts-ignore
import { SvgScore } from "./xmlscore.esm.min.js";

export const loadPdf = async (
    scoreData: any,
    onLog: (message: string, action: { label: string; onClick: () => void } | null, replaceLast?: boolean) => void
): Promise<{ resultInfo: { fileName: string; pageCount: number }; destroy: () => void }> => {
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const style = document.createElement('style');
    const container = document.createElement('div');
    let vm: Vue | null = null;

    const destroy = () => {
        if (vm) vm.$destroy();
        if (document.body.contains(container)) document.body.removeChild(container);
        if (document.head.contains(style)) document.head.removeChild(style);
    };

    try {
        onLog("初始化环境...", null);
        await wait(200);

        style.innerHTML = `
            @font-face { 
                font-family: 'Aloisen New'; 
                src: url('./music.woff') format('woff'); 
            }
            @media screen { 
                .print-container-temp { display: none; } 
            }
            @media print { 
                @page { 
                    size: A4; 
                    margin: 0; 
                }
                body { 
                    margin: 0; 
                    padding: 0;
                }
                body > *:not(.print-container-temp) { 
                    display: none !important; 
                }
                .print-container-temp { 
                    display: block !important; 
                    width: 100%;
                    margin: 0;
                    padding: 0;
                    font-size: 0;
                    line-height: 0;
                }
                .print-container-temp svg { 
                    display: block;
                    width: 100% !important; 
                    height: auto !important; 
                    page-break-after: always;
                    break-after: page;
                }
            }
        `;
        document.head.appendChild(style);

        container.className = 'print-container-temp';
        document.body.appendChild(container);

        onLog("初始化环境...完成", null, true);
        onLog("渲染页面...", null);
        await wait(100);

        vm = new Vue({
            render: (h: CreateElement) => h(SvgScore, {
                props: {
                    score: scoreData,
                    lineh: 10,
                    config: { display: "onepage", showall: true, displayParam: { paged: true } }
                }
            })
        }).$mount();

        container.appendChild(vm.$el);

        onLog("渲染页面...完成", null, true);
        onLog("加载字体...", null);
        await wait(100);

        await document.fonts.load('1em "Aloisen New"');
        if (!document.fonts.check('1em "Aloisen New"')) {
            throw new Error("乐谱字体加载失败");
        }
        onLog("加载字体...完成", null, true);

        const pageCount = Array.from(vm.$el.children).filter(node =>
            node.tagName.toLowerCase() === 'g' && node.id.startsWith('page_')
        ).length;

        const fileName = scoreData?.title?.title || 'output';

        const result = {
            resultInfo: { fileName, pageCount },
            destroy
        };

        return result;

    } catch (error) {
        destroy();
        throw error;
    }
};