import React from 'react';
import DashboardPanel from '../DashboardPanel';
import { Send } from 'lucide-react';

const Message = ({ text, time, isMe }) => (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4`}>
        {!isMe && (
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-2 shrink-0 border border-gray-600">
                <span className="text-xs font-bold text-white">CM</span>
            </div>
        )}
        <div className={`max-w-[80%] rounded-xl p-3 ${isMe
                ? 'bg-white text-black rounded-tr-none'
                : 'bg-gray-800 text-gray-200 rounded-tl-none border border-white/5'
            }`}>
            <p className="text-sm leading-relaxed">{text}</p>
            <p className={`text-[10px] mt-1 ${isMe ? 'text-gray-400' : 'text-gray-500'}`}>{time}</p>
        </div>
    </div>
);

const TrainerChat = () => {
    return (
        <DashboardPanel title="Trainer Chat" className="col-span-1 md:col-span-2 row-span-2 flex flex-col h-full">
            {/* Messages Area - Grow to fill space */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-4">
                <Message
                    text="Great depth on those squats today!"
                    time="10:42 AM"
                    isMe={false}
                />
                <Message
                    text="Thanks! Felt heavier than last week though. Should I deload?"
                    time="10:45 AM"
                    isMe={true}
                />
                <Message
                    text="Let's see how you feel after the rest day. If still fatigued, we'll drop volume by 20%."
                    time="10:48 AM"
                    isMe={false}
                />
            </div>

            {/* Input Area */}
            <div className="mt-auto">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Message Coach Mike..."
                        className="w-full bg-black/40 border border-gray-800 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-white focus:bg-black transition-colors"
                    />
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors">
                        <Send size={14} />
                    </button>
                </div>
            </div>
        </DashboardPanel>
    );
};

export default TrainerChat;
