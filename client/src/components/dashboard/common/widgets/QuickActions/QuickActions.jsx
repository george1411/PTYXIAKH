import React from 'react';
import './QuickActions.css';

const actions = [
    { id: 'nutrition', label: 'Log Meal' },
    { id: 'workout',   label: 'Start Workout' },
    { id: 'progress',  label: 'Progress' },
    { id: 'messages',  label: 'Message Trainer' },
];

const QuickActions = ({ onNavigate }) => (
    <div className="qa-row">
        {actions.map(a => (
            <button key={a.id} className="qa-btn" onClick={() => onNavigate(a.id)}>
                <span className="qa-label">{a.label}</span>
            </button>
        ))}
    </div>
);

export default QuickActions;
