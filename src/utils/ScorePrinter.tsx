import JSZip from "jszip";
import Vue, { type CreateElement } from "vue";
// @ts-ignore
import { SvgScore } from "./xmlscore.esm.min.js";

export const loadPdf = async (file: File | Blob) => {
    const buffer = await file.arrayBuffer();
    const version = new Uint8Array(buffer.slice(0, 1))[0];
    let data = new Uint8Array(buffer.slice(1));
    const fileName = version === 1 ? "data.ccxml" : "score.json";

    if (version === 2) {
        data = data.map((v) => (v % 2 === 0 ? v + 1 : v - 1));
    }

    const zip = await JSZip.loadAsync(data);
    const targetFile = zip.file(fileName);

    if (targetFile) {
        const json = await targetFile.async("string");
        const scoreData = JSON.parse(json);

        const style = document.createElement('style');
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

        const container = document.createElement('div');
        container.className = 'print-container-temp';
        document.body.appendChild(container);

        const vm = new Vue({
            render: (h: CreateElement) => h(SvgScore, {
                props: {
                    score: scoreData,
                    lineh: 10,
                    config: { display: "onepage", showall: true, displayParam: { paged: true } }
                }
            })
        }).$mount();

        container.appendChild(vm.$el);

        await Promise.all([
            document.fonts.load('1em "Aloisen New"'),
            new Promise(resolve => setTimeout(resolve, 500))
        ]);

        const tempTitle = document.title;
        document.title = "乐谱";
        window.print();
        document.title = tempTitle;

        vm.$destroy();
        document.body.removeChild(container);
        document.head.removeChild(style);
    }
};