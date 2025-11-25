"use client";

import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';

interface WebcamCaptureProps {
    onEmotionDetected: (emotion: string) => void;
}

const WebcamCapture: React.FC<WebcamCaptureProps> = ({ onEmotionDetected }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null); // Use ref for cleanup access
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    // Attach stream to video element when it becomes available
    useEffect(() => {
        if (isStreaming && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [isStreaming]);

    // Capture frames loop
    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (isStreaming) {
            intervalId = setInterval(() => {
                captureFrame();
            }, 1000); // Capture every 1 second
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isStreaming]);

    const startCamera = async () => {
        setError(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });

            // Update ref and state
            streamRef.current = mediaStream;

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }

            setIsStreaming(true);
        } catch (err: any) {
            console.error("Error accessing webcam:", err);
            let errorMessage = "Could not access webcam.";
            if (err.name === 'NotAllowedError') {
                errorMessage = "Permission denied. Please allow camera access in your browser settings.";
            } else if (err.name === 'NotFoundError') {
                errorMessage = "No camera found. Please connect a camera.";
            } else if (err.name === 'NotReadableError') {
                errorMessage = "Camera is currently in use by another application.";
            } else if (err.message) {
                errorMessage = `Camera Error: ${err.message}`;
            }
            setError(errorMessage);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsStreaming(false);
    };

    const captureFrame = async () => {
        if (!videoRef.current || !canvasRef.current || !isStreaming) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (context && video.videoWidth > 0 && video.videoHeight > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(async (blob) => {
                if (blob) {
                    await sendFrameToBackend(blob);
                }
            }, 'image/jpeg');
        }
    };

    const sendFrameToBackend = async (imageBlob: Blob) => {
        const formData = new FormData();
        formData.append('file', imageBlob, 'capture.jpg');

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://emotion-detection-master-pflo.onrender.com';
            const response = await axios.post(`${apiUrl}/predict`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data && response.data.emotion) {
                onEmotionDetected(response.data.emotion);
            }
        } catch (err: any) {
            if (axios.isAxiosError(err)) {
                if (err.code === 'ERR_NETWORK') {
                    setError("Cannot connect to backend. Is it running on port 8000?");
                } else {
                    console.error(`Backend error: ${err.message}`);
                }
            }
        }
    };

    return (
        <div className="flex flex-col items-center w-full max-w-2xl mx-auto">

            {/* Camera Viewport */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-gray-700 bg-black group z-0">
                {error ? (
                    <div className="flex items-center justify-center h-full text-red-500 p-4 text-center">
                        {error}
                    </div>
                ) : !isStreaming ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                        <div className="w-16 h-16 rounded-full border-2 border-gray-600 flex items-center justify-center">
                            <div className="w-12 h-12 bg-gray-800 rounded-full"></div>
                        </div>
                        <p>Camera is off</p>
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
                        <div className="absolute top-4 right-4">
                            <div className="flex items-center space-x-2 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                <span className="text-white text-xs font-medium tracking-wider">REC</span>
                            </div>
                        </div>
                    </>
                )}
                <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Controls - Added margin-top and z-index */}
            <div className="flex items-center space-x-6 mt-8 z-10">
                {!isStreaming ? (
                    <button
                        onClick={startCamera}
                        className="group relative px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white font-bold shadow-lg hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105 active:scale-95 overflow-hidden"
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
                        className="group px-8 py-3 bg-gray-800 border border-red-500/50 text-red-400 rounded-full font-bold shadow-lg hover:bg-red-500/10 transition-all duration-300 transform hover:scale-105 active:scale-95"
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
