import React from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare } from 'lucide-react';

const FeedbackButton = () => {
    return createPortal(
        <div className="feedback-widget">
            <a
                href="https://forms.gle/your-form-id"
                target="_blank"
                rel="noopener noreferrer"
                className="feedback-button"
                title="Send Feedback"
            >
                <span className="desktop-only">Feedback</span>
                <MessageSquare size={20} className="mobile-only" />
            </a>
        </div>,
        document.body
    );
};

export default FeedbackButton;
