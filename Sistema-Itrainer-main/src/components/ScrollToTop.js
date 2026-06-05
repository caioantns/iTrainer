import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './ScrollToTop.css';

const ScrollToTop = () => {
    const [isVisible, setIsVisible] = useState(false);
    const location = useLocation();

    // Scroll para o topo quando a rota mudar
    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant'
        });
    }, [location.pathname]);

    // Mostrar/ocultar botão de voltar ao topo
    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);

        return () => {
            window.removeEventListener('scroll', toggleVisibility);
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <button
            className={`scroll-to-top ${isVisible ? 'visible' : ''}`}
            onClick={scrollToTop}
            aria-label="Voltar ao topo"
        >
            <i className="fas fa-arrow-up"></i>
        </button>
    );
};

export default ScrollToTop;



