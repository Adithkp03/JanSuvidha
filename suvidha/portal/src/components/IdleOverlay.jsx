import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Hand } from 'lucide-react';

const TOTAL_WARNING_SECONDS = 15; // 60 - 45 = 15 second countdown

export default function IdleOverlay({ onDismiss, onTimeout }) {
    const [secondsLeft, setSecondsLeft] = useState(TOTAL_WARNING_SECONDS);
    const intervalRef = useRef(null);

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current);
                    onTimeout?.();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(intervalRef.current);
    }, [onTimeout]);

    // SVG circle math for the countdown ring
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const progress = secondsLeft / TOTAL_WARNING_SECONDS;
    const strokeDashoffset = circumference * (1 - progress);

    return (
        <div
            className="idle-overlay"
            onClick={onDismiss}
            role="dialog"
            aria-modal="true"
            aria-label="Session timeout warning"
        >
            {/* Animated background particles */}
            <div className="idle-particles">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className={`idle-particle idle-particle-${i + 1}`} />
                ))}
            </div>

            {/* Glass card */}
            <div className="idle-card" onClick={(e) => e.stopPropagation()}>

                {/* Countdown ring */}
                <div className="idle-ring-container">
                    <svg className="idle-ring-svg" viewBox="0 0 160 160">
                        {/* Background track */}
                        <circle
                            cx="80" cy="80" r={radius}
                            fill="none"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="8"
                        />
                        {/* Animated progress */}
                        <circle
                            cx="80" cy="80" r={radius}
                            fill="none"
                            stroke="url(#countdown-gradient)"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className="idle-ring-progress"
                        />
                        <defs>
                            <linearGradient id="countdown-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#10b981" />
                                <stop offset="100%" stopColor="#059669" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="idle-ring-text">
                        <span className="idle-seconds">{secondsLeft}</span>
                        <span className="idle-sec-label">sec</span>
                    </div>
                </div>

                {/* Messaging */}
                <div className="idle-message">
                    <h2 className="idle-title">Session Expiring</h2>
                    <p className="idle-subtitle">
                        Your session will end in <strong>{secondsLeft}</strong> seconds due to inactivity.
                    </p>
                </div>

                {/* Dismiss button */}
                <button className="idle-dismiss-btn" onClick={onDismiss}>
                    <Hand className="idle-btn-icon" />
                    <span>I'm Still Here</span>
                </button>

                {/* Footer */}
                <div className="idle-footer">
                    <ShieldCheck className="idle-footer-icon" />
                    <span>JanSuvidha Secure Kiosk</span>
                </div>
            </div>

            {/* Touch anywhere hint */}
            <p className="idle-touch-hint">
                Tap anywhere to continue your session
            </p>
        </div>
    );
}
