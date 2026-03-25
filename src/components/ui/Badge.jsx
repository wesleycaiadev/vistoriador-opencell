import React from 'react';
import './Badge.css';

export function Badge({
    children,
    variant = 'default',
    className = ''
}) {
    return (
        <span className={`ui-badge variant-${variant} ${className}`}>
            {children}
        </span>
    );
}
