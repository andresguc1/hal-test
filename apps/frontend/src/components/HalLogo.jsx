import React from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const HalLogo = ({ className }) => {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    return (
        <div className={cn("relative flex items-center justify-center", className)}>
            <svg
                width="32"
                height="32"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="transition-all duration-500 transform hover:scale-110"
            >
                {/* Cube Perspective Points */}
                <defs>
                    <linearGradient id="cubeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={isDark ? "#60a5fa" : "#1e40af"} />
                        <stop offset="100%" stopColor={isDark ? "#3b82f6" : "#1e3a8a"} />
                    </linearGradient>
                    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* CUBE FACES */}
                {/* Top Face */}
                <path
                    d="M50 15L85 32.5L50 50L15 32.5L50 15Z"
                    fill={isDark ? "rgba(59, 130, 246, 0.1)" : "rgba(30, 64, 175, 0.05)"}
                    stroke={isDark ? "#60a5fa" : "#1e40af"}
                    strokeWidth="2"
                    className="transition-all duration-500"
                />

                {/* Right Face */}
                <path
                    d="M50 50L85 32.5V72.5L50 90V50Z"
                    fill={isDark ? "rgba(59, 130, 246, 0.05)" : "rgba(30, 64, 175, 0.1)"}
                    stroke={isDark ? "#3b82f6" : "#1e3a8a"}
                    strokeWidth="2"
                    className="transition-all duration-500"
                />

                {/* Left Face */}
                <path
                    d="M15 32.5L50 50V90L15 72.5V32.5Z"
                    fill={isDark ? "rgba(30, 58, 138, 0.1)" : "rgba(30, 64, 175, 0.15)"}
                    stroke={isDark ? "#2563eb" : "#1d4ed8"}
                    strokeWidth="2"
                    className="transition-all duration-500"
                />

                {/* INNER CORE / WIREFRAME EFFECT */}
                {isDark ? (
                    <g filter="url(#neonGlow)">
                        <circle cx="50" cy="52.5" r="8" fill="#60a5fa" className="animate-pulse" />
                        <path
                            d="M50 25 V52.5 M25 40 L50 52.5 M75 40 L50 52.5 M50 80 V52.5"
                            stroke="#60a5fa"
                            strokeWidth="1.5"
                            strokeDasharray="4 2"
                        />
                    </g>
                ) : (
                    <g>
                        <rect x="42" y="44.5" width="16" height="16" rx="2" fill="#1e40af" />
                        <path
                            d="M50 35 V44.5 M42 52.5 L30 52.5 M58 52.5 L70 52.5 M50 60.5 V75"
                            stroke="#1e40af"
                            strokeWidth="1.5"
                        />
                    </g>
                )}
            </svg>

            {/* Dynamic Glow Background */}
            <div
                className={cn(
                    "absolute inset-0 blur-2xl opacity-20 -z-10 transition-all duration-700",
                    isDark ? "bg-blue-500" : "bg-blue-300"
                )}
            />
        </div>
    );
};

export default HalLogo;
