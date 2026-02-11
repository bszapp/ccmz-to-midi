import { useState } from 'react';

function IconBtn({ children, onClick }: { children: React.ReactNode, onClick: () => void }) {
    const [isPressed, setIsPressed] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const getOverlayOpacity = () => {
        if (isPressed) return 0.15;
        if (isHovered) return 0.05;
        return 0;
    };

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '14px',
                cursor: 'pointer',
                margin: '4px',
                color: '#b70000',
                backgroundColor: '#ff000020',
                padding: '0 10px',
                height: '28px',
                borderRadius: '14px',
                width: 'fit-content',
                userSelect: 'none',
                WebkitTapHighlightColor: 'transparent',
                position: 'relative',
                overflow: 'hidden'
            }}
            onClick={onClick}
            onMouseEnter={() => {
                if (window.matchMedia('(hover: hover)').matches) {
                    setIsHovered(true);
                }
            }}
            onMouseLeave={() => {
                setIsHovered(false);
                setIsPressed(false);
            }}
            onTouchStart={() => setIsPressed(true)}
            onTouchEnd={() => setIsPressed(false)}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
        >
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: '#000',
                opacity: getOverlayOpacity(),
                transition: 'opacity 0.2s',
                pointerEvents: 'none'
            }} />
            {children}
        </div>
    );
}

export default IconBtn;