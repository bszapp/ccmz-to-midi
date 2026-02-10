//AI太好用了你们知道吗
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CustomSliderProps {
    value: number;
    onChange: (val: number) => void;
    pointNumber?: number;
}

//#region BaseSlider
function BaseSlider({ value, onChange, pointNumber = 0 }: CustomSliderProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);
    const fillRef = useRef<HTMLDivElement>(null);
    const pointsRef = useRef<(HTMLDivElement | null)[]>([]);
    const dragOffset = useRef<number>(0);
    const [isDragging, setIsDragging] = useState(false);

    const displayValueRef = useRef(value);
    const requestRef = useRef<number>(0);

    const sliderHeight = 26;
    const thumbSize = 19;
    const radius = sliderHeight / 2;

    const animate = () => {
        const diff = value - displayValueRef.current;
        if (Math.abs(diff) > 0.001) {
            displayValueRef.current += diff * 0.4;
            updateStyles(displayValueRef.current);
            requestRef.current = requestAnimationFrame(animate);
        } else {
            displayValueRef.current = value;
            updateStyles(value);
        }
    };

    const updateStyles = (val: number) => {
        const pos = `calc(${radius}px + ${val} * (100% - ${sliderHeight}px))`;
        if (thumbRef.current) thumbRef.current.style.left = pos;
        if (fillRef.current) fillRef.current.style.width = pos;

        // 实时更新点的颜色
        pointsRef.current.forEach((point, i) => {
            if (point) {
                const pointVal = (i + 1) / (pointNumber + 1);
                const isPassed = val >= pointVal;
                point.style.backgroundColor = isPassed ? '#ffffff4D' : '#4066A321';
            }
        });
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [value]);

    const getValueFromX = (clientX: number, offset: number = 0) => {
        if (!trackRef.current) return value;
        const rect = trackRef.current.getBoundingClientRect();
        const availableWidth = rect.width - sliderHeight;
        const x = Math.max(radius, Math.min(clientX - rect.left - offset, rect.width - radius));

        const rawValue = (x - radius) / availableWidth;
        if (pointNumber > 0) {
            const step = 1 / (pointNumber + 1);
            for (let i = 1; i <= pointNumber; i++) {
                const pointVal = i * step;
                if (Math.abs(rawValue - pointVal) < 0.03) return pointVal;
            }
        }
        return rawValue;
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!trackRef.current || !thumbRef.current) return;
        const thumbRect = thumbRef.current.getBoundingClientRect();
        const thumbCenterX = thumbRect.left + thumbRect.width / 2;
        const isOnThumb = thumbRef.current.contains(e.target as Node);

        if (isOnThumb) {
            dragOffset.current = e.clientX - thumbCenterX;
        } else {
            dragOffset.current = 0;
            onChange(getValueFromX(e.clientX, 0));
        }
        setIsDragging(true);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (!trackRef.current || !thumbRef.current) return;
        const touch = e.touches[0];
        const thumbRect = thumbRef.current.getBoundingClientRect();
        const thumbCenterX = thumbRect.left + thumbRect.width / 2;
        const isOnThumb = thumbRef.current.contains(e.target as Node);

        if (isOnThumb) {
            dragOffset.current = touch.clientX - thumbCenterX;
        } else {
            dragOffset.current = 0;
            onChange(getValueFromX(touch.clientX, 0));
        }
        setIsDragging(true);
    };

    useEffect(() => {
        const handleMove = (e: MouseEvent | TouchEvent) => {
            if (isDragging) {
                const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
                onChange(getValueFromX(clientX, dragOffset.current));
            }
        };
        const handleEnd = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleEnd);
            window.addEventListener('touchmove', handleMove, { passive: false });
            window.addEventListener('touchend', handleEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [isDragging, onChange]);

    return (
        <div
            ref={trackRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            style={{
                width: '100%',
                height: `${sliderHeight}px`,
                background: isDragging ? '#ddd' : '#eee',
                borderRadius: `${radius}px`,
                position: 'relative',
                cursor: 'pointer',
                userSelect: 'none',
                overflow: 'hidden',
                transition: 'background 0.2s',
                touchAction: 'none'
            }}
        >
            <div
                ref={fillRef}
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    background: 'var(--primary-color)',
                    borderRadius: `${radius}px 0 0 ${radius}px`,
                    pointerEvents: 'none',
                }}
            />

            {pointNumber > 0 && Array.from({ length: pointNumber }).map((_, i) => {
                const pointVal = (i + 1) / (pointNumber + 1);
                return (
                    <div
                        key={i}
                        ref={(el) => { pointsRef.current[i] = el; }}
                        style={{
                            position: 'absolute',
                            left: `calc(${radius}px + ${pointVal} * (100% - ${sliderHeight}px))`,
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '7px',
                            height: '7px',
                            backgroundColor: displayValueRef.current >= pointVal ? '#ffffff33' : '#00000010',
                            borderRadius: '50%',
                            zIndex: 1,
                            pointerEvents: 'none',
                        }}
                    />
                );
            })}

            <div
                ref={thumbRef}
                style={{
                    position: 'absolute',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: `${sliderHeight}px`,
                    height: `${sliderHeight}px`,
                    background: 'var(--primary-color)',
                    borderRadius: '50%',
                    pointerEvents: 'auto',
                    zIndex: 2,
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: `${thumbSize * (isDragging ? 1 : 0.9)}px`,
                        height: `${thumbSize * (isDragging ? 1 : 0.9)}px`,
                        background: '#fff',
                        borderRadius: '50%',
                        pointerEvents: 'none',
                        transition: 'width 0.1s, height 0.1s'
                    }}
                />
            </div>
        </div>
    );
}


//#region Slider
export function Slider({
    title,
    valueToString,
    pointNumber = 0,
    ...props
}: CustomSliderProps & {
    title: string;
    valueToString?: (val: number) => string;
    pointNumber?: number;
}) {
    return (
        <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '16px', color: '#222' }}>{title}</span>
                <span style={{ fontSize: '16px', color: '#888' }}>
                    {valueToString ? valueToString(props.value) : props.value}
                </span>
            </div>
            <BaseSlider {...props} pointNumber={pointNumber} />
        </div>
    );
}

//#region RadioGroup
export function RadioGroup({ options, value, onChange }: { options: string[], value: string, onChange: (val: string) => void }) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [pressedIndex, setPressedIndex] = useState<number | null>(null);
    const [isTouch, setIsTouch] = useState(false);

    const activeIndex = options.indexOf(value);
    const padding = 6;

    return (
        <div
            onTouchStart={() => setIsTouch(true)}
            onMouseMove={() => setIsTouch(false)}
            style={{
                display: 'flex',
                backgroundColor: '#f0f0f0',
                borderRadius: '12px',
                padding: `${padding}px`,
                width: '100%',
                boxSizing: 'border-box',
                position: 'relative',
                isolation: 'isolate',
                gap: `${padding}px`,
                userSelect: 'none'
            }}
        >
            <motion.div
                animate={{
                    x: `calc(${activeIndex * 100}% + ${activeIndex * padding}px)`
                }}
                transition={{ type: 'spring', stiffness: 450, damping: 38 }}
                style={{
                    position: 'absolute',
                    top: `${padding}px`,
                    left: `${padding}px`,
                    width: `calc((100% - ${(options.length + 1) * padding}px) / ${options.length})`,
                    height: `calc(100% - ${padding * 2}px)`,
                    backgroundColor: '#fff',
                    borderRadius: '9px',
                    zIndex: 0,
                }}
            />

            {options.map((option, index) => {
                const isSelected = value === option;
                const isHovered = !isTouch && hoveredIndex === index;
                const isPressed = pressedIndex === index;

                return (
                    <button
                        key={option}
                        onClick={() => onChange(option)}
                        onMouseEnter={() => !isTouch && setHoveredIndex(index)}
                        onMouseLeave={() => {
                            setHoveredIndex(null);
                            setPressedIndex(null);
                        }}
                        onMouseDown={() => setPressedIndex(index)}
                        onMouseUp={() => setPressedIndex(null)}
                        onTouchStart={() => setPressedIndex(index)}
                        onTouchEnd={() => setPressedIndex(null)}
                        style={{
                            flex: 1,
                            border: 'none',
                            padding: '8px 0',
                            borderRadius: '9px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            outline: 'none',
                            position: 'relative',
                            zIndex: 1,
                            transition: 'color 0.2s ease, background-color 0.1s ease',
                            backgroundColor: isPressed
                                ? 'rgba(0,0,0,0.08)'
                                : isHovered
                                    ? 'rgba(0,0,0,0.04)'
                                    : 'transparent',
                            color: isSelected ? '#000' : '#666',
                            WebkitTapHighlightColor: 'transparent'
                        }}
                    >
                        {option}
                    </button>
                );
            })}
        </div>
    );
}

interface ButtonProps {
    onClick: () => void;
    children: React.ReactNode;
    isPrimary?: boolean;
    color?: string;
}

//#region Button
export function Button({ onClick, children, isPrimary = false, disabled = false }: ButtonProps & { disabled?: boolean }) {
    const [isHovered, setIsHovered] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [isTouch, setIsTouch] = useState(false);

    const getFilter = () => {
        if (disabled) return 'none';
        if (isActive) return 'brightness(0.85)';
        if (!isTouch && isHovered) return 'brightness(0.95)';
        return 'none';
    };

    return (
        <button
            onTouchStart={() => {
                setIsTouch(true);
                if (!disabled) setIsActive(true);
            }}
            onTouchEnd={() => setIsActive(false)}
            onMouseMove={() => setIsTouch(false)}
            onMouseEnter={() => !disabled && !isTouch && setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                setIsActive(false);
            }}
            onMouseDown={() => !disabled && setIsActive(true)}
            onMouseUp={() => !disabled && setIsActive(false)}
            onClick={!disabled ? onClick : undefined}
            style={{
                display: 'inline-block',
                width: '100%',
                padding: '14px 20px',
                fontSize: '17px',
                fontWeight: '500',
                lineHeight: '23px',
                textAlign: 'center',
                wordWrap: 'break-word',
                cursor: disabled ? 'not-allowed' : 'pointer',
                border: '0',
                borderRadius: '16px',
                backgroundColor: isPrimary ? 'var(--primary-color)' : '#eee',
                color: isPrimary ? '#fff' : 'rgba(0, 0, 0, 0.8)',
                outline: '0',
                textDecoration: 'none',
                transitionProperty: 'background, color, filter, opacity',
                transitionDuration: '.3s',
                transitionTimingFunction: 'cubic-bezier(0, 0, .2, 1)',
                filter: getFilter(),
                flex: '1 1',
                opacity: disabled ? 0.4 : 1,
                pointerEvents: disabled ? 'none' : 'auto',
                WebkitTapHighlightColor: 'transparent',
                userSelect: 'none'
            }}
        >
            {children}
        </button>
    );
}

interface InputProps {
    title: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

//#region Input
export function Input({ title, value, onChange }: InputProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    const hasValue = value && value.length > 0;
    const isFloating = hasValue;

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => inputRef.current?.focus()}
            style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '0 16px',
                backgroundColor: 'rgba(0, 0, 0, .06)',
                border: `2px solid ${isFocused || isHovered ? 'var(--primary-color)' : 'transparent'}`,
                borderRadius: '16px',
                position: 'relative',
                boxSizing: 'border-box',
                transition: 'all .3s',
                height: '48px',
                cursor: 'text'
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    left: '16px',
                    top: isFloating ? '4px' : '50%',
                    transform: isFloating ? 'none' : 'translateY(-50%)',
                    fontSize: isFloating ? '10px' : '16px',
                    color: 'rgba(0, 0, 0, 0.4)',
                    transition: 'all 0.15s ease-out',
                    pointerEvents: 'none',
                    fontWeight: 500,
                    zIndex: 1
                }}
            >
                {title}
            </div>
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={onChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={{
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    color: '#000',
                    fontSize: '16px',
                    fontWeight: 500,
                    lineHeight: '23px',
                    caretColor: 'var(--primary-color)',
                    padding: 0,
                    margin: 0,
                    boxSizing: 'border-box',
                    paddingTop: isFloating ? '14px' : '0px',
                }}
            />
        </div>
    );
}