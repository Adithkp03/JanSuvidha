import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useSpeakAloud from '../hooks/useSpeakAloud';
import { ShieldCheckIcon, ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';

/**
 * Full-screen "Are you sure?" confirmation dialog.
 * Always styled with large, accessible sizing.
 * Speaks the prompt aloud when opened (in Senior Mode).
 *
 * @param {{ title?: string, message?: string, onConfirm: () => void, onCancel: () => void }} props
 */
export default function ConfirmationDialog({ title, message, onConfirm, onCancel }) {
    const { t } = useTranslation();
    const { speak } = useSpeakAloud();

    const displayTitle = title || t('ConfirmTitle');
    const displayMessage = message || t('ConfirmDesc');

    // Speak the confirmation prompt when the dialog opens
    useEffect(() => {
        speak(`${displayTitle}. ${displayMessage}`);
    }, [speak, displayTitle, displayMessage]);

    return (
        <div
            className="confirm-overlay"
            role="alertdialog"
            aria-modal="true"
            aria-label={displayTitle}
        >
            <div className="confirm-card">
                {/* Icon */}
                <div className="confirm-icon-wrapper">
                    <ShieldCheckIcon className="confirm-icon" />
                </div>

                {/* Text */}
                <h2 className="confirm-title">{displayTitle}</h2>
                <p className="confirm-message">{displayMessage}</p>

                {/* Buttons */}
                <div className="confirm-buttons">
                    <button
                        className="confirm-btn-yes"
                        onClick={onConfirm}
                        autoFocus
                    >
                        <CheckIcon className="confirm-btn-icon" />
                        <span>{t('ConfirmYes')}</span>
                    </button>
                    <button
                        className="confirm-btn-no"
                        onClick={onCancel}
                    >
                        <ArrowLeftIcon className="confirm-btn-icon" />
                        <span>{t('ConfirmNo')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
