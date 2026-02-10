import { useState, useRef, useLayoutEffect, type ReactNode } from 'react';

interface AnimatedContentProps {
    targetState: any;
    children: (state: any) => ReactNode;
}

function AnimatedContent({ targetState, children }: AnimatedContentProps) {
    const [displayState, setDisplayState] = useState(targetState);
    const [opacity, setOpacity] = useState(1);
    const [isAnimating, setIsAnimating] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const measureRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (!containerRef.current || !measureRef.current) return;

        const observer = new ResizeObserver((entries) => {
            const height = entries[0].contentRect.height;
            if (height <= 0) return;

            if (isAnimating) {
                containerRef.current!.style.transition = 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            } else {
                containerRef.current!.style.transition = 'none';
            }
            containerRef.current!.style.height = `${height}px`;
        });

        observer.observe(measureRef.current);
        return () => observer.disconnect();
    }, [isAnimating]);

    useLayoutEffect(() => {
        if (displayState === targetState) return;

        setOpacity(0);
        setIsAnimating(true);

        const timer = setTimeout(() => {
            setDisplayState(targetState);
            setOpacity(1);
        }, 200);

        const animationTimer = setTimeout(() => {
            setIsAnimating(false);
        }, 400);

        return () => {
            clearTimeout(timer);
            clearTimeout(animationTimer);
        };
    }, [targetState]);

    return (
        <div ref={containerRef} style={{
            //border: isAnimating ? '1px solid red' : 'none',
            overflow: 'hidden',
            willChange: 'height',
            position: 'relative'
        }}>
            <div style={{ opacity, transition: 'opacity 0.2s ease-in-out' }}>
                {children(displayState)}
            </div>

            <div ref={measureRef} style={{
                position: 'absolute', top: 0, left: 0, width: '100%',
                visibility: 'hidden', pointerEvents: 'none'
            }}>
                {children(targetState)}
            </div>
        </div>
    );
}

export default AnimatedContent;