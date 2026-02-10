import { useState, useRef, useEffect } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import Button from './Button';

interface FileInputProps {
    onFileSelect: (file: File) => void;
}

function FileInput({ onFileSelect }: FileInputProps) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dragCounter = useRef(0);

    useEffect(() => {
        const handleWindowBlur = () => {
            setIsDragging(false);
            dragCounter.current = 0;
        };
        window.addEventListener('blur', handleWindowBlur);
        return () => window.removeEventListener('blur', handleWindowBlur);
    }, []);

    const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current++;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setIsDragging(false);
        }
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        dragCounter.current = 0;
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFileSelect(e.dataTransfer.files[0]);
        }
    };

    return (
        <div
            style={{
                width: 'calc(100% - 64px)',
                margin: '16px',
                padding: '24px 16px',
                borderRadius: '16px',
                border: `2px dashed ${isDragging ? 'var(--primary-color)' : '#888'}`,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                userSelect: 'none',
                backgroundColor: isDragging ? '#f0f8ff' : 'transparent',
                transition: 'all 0.3s ease'
            }}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
        >
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                请选择ccmz文件或拖入此处
            </div>
            <div style={{ fontSize: '14px', color: '#444', marginBottom: '12px' }}>
                解析步骤将在本地运行
            </div>
            <Button onClick={() => fileInputRef.current?.click()}>选择文件</Button>

            <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                        onFileSelect(files[0]);
                    }
                    e.target.value = '';
                }}
            />

            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: isDragging ? 1 : 0,
                    pointerEvents: 'none',
                    backdropFilter: isDragging ? 'blur(4px)' : 'blur(0px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#0001',
                    color: 'var(--primary-color)',
                    zIndex: 10,
                    transition: 'all 0.3s'
                }}
            >
                <div
                    style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        filter: 'brightness(0.9)'
                    }}
                >
                    松手即可使用此文件
                </div>
            </div>
        </div>
    );
}

export default FileInput;