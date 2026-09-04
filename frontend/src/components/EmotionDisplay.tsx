import React from 'react';

interface EmotionDisplayProps {
    emotion: string | null;
    confidence?: number;
    probabilities?: Record<string, number>;
    faceDetected?: boolean;
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

const emotionColors: { [key: string]: { text: string; bg: string; bar: string } } = {
    "Angry": { text: "text-red-400", bg: "bg-red-500/10 border-red-500/30", bar: "bg-red-500" },
    "Disgusted": { text: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", bar: "bg-emerald-500" },
    "Fearful": { text: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30", bar: "bg-purple-500" },
    "Happy": { text: "text-amber-300", bg: "bg-amber-500/10 border-amber-500/30", bar: "bg-amber-400" },
    "Neutral": { text: "text-slate-300", bg: "bg-slate-500/10 border-slate-500/30", bar: "bg-slate-400" },
    "Sad": { text: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/30", bar: "bg-sky-500" },
    "Surprised": { text: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30", bar: "bg-orange-400" }
};

const EmotionDisplay: React.FC<EmotionDisplayProps> = ({
    emotion,
    confidence = 0,
    probabilities = {},
    faceDetected = false
}) => {
    if (!emotion || !faceDetected) {
        return (
            <div className="w-full text-center p-8 bg-gray-800/40 rounded-2xl backdrop-blur-md border border-gray-700/60 shadow-xl min-h-[360px] flex flex-col items-center justify-center space-y-4">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center animate-spin-slow">
                    <span className="text-3xl">👤</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-400">Looking for a face...</h2>
                <p className="text-xs text-gray-500 max-w-[200px]">Position your face in front of the camera</p>
            </div>
        );
    }

    const emoji = emotionEmojis[emotion] || "🤔";
    const styling = emotionColors[emotion] || { text: "text-white", bg: "bg-gray-700/20 border-gray-600", bar: "bg-blue-500" };
    const confPercent = Math.round(confidence * 100);

    // Sorted top 3 emotions by score
    const topEmotions = Object.entries(probabilities)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

    return (
        <div className={`w-full p-6 ${styling.bg} rounded-2xl backdrop-blur-md border shadow-2xl transition-all duration-300 min-h-[360px] flex flex-col justify-between`}>
            {/* Top Badge: Confidence */}
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Live Recognition
                </span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${confPercent > 70 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}>
                    {confPercent}% Confidence
                </span>
            </div>

            {/* Emoji & Winning Emotion */}
            <div className="text-center my-4">
                <div className="text-8xl mb-2 filter drop-shadow-lg transform transition-transform duration-200 hover:scale-110">
                    {emoji}
                </div>
                <h2 className={`text-4xl font-black ${styling.text} tracking-tight drop-shadow`}>
                    {emotion}
                </h2>
                <p className="text-gray-400 text-xs mt-1 font-medium">Primary Emotion</p>
            </div>

            {/* Probability Breakdown (Top 3) */}
            {topEmotions.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                    {topEmotions.map(([label, score]) => {
                        const pct = Math.round(score * 100);
                        const emoStyle = emotionColors[label] || { bar: "bg-gray-500", text: "text-gray-300" };
                        return (
                            <div key={label} className="text-xs space-y-1">
                                <div className="flex justify-between text-gray-300">
                                    <span className="font-medium">{label}</span>
                                    <span className="font-mono text-gray-400">{pct}%</span>
                                </div>
                                <div className="w-full bg-gray-900/60 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className={`${emoStyle.bar} h-1.5 rounded-full transition-all duration-300`}
                                        style={{ width: `${pct}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default EmotionDisplay;
