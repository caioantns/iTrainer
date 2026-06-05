import React, { useState, useEffect } from 'react';
import './FloatingLabelInput.css';

const FloatingLabelInput = ({
    type = 'text',
    label,
    name,
    value,
    onChange,
    onBlur,
    error,
    required = false,
    placeholder,
    validation,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isValid, setIsValid] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (value && validation) {
            const result = validation(value);
            setIsValid(result === true);
            setErrorMessage(typeof result === 'string' ? result : '');
        } else if (value && !validation) {
            setIsValid(true);
        } else {
            setIsValid(null);
        }
    }, [value, validation]);

    const handleBlur = (e) => {
        setIsFocused(false);
        if (onBlur) {
            onBlur(e);
        }
        if (validation && value) {
            const result = validation(value);
            setIsValid(result === true);
            setErrorMessage(typeof result === 'string' ? result : '');
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
    };

    const isFloating = isFocused || value;

    return (
        <div className={`floating-label-input ${isFocused ? 'focused' : ''} ${isValid === false ? 'error' : ''} ${isValid === true ? 'valid' : ''}`}>
            <div className="input-wrapper">
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={isFloating ? placeholder : ''}
                    required={required}
                    className="floating-input"
                    {...props}
                />
                <label className={`floating-label ${isFloating ? 'floating' : ''}`}>
                    {label}
                    {required && <span className="required">*</span>}
                </label>
                {isValid === true && (
                    <i className="fas fa-check-circle input-icon valid-icon"></i>
                )}
                {isValid === false && (
                    <i className="fas fa-exclamation-circle input-icon error-icon"></i>
                )}
            </div>
            {(error || errorMessage) && (
                <span className="error-message">{error || errorMessage}</span>
            )}
        </div>
    );
};

export default FloatingLabelInput;



