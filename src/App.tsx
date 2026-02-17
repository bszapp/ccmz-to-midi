import { useState, useRef, useEffect } from 'react';
import FileInput from './ui/FileInput';
import Modal from './ui/Modal';
import ConfigContent from './ui/ConfigContent';
import RunningContent from './ui/RunningContent';
import AnimatedContent from './ui/AnimatedContent';

import { loadPdf } from './utils/ScorePdf.js';

// @ts-ignore
import { ccmzToMidi } from './utils/ccmzToMidi.js';
import formatFileSize from './utils/formatFileSize.js';
import { ccmzScore } from './utils/ccmzScore.js';
import { scorePdfFile } from './utils/scorePdfFile.js';
import ccxmlToXml from './ccxml/app.ts';
import type { CCXML } from './ccxml/ccxml.ts';

declare global {
    interface Window {
        handleFile: (file: File) => void;
    }
}

type FileType = 'midi' | 'pdf' | 'xml';

type LogType = 'info' | 'error' | 'success';

function App() {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<'config' | 'running'>('config');

    const [fileData, setFileData] = useState<File | null>(null);
    const [fileType, setFileType] = useState<FileType>('midi');
    const [volume, setVolume] = useState(100);
    const [pdfType, setPdfType] = useState(0);

    const [logs, setLogs] = useState<{ text: string; type: LogType; btn?: { label: string; action: () => void }; id: string }[]>([]);
    const [runState, setRunState] = useState<'running' | 'success' | 'error' | 'success-pdf'>('running');
    const [outputFile, setOutputFile] = useState<File | null>(null);

    const handleFile = (file: File) => {
        setFileData(file);
        setFileType('midi');
        setPdfType(0);
        setVolume(100);
        setView('config');
        setIsOpen(true);
    };


    //#region 文件接收
    useEffect(() => {
        let chunks: Uint8Array[] = [];
        let fileName = 'download.bin';

        const readyTimer = setInterval(() => {
            window.opener?.postMessage('READY', '*');
        }, 500);

        const handleMessage = async (e: MessageEvent) => {
            const d = e.data;
            if (!d || d === 'READY') return;

            if (d.action === 'CHUNK') {
                chunks.push(d.chunk);
            }

            if (d.action === 'DONE') {
                clearInterval(readyTimer);
                fileName = d.filename || fileName;
                const blob = new Blob(chunks as unknown as BlobPart[]);
                if (blob.size > 0) {
                    handleFile(new File([blob], fileName));
                }
                chunks = [];
            }
        };

        window.addEventListener('message', handleMessage);
        return () => {
            clearInterval(readyTimer);
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    const currentTaskIdRef = useRef<string | null>(null);

    const destroyPdfRef = useRef<(() => void) | null>(null);
    const printPdfRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!isOpen && destroyPdfRef.current) {
            destroyPdfRef.current();
            destroyPdfRef.current = null;
        }
    }, [isOpen]);

    useEffect(() => {
        return () => {
            if (destroyPdfRef.current) destroyPdfRef.current();
        };
    }, []);

    //#region 转换流程
    const handleStart = async () => {
        if (!fileData) return;

        const taskId = crypto.randomUUID();
        currentTaskIdRef.current = taskId;

        setView('running');
        setRunState('running');
        setLogs([]);
        setOutputFile(null);

        const onLog = (text: string, btnObj: { label: string; onClick: () => void } | null = null, isUpdate: boolean = false) => {
            if (taskId !== currentTaskIdRef.current) return;

            setLogs(prev => {
                const newLog = {
                    text,
                    type: 'info' as LogType,
                    btn: btnObj ? { label: btnObj.label, action: btnObj.onClick } : undefined,
                    id: isUpdate && prev.length > 0 ? prev[prev.length - 1].id : crypto.randomUUID()
                };

                if (isUpdate && prev.length > 0) {
                    return [...prev.slice(0, -1), newLog];
                }
                return [...prev, newLog];
            });
        };

        try {
            if (fileType === 'pdf') {
                if (pdfType === 0) {
                    const scoreData = await ccmzScore(fileData, onLog);
                    if (destroyPdfRef.current) destroyPdfRef.current();

                    const { resultInfo, print, destroy } = await loadPdf(scoreData, onLog);
                    destroyPdfRef.current = destroy;
                    printPdfRef.current = print;

                    setLogs(prev => [...prev, { text: `${resultInfo.fileName} 页面渲染完成 共${resultInfo.pageCount}页`, type: 'success', id: crypto.randomUUID() }]);
                    setOutputFile(new File([], resultInfo.fileName, {}));
                    setRunState('success-pdf');

                } else if (pdfType === 1) {
                    const scoreData = await ccmzScore(fileData, onLog);
                    if (destroyPdfRef.current) destroyPdfRef.current();

                    const resultFile: File = await scorePdfFile(scoreData, onLog);
                    if (taskId !== currentTaskIdRef.current) return;

                    setOutputFile(resultFile);
                    setLogs(prev => [...prev, { text: `已生成文件 ${resultFile.name} 大小：${formatFileSize(resultFile.size)}`, type: 'success', id: crypto.randomUUID() }]);
                    setRunState('success');
                }

            } else if (fileType === 'midi') {
                const resultFile: File = await ccmzToMidi(fileData, onLog, { volume: volume / 100, fileType });
                if (taskId !== currentTaskIdRef.current) return;

                setOutputFile(resultFile);
                setLogs(prev => [...prev, { text: `已生成文件 ${resultFile.name} 大小：${formatFileSize(resultFile.size)}`, type: 'success', id: crypto.randomUUID() }]);
                setRunState('success');
            } else if (fileType === 'xml') {
                const scoreData = await ccmzScore(fileData, onLog);
                const xml: string = ccxmlToXml(scoreData, {
                    date: '1145-01-14',
                    enableShift: true,
                    fontScale: 0.65
                });
                const fileName = `${scoreData.title?.title ?? fileData.name.replace(/\.[^/.]+$/, "")}.musicxml`;
                const resultFile = new File([xml], fileName, { type: 'text/xml' });
                if (taskId !== currentTaskIdRef.current) return;
                setOutputFile(resultFile);
                setLogs(prev => [...prev, {
                    text: `已生成文件 ${resultFile.name} 大小：${formatFileSize(resultFile.size)}`,
                    type: 'success',
                    id: crypto.randomUUID()
                }]);
                setRunState('success');
            }
        } catch (e: any) {
            if (taskId !== currentTaskIdRef.current) return;
            setRunState('error');
            setLogs(prev => [...prev, { text: e.message, type: 'error', id: crypto.randomUUID() }]);
            console.error(e);
        }
    };

    //#region 页面布局
    return (
        <div
            className="no-print"
            style={{
                '--primary-color': '#3482ff',
                WebkitTapHighlightColor: 'transparent'
            } as React.CSSProperties}
        >
            <style>
                {`
                #app-main div::selection {
                    background: color-mix(in srgb, var(--primary-color), transparent 70%);
                }
                
                @media print {
                    .no-print {
                        display: none !important;
                    }
                }
            `}
            </style>
            <FileInput onFileSelect={handleFile} />

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
                <AnimatedContent targetState={view}>
                    {(currentView) => (
                        <div style={{ width: '320px' }}>
                            {currentView === 'config' ? (
                                <ConfigContent
                                    file={fileData || new File([], '')}
                                    fileType={fileType}
                                    setFileType={setFileType}
                                    volume={volume}
                                    setVolume={setVolume}
                                    pdfType={pdfType}
                                    setPdfType={setPdfType}
                                    onClose={() => setIsOpen(false)}
                                    onStart={handleStart}
                                />
                            ) : (
                                <RunningContent
                                    state={runState}
                                    logs={logs}
                                    outputFile={outputFile}
                                    onClose={() => setIsOpen(false)}
                                    onPrint={() => {
                                        if (printPdfRef.current) {
                                            printPdfRef.current();
                                        }
                                    }}
                                />
                            )}
                        </div>
                    )}
                </AnimatedContent>
            </Modal>
        </div>
    );
}

export default App;