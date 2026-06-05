import React from 'react';
import { useLocation } from 'react-router-dom';
import './PageTransition.css';

const PageTransition = ({ children }) => {
    const location = useLocation();
    const [displayLocation, setDisplayLocation] = React.useState(location);
    const [transitionStage, setTransitionStage] = React.useState('entering');

    React.useEffect(() => {
        if (location !== displayLocation) {
            setTransitionStage('exiting');
        }
    }, [location, displayLocation]);

    return (
        <div
            className={`page-transition ${transitionStage}`}
            onAnimationEnd={() => {
                if (transitionStage === 'exiting') {
                    setDisplayLocation(location);
                    setTransitionStage('entering');
                }
            }}
        >
            {children}
        </div>
    );
};

export default PageTransition;



