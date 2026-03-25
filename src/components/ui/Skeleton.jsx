import React from 'react';
import './Skeleton.css';

export function Skeleton({ width = '100%', height = '20px', className = '' }) {
    return (
        <div
            className={`ui-skeleton ${className}`}
            style={{ width, height }}
            aria-hidden="true"
        />
    );
}

export function SkeletonCard() {
    return (
        <div className="ui-skeleton-card">
            <div className="ui-skeleton-card-icon">
                <Skeleton width="48px" height="48px" />
            </div>
            <div className="ui-skeleton-card-text">
                <Skeleton width="80px" height="12px" />
                <Skeleton width="60px" height="32px" />
            </div>
        </div>
    );
}

export function SkeletonRow() {
    return (
        <tr className="ui-skeleton-row">
            <td><Skeleton width="120px" height="14px" /></td>
            <td><Skeleton width="100px" height="14px" /></td>
            <td><Skeleton width="90px" height="14px" /></td>
            <td><Skeleton width="140px" height="14px" /></td>
            <td><Skeleton width="70px" height="24px" /></td>
            <td><Skeleton width="60px" height="28px" /></td>
        </tr>
    );
}
