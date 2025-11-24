"use client";

import React, { useState } from 'react';
import WebcamCapture from '@/components/WebcamCapture';
import EmotionDisplay from '@/components/EmotionDisplay';
import EmotionHistory from '@/components/EmotionHistory';

interface HistoryItem {
  id: number;
  emotion: string;
  timestamp: Date;
}

export default function Home() {
  const [emotion, setEmotion] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const handleEmotionDetected = (detectedEmotion: string) => {
    setEmotion(detectedEmotion);

    setHistory(prev => {
      // Add to history
      const newItem = {
        id: Date.now(),
        emotion: detectedEmotion,
        timestamp: new Date()
      };
      // Keep last 50 items
      return [...prev, newItem].slice(-50);
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="max-w-7xl w-full space-y-12">

        {/* Header */}
        <header className="text-center space-y-4">
          <h1 className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 tracking-tighter drop-shadow-lg">
            Emotion AI
          </h1>
          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto font-light">
            Real-time facial expression recognition powered by deep learning.
          </p>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Webcam (Span 6) */}
          <div className="lg:col-span-6 flex flex-col items-center space-y-4">
            <div className="w-full relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              <WebcamCapture onEmotionDetected={handleEmotionDetected} />
            </div>
            <p className="text-sm text-gray-500">
              Privacy Notice: Images are processed locally and not stored.
            </p>
          </div>

          {/* Middle Column: Current Emotion (Span 3) */}
          <div className="lg:col-span-3 flex flex-col items-center justify-center h-full">
            <EmotionDisplay emotion={emotion} />
          </div>

          {/* Right Column: History/Chat (Span 3) */}
          <div className="lg:col-span-3 flex flex-col items-center justify-start h-full">
            <EmotionHistory history={history} />
          </div>

        </div>

        {/* Footer */}
        <footer className="text-center text-gray-600 pt-12 text-sm">
          <p>&copy; {new Date().getFullYear()} Emotion AI Project. Built with Next.js & FastAPI.</p>
        </footer>

      </div>
    </main>
  );
}
