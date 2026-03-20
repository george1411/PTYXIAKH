import React from 'react';

const DashboardPanel = ({ title, children, className = '', action }) => {
    return (
        <div className={`bg-white border border-black/10 rounded-xl overflow-hidden flex flex-col ${className}`}>
            {title && (
                <div className="border-b border-black/10 px-6 py-4 flex justify-between items-center bg-gray-50">
                    {/* kept text-gray-400 as it might still look ok, or should be darker? User said "lines or letters black". Let's make it text-black for title? Or keep gray for subtitle/label look? User said "lines or letters black". I'll stick to gray for now as it's a label, but maybe update text-gray-400 to text-gray-600 for visibility on white */}
                    <h3 className="text-xs font-light text-black uppercase tracking-wider">{title}</h3>
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className="flex-1 p-6 relative">
                {children}
            </div>
        </div>
    );
};

export default DashboardPanel;
