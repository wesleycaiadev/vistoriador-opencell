import React from 'react';
import './Card.css';

export function Card({
    children,
    className = '',
    ...props
}) {
    return (
        <div className={`ui-card ${className}`} {...props}>
            {children}
        </div>
    );
}
