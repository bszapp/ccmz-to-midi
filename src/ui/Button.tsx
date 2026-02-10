import React, { useState } from 'react';

interface ButtonProps {
    onClick: () => void;
    children: React.ReactNode;
    color?: string;
}

function Button({ onClick, children, color = 'var(--primary-color)' }: ButtonProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [isActive, setIsActive] = useState(false);

    return (
        <button
            style={{
                width: 'calc(100% - 32px)',
                height: '36px',
                borderRadius: '18px',
                border: 'none',
                backgroundColor: color,
                color: '#fff',
                cursor: 'pointer',
                transition: 'transform 0.1s ease, filter 0.3s ease',
                outline: 'none',
                filter: isHovered ? 'brightness(0.94)' : 'none',
                transform: isActive ? 'scale(0.98)' : 'scale(1)'
            }}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                setIsActive(false);
            }}
            onMouseDown={() => setIsActive(true)}
            onMouseUp={() => setIsActive(false)}
        >
            {children}
        </button>
    );
}

export default Button;