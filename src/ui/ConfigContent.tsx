import { Slider, Button, RadioGroup, Checkbox } from './Miui';
import AnimatedContent from './AnimatedContent';
import Spacer from './Spacer';
import formatFileSize from '../utils/formatFileSize';

interface ConfigProps {
    file: File;

    //配置信息
    fileType: 'midi' | 'pdf' | 'xml'; setFileType: (t: 'midi' | 'pdf' | 'xml') => void;
    volume: number; setVolume: (v: number) => void;
    pdfType: number; setPdfType: (v: number) => void;
    fontScale: number; setFontScale: (v: number) => void;
    enableShift: boolean; setEnableShift: (v: boolean) => void;

    onClose: () => void;
    onStart: () => void;
}

function ConfigContent({ file,
    fileType, setFileType,
    volume, setVolume,
    pdfType, setPdfType,
    fontScale, setFontScale,
    enableShift, setEnableShift,
    onClose,
    onStart
}: ConfigProps) {
    const volumeMax = 400;
    const PDF_OPTIONS = ['浏览器打印', 'svg2pdf'];
    return (
        <div style={{ display: 'flex', flexDirection: 'column', color: '#000' }}>
            <div style={{ fontSize: '20px', fontWeight: 500, textAlign: 'center' }}>转换配置</div>

            <Spacer height='16px' />
            <div style={{ fontSize: '16px', color: '#222' }}>文件信息</div>
            <Spacer height='4px' />
            <div>
                <div style={{ fontSize: '14px', color: '#666', display: 'flex' }}>
                    <span>名称：</span>
                    <span style={{ flex: 1, userSelect: 'text' }}>{file.name}</span>
                </div>
                <div style={{ fontSize: '14px', color: '#666', display: 'flex' }}>
                    <span>大小：</span>
                    <span style={{ flex: 1, userSelect: 'text' }}>{formatFileSize(file.size)}</span>
                </div>
            </div>

            <Spacer height='16px' />
            <div style={{ fontSize: '16px', color: '#222' }}>转换类型</div>
            <Spacer height='8px' />
            <RadioGroup
                options={['midi', 'pdf', 'xml']}
                value={fileType}
                onChange={(val) => setFileType(val as any)}
            />
            <Spacer height='4px' />
            <AnimatedContent targetState={fileType}>
                {(type) => (
                    <div style={{ width: '100%' }}>
                        {type === 'midi' && (
                            <>
                                <div style={{ padding: '4px 4px 0', fontSize: '14px', color: '#666' }}>
                                    适合使用编辑器自行排版、调整，操作更灵活但更麻烦
                                </div>
                                <Spacer height='8px' />
                                <Slider
                                    title="音量增益"
                                    value={volume / volumeMax}
                                    pointNumber={3}
                                    onChange={(val) => setVolume(val * volumeMax)}
                                    valueToString={(val) => `${Math.round(val * volumeMax)}%`}
                                />
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                    即音量对比度，0%表示没有音量变化，100%为保持原样，更高代表原来的弱音更弱，强音更强
                                </div>
                            </>
                        )}
                        {type === 'pdf' && (
                            <div style={{ padding: '4px 4px 0', fontSize: '14px', color: '#666' }}>
                                特别鸣谢虫虫钢琴官网提供的在线查看器.map文件，由此还原出查看器源码
                                <Spacer height='16px' />
                                <div style={{ fontSize: '16px', color: '#222' }}>生成方式</div>
                                <Spacer height='8px' />
                                <RadioGroup
                                    options={PDF_OPTIONS}
                                    value={PDF_OPTIONS[pdfType]}
                                    onChange={(val) => setPdfType(PDF_OPTIONS.indexOf(val as any))}
                                />
                                <Spacer height='8px' />
                                <AnimatedContent targetState={pdfType}>
                                    {(index) => (
                                        <div style={{ width: '100%' }}>
                                            {index === 0 ? (
                                                <div style={{ padding: '4px 4px 0', fontSize: '14px', color: '#666' }}>
                                                    调用系统打印对话框，排版最精确
                                                </div>
                                            ) : (
                                                <div style={{ padding: '4px 4px 0', fontSize: '14px', color: '#666' }}>
                                                    实验性功能，浏览器前端渲染，直接生成PDF文件并下载，无法显示中文字符
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </AnimatedContent>
                            </div>
                        )}
                        {type === 'xml' && (
                            <>
                                <div style={{ padding: '4px 4px 0', fontSize: '14px', color: '#666' }}>
                                    既可以直接打印，也可以编辑的格式
                                </div>
                                <Spacer height='16px' />
                                <div style={{ fontSize: '16px', color: '#222' }}>转换选项</div>
                                <Spacer height='4px' />
                                <Checkbox label="启用高八度标记（实验性）" checked={enableShift} onClick={setEnableShift} />
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                    此功能在大多数乐谱是正常的，如果出现标记范围不全、多标或者连续标记导致音高异常可尝试关闭
                                </div>
                                <Spacer height='12px' />
                                <Slider
                                    title="标记字号缩放比"
                                    value={(fontScale - 0.3) / 0.7}
                                    onChange={(val) => setFontScale(0.3 + val * 0.7)}
                                    valueToString={(val) => `${(0.3 + val * 0.7).toFixed(2)}x`}
                                />
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                    调整musicxml乐谱上的标记文字（演奏记号、指法等）的大小
                                </div>
                            </>
                        )}
                    </div>
                )}
            </AnimatedContent>
            <Spacer height='16px' />
            <div style={{ display: 'flex', gap: '12px' }}>
                <Button onClick={onClose}>取消</Button>
                <Button onClick={onStart} isPrimary>开始</Button>
            </div>
        </div>
    );
}

export default ConfigContent;