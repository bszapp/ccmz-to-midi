import JSZip from 'jszip';

export const ccmzScore = async (
    file: File | Blob,
    onLog: (message: string, action: { label: string, onClick: () => void } | null, isDone?: boolean) => void,
): Promise<any> => {
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const decodeCCMZ = (buffer: ArrayBuffer) => {
        let type = (new Uint8Array(buffer.slice(0, 1)))[0];
        let data = new Uint8Array(buffer.slice(1));
        if (type === 1) return { type, data };
        else if (type === 2) {
            data = data.map(v => v % 2 === 0 ? v + 1 : v - 1);
            return { type, data };
        } else throw new Error(`文件解析失败：不支持的加密方式(${type})`);
    };

    const unzipFile = async (zipBytes: Uint8Array, fileName: string) => {
        const jszipInstance = new JSZip();
        const zip = await jszipInstance.loadAsync(zipBytes);
        const fileData = zip.file(fileName);
        if (!fileData) throw new Error(`压缩包读取失败：读取${fileName}失败`);
        return await fileData.async("string");
    };

    const buffer = await file.arrayBuffer();

    onLog("解密文件...", null);
    const { data, type } = decodeCCMZ(buffer);

    await wait(200);

    onLog("解密文件...完成", {
        label: "下载原始数据",
        onClick: () => {
            const blob = new Blob([data], { type: "application/zip" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "ccmz.zip";
            a.click();
        }
    }, true);

    onLog("解压数据...", null);
    await wait(100);

    const fileName = type === 1 ? "data.ccxml" : "score.json";
    const scoreData = JSON.parse(await unzipFile(data, fileName));

    onLog("解压数据...完成", null, true);

    return scoreData;
};