import React from 'react';

interface EmotionDisplayProps {
    emotion: string | null;
}

const emotionEmojis: { [key: string]: string } = {
    "Angry": "😠",
    "Disgusted": "🤢",
    "Fearful": "😨",
    "Happy": "😄",
    "Neutral": "😐",
    "Sad": "😢",
    "Surprised": "😲"
};

const emotionColors: { [key: string]: string } = {
    "Angry": "text-red-500",
    "Disgusted": "text-green-600",
    "Fearful": "text-purple-500",
    "Happy": "text-yellow-400",
    "Neutral": "text-gray-400",
    "Sad": "text-blue-500",
    "Surprised": "text-orange-400"
};

const EmotionDisplay: React.FC<EmotionDisplayProps> = ({ emotion }) => {
    if (!emotion) {
        return (
            <div className="text-center p-8">
                <h2 className="text-2xl font-bold text-gray-500 animate-pulse">Waiting for detection...</h2>
            </div>
        );
    }

    const emoji = emotionEmojis[emotion] || "🤔";
    const colorClass = emotionColors[emotion] || "text-white";

    return (
        <div className="text-center p-8 bg-gray-800/50 rounded-2xl backdrop-blur-md border border-gray-700 shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="text-9xl mb-4 animate-bounce-slow">{emoji}</div>
            <h2 className={`text-5xl font-extrabold ${colorClass} tracking-tight`}>
                {emotion}
            </h2>
            <p className="text-gray-400 mt-2 text-lg">Detected Emotion</p>
        </div>
    );
};

export default EmotionDisplay;
