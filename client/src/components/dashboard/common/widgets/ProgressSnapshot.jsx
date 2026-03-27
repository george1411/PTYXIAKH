import React from 'react';
import DashboardPanel from '../DashboardPanel';

const ProgressSnapshot = () => {
    return (
        <DashboardPanel title="Progress Snapshot" className="col-span-1 h-full">
            <div className="flex flex-col h-full justify-end">
                <div className="flex items-center justify-center flex-1">
                    {/* Placeholder for a line graph or just empty space as per design */}
                    <div className="w-full h-1/2 bg-gradient-to-t from-white/5 to-transparent rounded-lg"></div>
                </div>

                <div className="mt-4 flex justify-between items-end">
                    <div>
                        <p className="text-gray-500 text-xs mb-1">Current Weight</p>
                        <p className="text-3xl font-bold text-white tracking-tighter">82.4 <span className="text-lg text-gray-500 font-normal">kg</span></p>
                    </div>
                    <div className="text-right">
                        <p className="text-gray-500 text-xs mb-1">Change</p>
                        <div className="flex items-center gap-1 text-green-400 font-bold text-sm">
                            <span>-0.5%</span>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardPanel>
    );
};

export default ProgressSnapshot;
