import React from 'react';
import './StarRating.css';

const StarRating = ({ rating = 0, maxRating = 5, size = 'medium', readonly = false, onRatingChange }) => {
    const [hoveredRating, setHoveredRating] = React.useState(0);

    const handleClick = (value) => {
        if (!readonly && onRatingChange) {
            onRatingChange(value);
        }
    };

    const handleMouseEnter = (value) => {
        if (!readonly) {
            setHoveredRating(value);
        }
    };

    const handleMouseLeave = () => {
        if (!readonly) {
            setHoveredRating(0);
        }
    };

    const displayRating = hoveredRating || rating;

    return (
        <div className={`star-rating star-rating-${size}`}>
            {[...Array(maxRating)].map((_, index) => {
                const value = index + 1;
                const isFilled = value <= displayRating;
                
                return (
                    <span
                        key={index}
                        className={`star ${isFilled ? 'filled' : ''} ${!readonly ? 'interactive' : ''}`}
                        onClick={() => handleClick(value)}
                        onMouseEnter={() => handleMouseEnter(value)}
                        onMouseLeave={handleMouseLeave}
                    >
                        <i className="fas fa-star"></i>
                    </span>
                );
            })}
        </div>
    );
};

export default StarRating;



