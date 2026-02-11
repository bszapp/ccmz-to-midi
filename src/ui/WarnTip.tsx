import type { ReactNode } from 'react';

function WarnTip({ children, title }: { children: ReactNode; title: string }) {
    return (
        <div style={{
            width: 'calc(100 % - 56px)',
            margin: '16px',
            padding: '12px',
            borderRadius: '16px',
            border: '2px solid #ffbb00',
            backgroundColor: '#ffbb0038',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <div style={{
                    lineHeight: '20px',
                    fontWeight: '500'
                }}>{title}</div>
            </div>
            <div style={{
                marginTop: '4px',
                fontSize: '14px',
                wordBreak: 'break-all'
            }}>
                {children}
            </div>
        </div>
    );
}

export default WarnTip;