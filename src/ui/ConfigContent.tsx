import { Slider, Button, RadioGroup } from './Miui';
import AnimatedContent from './AnimatedContent';
import Spacer from './Spacer';
import formatFileSize from '../utils/formatFileSize';

interface ConfigProps {
    file: File;
    fileType: 'midi' | 'pdf' | 'xml';
    setFileType: (t: 'midi' | 'pdf' | 'xml') => void;
    volume: number;
    setVolume: (v: number) => void;
    onClose: () => void;
    onStart: () => void;
}

function ConfigContent({ file, fileType, setFileType, volume, setVolume, onClose, onStart }: ConfigProps) {
    const volumeMax = 400;
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
                            </div>
                        )}
                        {type === 'xml' && (
                            <>
                                <div style={{ padding: '4px 4px 0', fontSize: '14px', color: '#666' }}>
                                    既可以直接打印，也可以编辑的格式
                                </div>
                                <div style={{ padding: '4px 4px 0', fontSize: '14px', color: '#c00' }}>
                                    前面的区域，以后再来探索吧 []~(￣▽￣)~*
                                </div>
                            </>
                        )}
                    </div>
                )}
            </AnimatedContent>
            <Spacer height='16px' />
            <div style={{ display: 'flex', gap: '12px' }}>
                <Button onClick={onClose}>取消</Button>
                <Button onClick={onStart} isPrimary disabled={fileType === 'xml'}>开始</Button>
            </div>
        </div>
    );
}

export default ConfigContent;