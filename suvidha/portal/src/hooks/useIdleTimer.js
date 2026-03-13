import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook that detects user inactivity and fires callbacks.
 *
 * @param {Object} options
 * @param {number}   options.warningSeconds  - Seconds of inactivity before onWarning fires (default 45)
 * @param {number}   options.idleSeconds     - Seconds of inactivity before onIdle fires (default 60)
 * @param {function} options.onWarning       - Called when warning threshold is reached
 * @param {function} options.onIdle          - Called when idle threshold is reached (auto-logout)
 * @param {boolean}  options.enabled         - Whether the timer is active (default true)
 * @returns {{ resetTimer: function }}
 */
export default function useIdleTimer({
    warningSeconds = 45,
    idleSeconds = 60,
    onWarning,
    onIdle,
    enabled = true,
} = {}) {
    const warningTimerRef = useRef(null);
    const idleTimerRef = useRef(null);
    const warningFiredRef = useRef(false);

    const clearTimers = useCallback(() => {
        if (warningTimerRef.current) {
            clearTimeout(warningTimerRef.current);
            warningTimerRef.current = null;
        }
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
            idleTimerRef.current = null;
        }
    }, []);

    const startTimers = useCallback(() => {
        clearTimers();
        warningFiredRef.current = false;

        warningTimerRef.current = setTimeout(() => {
            warningFiredRef.current = true;
            onWarning?.();
        }, warningSeconds * 1000);

        idleTimerRef.current = setTimeout(() => {
            onIdle?.();
        }, idleSeconds * 1000);
    }, [clearTimers, warningSeconds, idleSeconds, onWarning, onIdle]);

    const resetTimer = useCallback(() => {
        if (enabled) {
            startTimers();
        }
    }, [enabled, startTimers]);

    useEffect(() => {
        if (!enabled) {
            clearTimers();
            return;
        }

        const EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

        const handleActivity = () => {
            // Only reset if the warning overlay is NOT showing yet.
            // Once the overlay is visible, only the explicit "I'm still here" button resets.
            if (!warningFiredRef.current) {
                startTimers();
            }
        };

        // Start timers immediately
        startTimers();

        EVENTS.forEach((event) => {
            document.addEventListener(event, handleActivity, { passive: true });
        });

        return () => {
            clearTimers();
            EVENTS.forEach((event) => {
                document.removeEventListener(event, handleActivity);
            });
        };
    }, [enabled, startTimers, clearTimers]);

    return { resetTimer };
}
