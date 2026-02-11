import { useState, useRef, useEffect } from 'react';

function ShuqianItem({ link, text }: { link: string; text: string }) {
    const [status, setStatus] = useState<'default' | 'hover' | 'active'>('default');
    const anchorRef = useRef<HTMLAnchorElement>(null);

    useEffect(() => {
        if (anchorRef.current) {
            anchorRef.current.href = link;
        }
    }, [link]);

    const getBgColor = () => {
        if (status === 'active') return '#ddd';
        if (status === 'hover') return '#eee';
        return '#fff';
    };

    return (
        <a
            ref={anchorRef}
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '4px',
                color: '#444',
                textDecoration: 'none',
                padding: '0 12px',
                margin: '4px',
                height: '26px',
                borderRadius: '16px',
                fontSize: '14px',
                border: '1px solid #0002',
                width: 'fit-content',
                userSelect: 'none',
                backgroundColor: getBgColor(),
                transition: 'background-color 0.2s'
            }}
            onClick={e => e.preventDefault()}
            onMouseEnter={() => setStatus('hover')}
            onMouseLeave={() => setStatus('default')}
            onMouseDown={() => setStatus('active')}
            onMouseUp={() => setStatus('hover')}
            onTouchStart={() => setStatus('active')}
            onTouchEnd={() => setStatus('default')}
        >
            <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="#5f6368">
                <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-7-.5-14.5T799-507q-5 29-27 48t-52 19h-80q-33 0-56.5-23.5T560-520v-40H400v-80q0-33 23.5-56.5T480-720h40q0-23 12.5-40.5T563-789q-20-5-40.5-8t-42.5-3q-134 0-227 93t-93 227h200q66 0 113 47t47 113v40H400v110q20 5 39.5 7.5T480-160Z" />
            </svg>
            {text}
        </a>
    );
}

export default ShuqianItem;