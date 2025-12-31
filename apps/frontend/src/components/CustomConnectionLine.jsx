import React from 'react';
import { getSmoothStepPath } from 'reactflow';

const CustomConnectionLine = ({ fromX, fromY, toX, toY, connectionLineStyle }) => {
    const [edgePath] = getSmoothStepPath({
        sourceX: fromX,
        sourceY: fromY,
        targetX: toX,
        targetY: toY,
    });

    return (
        <g>
            {/* Glow effect layer */}
            <path
                d={edgePath}
                stroke="url(#connectionGradient)"
                strokeWidth={4}
                fill="none"
                opacity={0.6}
                filter="url(#glow)"
            />
            {/* Main connection line */}
            <path
                d={edgePath}
                stroke="url(#connectionGradient)"
                strokeWidth={2.5}
                fill="none"
                strokeDasharray="8 4"
                style={connectionLineStyle}
            />
            {/* SVG definitions for gradient and glow */}
            <defs>
                <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.9} />
                </linearGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
        </g>
    );
};

export default CustomConnectionLine;
