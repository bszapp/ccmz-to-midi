import { useState, useRef, useEffect } from 'react';
import FileInput from './ui/FileInput';
import WarnTip from './ui/WarnTip';
import Modal from './ui/Modal';
import ConfigContent from './ui/ConfigContent';
import RunningContent from './ui/RunningContent';
import AnimatedContent from './ui/AnimatedContent';

// @ts-ignore
import { ccmzToMidi } from './utils/ccmzToMidi.js';
import formatFileSize from './utils/formatFileSize.js';

declare global {
    interface Window {
        handleFile: (file: File) => void;
    }
}

type FileType = 'midi' | 'pdf' | 'mscz';

type LogType = 'info' | 'error' | 'success';

function App() {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<'config' | 'running'>('config');

    const [fileData, setFileData] = useState<File | null>(null);
    const [fileType, setFileType] = useState<FileType>('midi');
    const [volume, setVolume] = useState(100);

    const [logs, setLogs] = useState<{ text: string; type: LogType; btn?: { label: string; action: () => void }; id: string }[]>([]);
    const [runState, setRunState] = useState<'running' | 'success' | 'error'>('running');
    const [outputFile, setOutputFile] = useState<File | null>(null);

    const handleFile = (file: File) => {
        setFileData(file);
        setFileType('midi');
        setVolume(100);
        setView('config');
        setIsOpen(true);
    };

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
            const resultFile: File = await ccmzToMidi(fileData, onLog, { volume: volume / 100, fileType });
            if (taskId !== currentTaskIdRef.current) return;

            setOutputFile(resultFile);
            setLogs(prev => [...prev, { text: `已生成文件 ${resultFile.name} 大小：${formatFileSize(resultFile.size)}`, type: 'success', id: crypto.randomUUID() }]);
            setRunState('success');
        } catch (e: any) {
            if (taskId !== currentTaskIdRef.current) return;
            setRunState('error');
            setLogs(prev => [...prev, { text: e.message, type: 'error', id: crypto.randomUUID() }]);
            console.error(e);
        }
    };

    return (
        <div style={{
            '--primary-color': '#3482ff',
            WebkitTapHighlightColor: 'transparent'
        } as React.CSSProperties}>
            <style>
                {`
                    div::selection {
                        background: color-mix(in srgb, var(--primary-color), transparent 70%);
                    }
                `}
            </style>
            <FileInput onFileSelect={handleFile} />
            <WarnTip title="免责声明">
                <center>
                    请确保你已经购买此曲谱或已经开通vip再转换，转换后的文件<b>仅供个人学习使用</b>，请勿传播，造成后果概不负责。
                    <br />
                    尊重版权，支持正版音乐。如果你支持创作者，请在平台购买正版曲谱。
                </center>
            </WarnTip>

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
                                    onClose={() => setIsOpen(false)}
                                    onStart={handleStart}
                                />
                            ) : (
                                <RunningContent
                                    state={runState}
                                    logs={logs}
                                    outputFile={outputFile}
                                    onClose={() => setIsOpen(false)}
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