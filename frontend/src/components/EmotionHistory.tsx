import React, { useEffect, useRef } from 'react';

interface HistoryItem {
    id: number;
    emotion: string;
    timestamp: Date;
}

interface EmotionHistoryProps {
    history: HistoryItem[];
}

const emotionMessages: { [key: string]: string[] } = {
    "Angry": ["You seem upset.", "Why so serious?", "Take a deep breath."],
    "Disgusted": ["Something unpleasant?", "Not to your taste?", "Eww!"],
    "Fearful": ["Are you okay?", "Don't be afraid.", "I'm here with you."],
    "Happy": ["You look great!", "Keep smiling!", "Positive vibes!"],
    "Neutral": ["Poker face?", "Deep in thought?", "Stay calm."],
    "Sad": ["Cheer up!", "It will get better.", "Sending hugs."],
    "Surprised": ["Wow!", "Didn't expect that?", "Shocking!"]
};

const EmotionHistory: React.FC<EmotionHistoryProps> = ({ history }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);

    const getMessage = (emotion: string, id: number) => {
        const messages = emotionMessages[emotion] || ["I see you."];
        // Use id to pseudo-randomly select a message so it stays consistent for the same item
        return messages[id % messages.length];
    };

    return (
        <div className="w-full max-w-md bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-2xl overflow-hidden flex flex-col h-[400px] shadow-xl">
            <div className="p-4 border-b border-gray-700 bg-gray-800/50">
                <h3 className="text-lg font-semibold text-white flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                    Emotion Log
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent" ref={scrollRef}>
                {history.length === 0 ? (
                    <div className="text-center text-gray-500 mt-10 text-sm">
                        Start the camera to begin detection...
                    </div>
                ) : (
                    history.map((item) => (
                        <div key={item.id} className="flex flex-col space-y-1 animate-fade-in-up">
                            <div className="flex items-end space-x-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                    AI
                                </div>
                                <div className="bg-gray-800 text-gray-200 px-4 py-2 rounded-2xl rounded-bl-none max-w-[80%] text-sm shadow-md border border-gray-700">
                                    <span className="font-bold text-blue-400 block text-xs mb-1">{item.emotion}</span>
                                    {getMessage(item.emotion, item.id)}
                                </div>
                            </div>
                            <span className="text-[10px] text-gray-600 ml-10">
                                {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default EmotionHistory;
