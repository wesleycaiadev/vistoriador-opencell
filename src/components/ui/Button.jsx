import React from 'react';
import './Button.css';

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    ...props
}) {
    return (
        <button
            className={`ui-button variant-${variant} size-${size} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
