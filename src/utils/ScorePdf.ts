import Vue, { type CreateElement } from "vue";
// @ts-ignore
import { SvgScore } from "./xmlscore.esm.min.js";

export const loadPdf = async (scoreData: JSON): Promise<() => void> => {
    const style = document.createElement('style');
    const container = document.createElement('div');
    let vm: Vue | null = null;

    const destroy = () => {
        if (vm) vm.$destroy();
        if (document.body.contains(container)) document.body.removeChild(container);
        if (document.head.contains(style)) document.head.removeChild(style);
    };

    try {
        style.innerHTML = `
            @font-face { font-family: 'Aloisen New'; src: url('./music.woff') format('woff'); }
            @media screen { .print-container-temp { display: none; } }
            @media print { 
                @page { size: auto; margin: 0mm; }
                body { margin: 0; }
                body > *:not(.print-container-temp) { display: none !important; }
                .print-container-temp { 
                    display: block !important; 
                    width: 100vw;
                    margin: 0;
                    padding: 0;
                }
                .print-container-temp svg { width: 100% !important; height: auto !important; }
            }
        `;
        document.head.appendChild(style);

        container.className = 'print-container-temp';
        document.body.appendChild(container);

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

        await document.fonts.load('1em "Aloisen New"');

        // 返回销毁函数给外部调用
        return destroy;

    } catch (error) {
        destroy();
        throw error;
    }
};