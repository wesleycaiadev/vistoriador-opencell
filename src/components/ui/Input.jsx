import React from 'react';
import './Input.css';

export const Input = React.forwardRef(({
    className = '',
    ...props
}, ref) => {
    return (
        <input
            ref={ref}
            className={`ui-input ${className}`}
            {...props}
        />
    );
});

Input.displayName = 'Input';
