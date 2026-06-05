import React, { useState, useEffect, useRef } from 'react';
import './AnimatedCounter.css';

const AnimatedCounter = ({ value, duration = 2000, suffix = '', prefix = '', decimals = 0 }) => {
    const [count, setCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const counterRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isVisible) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.5 }
        );

        const node = counterRef.current;
        if (node) {
            observer.observe(node);
        }

        return () => {
            if (node) {
                observer.unobserve(node);
            }
        };
    }, [isVisible]);

    useEffect(() => {
        if (!isVisible) return;

        let startTime = null;
        const startValue = 0;
        const endValue = value;

        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = startValue + (endValue - startValue) * easeOutQuart;
            
            setCount(currentValue);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setCount(endValue);
            }
        };

        requestAnimationFrame(animate);
    }, [isVisible, value, duration]);

    return (
        <span ref={counterRef} className="animated-counter">
            {prefix}{count.toFixed(decimals)}{suffix}
        </span>
    );
};

export default AnimatedCounter;



