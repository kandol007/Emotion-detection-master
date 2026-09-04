"use client";

import React, { useState } from 'react';
import WebcamCapture, { EmotionResult } from '@/components/WebcamCapture';
import EmotionDisplay from '@/components/EmotionDisplay';
import EmotionHistory from '@/components/EmotionHistory';

interface HistoryItem {
  id: number;
  emotion: string;
  timestamp: Date;
}

export default function Home() {
  const [detectionResult, setDetectionResult] = useState<EmotionResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const handleEmotionDetected = (result: EmotionResult) => {
    setDetectionResult(result);

    if (result.face_detected && result.emotion && result.confidence > 0.25) {
      setHistory(prev => {
        // Prevent flood of identical consecutive items within 3 seconds
        if (
          prev.length > 0 &&
          prev[prev.length - 1].emotion === result.emotion &&
          (Date.now() - prev[prev.length - 1].timestamp.getTime()) < 3000
        ) {
          return prev;
        }
        const newItem: HistoryItem = {
          id: Date.now(),
          emotion: result.emotion,
          timestamp: new Date()
        };
        return [...prev, newItem].slice(-50);
      });
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-white flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="max-w-7xl w-full space-y-8">

        {/* Header */}
        <header className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide mb-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
            <span>Ultra-Accurate Mini-Xception + YuNet Engine</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 tracking-tight drop-shadow-md">
            Real-Time Emotion AI
          </h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto font-normal">
            Deep-learning facial expression recognition powered by residual convolutional networks and adaptive lighting normalization.
          </p>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left Column: Webcam (Span 6) */}
          <div className="lg:col-span-6 flex flex-col items-center space-y-4">
            <div className="w-full relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition duration-500"></div>
              <WebcamCapture onEmotionDetected={handleEmotionDetected} />
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-400">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>YuNet Face Tracking</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                <span>CLAHE Contrast Enhancement</span>
              </span>
              <span>•</span>
              <span>Local Processing</span>
            </div>
          </div>

          {/* Middle Column: Current Emotion (Span 3) */}
          <div className="lg:col-span-3 flex flex-col items-center justify-start h-full">
            <EmotionDisplay
              emotion={detectionResult?.emotion ?? null}
              confidence={detectionResult?.confidence ?? 0}
              probabilities={detectionResult?.probabilities ?? {}}
              faceDetected={detectionResult?.face_detected ?? false}
            />
          </div>

          {/* Right Column: History/Chat (Span 3) */}
          <div className="lg:col-span-3 flex flex-col items-center justify-start h-full">
            <EmotionHistory history={history} />
          </div>

        </div>

        {/* Footer */}
        <footer className="text-center text-gray-600 pt-8 text-xs">
          <p>&copy; {new Date().getFullYear()} Emotion AI. High-performance inference with FastAPI & Next.js.</p>
        </footer>

      </div>
    </main>
  );
}
