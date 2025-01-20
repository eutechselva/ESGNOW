import React from 'react';
import './SlideInPanel.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface SlideInPanelProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
}

const SlideInPanel: React.FC<SlideInPanelProps> = ({ isOpen, onClose, title, children }) => {
    return (
        <div className={`slide-in-panel ${isOpen ? 'slide-in-panel--open' : ''}`}>
            <div className="slide-in-panel__content">
                <div className="slide-in-panel__header">
                    <h2 className="slide-in-panel__title">{title}</h2>
                    <div className="slide-in-panel__close-btn" onClick={onClose}>
                        <FontAwesomeIcon icon={['fas', 'times']} />
                    </div>
                </div>
                <div className="slide-in-panel__body">{children}</div>
            </div>
        </div>
    );
};

export default SlideInPanel;
