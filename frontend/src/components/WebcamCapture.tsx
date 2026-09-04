"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export interface EmotionResult {
    emotion: string;
    confidence: number;
    probabilities?: Record<string, number>;
    face_detected: boolean;
    bbox?: [number, number, number, number] | null;
    model_type?: string;
}

interface WebcamCaptureProps {
    onEmotionDetected: (result: EmotionResult) => void;
}

const WebcamCapture: React.FC<WebcamCaptureProps> = ({ onEmotionDetected }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const isSendingRef = useRef(false);

    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [faceBox, setFaceBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
    const [videoDims, setVideoDims] = useState<{ w: number; h: number }>({ w: 640, h: 480 });

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsStreaming(false);
        setFaceBox(null);
    }, []);

    const sendFrameToBackend = useCallback(async (imageBlob: Blob) => {
        if (isSendingRef.current) return;
        isSendingRef.current = true;

        const formData = new FormData();
        formData.append('file', imageBlob, 'capture.jpg');

        try {
            // Intelligent API URL resolution: env variable, or local dev backend fallback
            let apiUrl = process.env.NEXT_PUBLIC_API_URL;
            if (!apiUrl && typeof window !== 'undefined') {
                const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                apiUrl = isLocal ? 'http://127.0.0.1:8000' : 'https://emotion-detection-master-pflo.onrender.com';
            }
            apiUrl = apiUrl || 'http://127.0.0.1:8000';

            const response = await axios.post(`${apiUrl}/predict`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 3000,
            });

            if (response.data) {
                const data = response.data;
                onEmotionDetected({
                    emotion: data.emotion || "Neutral",
                    confidence: typeof data.confidence === 'number' ? data.confidence : 0,
                    probabilities: data.probabilities || {},
                    face_detected: !!data.face_detected,
                    bbox: data.bbox || null,
                    model_type: data.model_type,
                });

                if (data.face_detected && data.bbox && data.bbox.length === 4) {
                    setFaceBox({
                        x: data.bbox[0],
                        y: data.bbox[1],
                        w: data.bbox[2],
                        h: data.bbox[3],
                    });
                } else {
                    setFaceBox(null);
                }
                setError(null);
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                if (err.code === 'ERR_NETWORK') {
                    setError("Cannot connect to backend. Make sure FastAPI is running on port 8000.");
                } else {
                    console.error(`Backend error: ${err.message}`);
                }
            }
        } finally {
            isSendingRef.current = false;
        }
    }, [onEmotionDetected]);

    const captureFrame = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current || !isStreaming || isSendingRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (context && video.videoWidth > 0 && video.videoHeight > 0) {
            setVideoDims({ w: video.videoWidth, h: video.videoHeight });
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                if (blob) {
                    sendFrameToBackend(blob);
                }
            }, 'image/jpeg', 0.85);
        }
    }, [isStreaming, sendFrameToBackend]);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    // Attach stream to video element when it becomes available
    useEffect(() => {
        if (isStreaming && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [isStreaming]);

    // High-responsiveness frame capture loop (500ms interval = 2 FPS)
    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (isStreaming) {
            intervalId = setInterval(() => {
                captureFrame();
            }, 500);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isStreaming, captureFrame]);

    const startCamera = async () => {
        setError(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }
            });

            streamRef.current = mediaStream;

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }

            setIsStreaming(true);
        } catch (err: unknown) {
            console.error("Error accessing webcam:", err);
            let errorMessage = "Could not access webcam.";
            if (err instanceof DOMException && err.name === 'NotAllowedError') {
                errorMessage = "Permission denied. Please allow camera access in your browser settings.";
            } else if (err instanceof DOMException && err.name === 'NotFoundError') {
                errorMessage = "No camera found. Please connect a camera.";
            } else if (err instanceof DOMException && err.name === 'NotReadableError') {
                errorMessage = "Camera is currently in use by another application.";
            } else if (err instanceof Error && err.message) {
                errorMessage = `Camera Error: ${err.message}`;
            }
            setError(errorMessage);
        }
    };

    return (
        <div className="flex flex-col items-center w-full max-w-2xl mx-auto">

            {/* Camera Viewport */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-gray-700 bg-black group z-0">
                {error ? (
                    <div className="flex flex-col items-center justify-center h-full text-red-400 p-6 text-center space-y-2">
                        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        <p className="font-semibold">{error}</p>
                    </div>
                ) : !isStreaming ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                        <div className="w-16 h-16 rounded-full border-2 border-gray-600 flex items-center justify-center">
                            <div className="w-12 h-12 bg-gray-800 rounded-full"></div>
                        </div>
                        <p className="text-gray-400 font-medium">Camera is off</p>
                    </div>
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover transform scale-x-[-1]"
                        />

                        {/* Real-time Face Tracking Overlay */}
                        {faceBox && videoDims.w > 0 && videoDims.h > 0 && (
                            <div
                                className="absolute border-2 border-emerald-400/80 rounded-xl pointer-events-none transition-all duration-200 shadow-[0_0_15px_rgba(52,211,153,0.4)]"
                                style={{
                                    // Mirror horizontally because the video is mirrored (scale-x-[-1])
                                    left: `${(1 - (faceBox.x + faceBox.w) / videoDims.w) * 100}%`,
                                    top: `${(faceBox.y / videoDims.h) * 100}%`,
                                    width: `${(faceBox.w / videoDims.w) * 100}%`,
                                    height: `${(faceBox.h / videoDims.h) * 100}%`,
                                }}
                            >
                                <span className="absolute -top-6 left-0 bg-emerald-500/90 text-black text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                                    FACE TRACKED
                                </span>
                            </div>
                        )}

                        <div className="absolute top-4 right-4">
                            <div className="flex items-center space-x-2 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
                                <span className="text-white text-xs font-semibold tracking-wider">LIVE</span>
                            </div>
                        </div>
                    </>
                )}
                <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-6 mt-8 z-10">
                {!isStreaming ? (
                    <button
                        onClick={startCamera}
                        className="group relative px-8 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white font-bold shadow-lg hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-105 active:scale-95 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 ease-out -skew-x-12 origin-left"></div>
                        <span className="flex items-center space-x-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <span>Start Camera</span>
                        </span>
                    </button>
                ) : (
                    <button
                        onClick={stopCamera}
                        className="group px-8 py-3.5 bg-gray-800/90 border border-red-500/50 text-red-400 rounded-full font-bold shadow-lg hover:bg-red-500/10 transition-all duration-300 transform hover:scale-105 active:scale-95"
                    >
                        <span className="flex items-center space-x-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"></path></svg>
                            <span>Stop Camera</span>
                        </span>
                    </button>
                )}
            </div>

        </div>
    );
};

export default WebcamCapture;
