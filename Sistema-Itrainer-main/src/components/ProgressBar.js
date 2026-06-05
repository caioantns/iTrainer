import React from 'react';
import './ProgressBar.css';

const ProgressBar = ({ currentStep, totalSteps, steps }) => {
    const percentage = ((currentStep + 1) / totalSteps) * 100;

    return (
        <div className="progress-bar-container">
            <div className="progress-bar-wrapper">
                <div className="progress-bar" style={{ width: `${percentage}%` }}></div>
            </div>
            {steps && (
                <div className="progress-steps">
                    {steps.map((step, index) => (
                        <div
                            key={index}
                            className={`progress-step ${index <= currentStep ? 'completed' : ''} ${index === currentStep ? 'active' : ''}`}
                        >
                            <div className="step-number">
                                {index < currentStep ? (
                                    <i className="fas fa-check"></i>
                                ) : (
                                    index + 1
                                )}
                            </div>
                            <span className="step-label">{step}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProgressBar;



