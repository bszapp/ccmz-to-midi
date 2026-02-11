import { useEffect, useRef, useState } from 'react';
import { Button, Input } from './Miui';
import Spacer from './Spacer';
import AnimatedContent from './AnimatedContent';

interface LogItem {
    text: string;
    type: 'info' | 'error' | 'success';
    btn?: {
        label: string;
        action: () => void;
    };
    id: string;
}

function RunningContent({ state, logs, outputFile, onClose, onPrint }: {
    state: 'running' | 'success' | 'error' | 'success-pdf';
    logs: LogItem[];
    outputFile: File | null;
    onClose: () => void;
    onPrint: () => void;
}) {
    const [fileName, setFileName] = useState('');

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }, [logs]);

    useEffect(() => {
        if (outputFile) {
            setFileName(outputFile.name);
        }
    }, [outputFile]);

    const [hoverId, setHoverId] = useState<string | number | null>(null);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            width: '320px'
        }}>
            <div style={{
                fontSize: '20px',
                fontWeight: 500,
                textAlign: 'center'
            }}>
                {{ running: '正在处理', success: '转换成功', 'success-pdf': '转换成功', error: '转换失败' }[state]}
            </div>

            <Spacer height='16px' />

            <div
                ref={scrollRef}
                style={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    backgroundColor: '#f8f8f8',
                    borderRadius: '8px',
                }}
            >
                {logs.map((log) => (
                    <div key={log.id} style={{
                        fontSize: '14px',
                        display: 'flex',
                        padding: '3px',
                        alignItems: 'center',
                        width: 'calc(100% - 6px)',
                        whiteSpace: 'pre-wrap',
                        transition: 'all 0.2s',
                        userSelect: 'text',
                        color: ({ error: '#d80000', success: '#00a797' } as Record<string, string>)[log.type] || '#000',
                        backgroundColor: ({ error: '#f001', success: '#00a79711' } as Record<string, string>)[log.type] || '#0000',
                    }}>
                        {log.text}
                        {log.btn && (
                            <div style={{
                                color: '#0088ff',
                                marginLeft: '6px',
                                fontSize: '14px',
                                cursor: 'pointer',
                                userSelect: 'none' as const,
                                textDecoration: hoverId === log.id ? 'underline' : 'none'
                            }}
                                onClick={log.btn.action}
                                onMouseEnter={() => setHoverId(log.id)}
                                onMouseLeave={() => setHoverId(null)}>
                                {log.btn.label}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <Spacer height='12px' />

            <AnimatedContent targetState={state}>
                {(currentView) => {
                    switch (currentView) {
                        case 'running':
                            return <Button onClick={onClose}>取消</Button>;
                        case 'success':
                            return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                                    <Input
                                        title="文件名"
                                        value={fileName}
                                        onChange={(e) => setFileName(e.target.value)}
                                    />
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <Button onClick={onClose}>关闭</Button>
                                        <Button onClick={() => {
                                            if (outputFile) {
                                                const url = URL.createObjectURL(outputFile);
                                                const a = document.createElement("a");
                                                a.href = url;
                                                a.download = fileName;
                                                a.click();
                                                URL.revokeObjectURL(url);
                                            }
                                        }} isPrimary>下载</Button>
                                    </div>
                                </div>
                            );
                        case 'success-pdf':
                            return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                                    <div style={{ padding: '4px 4px 0', fontSize: '14px', color: '#666' }}>
                                        PDF已经准备，请在此页面点击打印，打印机选择“另存为PDF”即可保存
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <Button onClick={onClose}>关闭</Button>
                                        <Button onClick={onPrint} isPrimary>打印</Button>
                                    </div>
                                </div>
                            );
                        case 'error':
                            return <Button onClick={onClose}>关闭</Button>;
                        default:
                            return null;
                    }
                }}
            </AnimatedContent>
        </div>
    );
}

export default RunningContent;