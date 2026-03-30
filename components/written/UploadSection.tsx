"use client";
import { useEffect, useRef, useState } from "react";
import { Upload, Loader2, FileImage, AlertTriangle, X, Camera } from "lucide-react";
import { Capacitor } from "@capacitor/core";

interface UploadSectionProps {
    previewUrl: string | null;
    selectedFile: File | null;
    uploading: boolean;
    solveTimeLeft: number;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onFileSelect: (file: File) => Promise<void> | void;
    onClearFile: () => void;
    onUpload: () => void;
}

export default function UploadSection({
    previewUrl,
    selectedFile,
    uploading,
    solveTimeLeft,
    onFileChange,
    onFileSelect,
    onClearFile,
    onUpload,
}: UploadSectionProps) {
    const [isMobile, setIsMobile] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [cameraLoading, setCameraLoading] = useState(false);
    const [hasCameraSupport, setHasCameraSupport] = useState(false);
    const [useCapacitorAndroidCamera, setUseCapacitorAndroidCamera] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        setIsMobile(/iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 0 && /Macintosh/.test(navigator.userAgent)));
        setHasCameraSupport(!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
        setUseCapacitorAndroidCamera(Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android");
    }, []);

    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    const openCamera = async () => {
        if (cameraLoading) return;
        setCameraError(null);
        setCameraLoading(true);

        try {
            if (useCapacitorAndroidCamera) {
                const { Camera: CapacitorCamera, CameraDirection, CameraResultType, CameraSource } = await import("@capacitor/camera");
                const photo = await CapacitorCamera.getPhoto({
                    quality: 80,
                    allowEditing: false,
                    source: CameraSource.Camera,
                    direction: CameraDirection.Rear,
                    resultType: CameraResultType.Uri,
                    width: 1600,
                    height: 1600,
                });

                const photoUrl = photo.webPath || photo.path;
                if (!photoUrl) {
                    throw new Error("Camera did not return an image path.");
                }

                const response = await fetch(photoUrl);
                const blob = await response.blob();
                const extension = photo.format || "jpeg";
                const file = new File([blob], `answer-${Date.now()}.${extension}`, {
                    type: blob.type || `image/${extension}`,
                });

                await onFileSelect(file);
                setShowCamera(false);
                return;
            }

            if (!hasCameraSupport) {
                setCameraError("Camera is not supported on this browser. Use gallery upload.");
                return;
            }

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: "environment" } },
                audio: false,
            });
            setStream(mediaStream);
            setShowCamera(true);
        } catch {
            setCameraError("Could not open camera. Please allow camera permission or use gallery upload.");
            setShowCamera(false);
        } finally {
            setCameraLoading(false);
        }
    };

    const closeCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setShowCamera(false);
    };

    const captureFromStream = async () => {
        if (!stream || !videoRef.current || isCapturing) return;

        setIsCapturing(true);
        try {
            const width = videoRef.current.videoWidth;
            const height = videoRef.current.videoHeight;
            if (!width || !height) {
                setCameraError("Camera is not ready yet. Please wait a second and try again.");
                return;
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                setCameraError("Could not process captured image. Try again.");
                return;
            }

            ctx.drawImage(videoRef.current, 0, 0, width, height);
            const blob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob(resolve, "image/jpeg", 0.92);
            });
            if (!blob) {
                setCameraError("Could not capture photo. Try again.");
                return;
            }

            const file = new File([blob], `answer-${Date.now()}.jpg`, { type: blob.type || "image/jpeg" });
            await onFileSelect(file);
            closeCamera();
        } catch {
            setCameraError("Could not capture photo. Try again or use gallery upload.");
        } finally {
            setIsCapturing(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">
                {isMobile ? "Take a Photo of Your Answer" : "Upload Your Answer"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-5">
                {isMobile 
                  ? "Open camera and click to upload instantly. Auto-submission prevents cheating." 
                  : "Take a clear photo of your handwritten solution. Max 10MB (JPG, PNG)"
                }
            </p>

            {/* Drop zone or preview */}
            {!previewUrl ? (
                <div className="w-full space-y-3">
                    {isMobile && (hasCameraSupport || useCapacitorAndroidCamera) ? (
                        <button
                            type="button"
                            onClick={openCamera}
                            disabled={cameraLoading}
                            className="flex flex-col items-center justify-center gap-3 w-full h-44 border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50/50 dark:hover:bg-violet-900/20 rounded-2xl transition-all disabled:opacity-70"
                        >
                            <div className="w-14 h-14 bg-violet-100 dark:bg-violet-900/40 rounded-2xl flex items-center justify-center pointer-events-none">
                                {cameraLoading ? (
                                    <Loader2 className="w-7 h-7 text-violet-500 dark:text-violet-400 animate-spin" />
                                ) : (
                                    <Camera className="w-7 h-7 text-violet-500 dark:text-violet-400" />
                                )}
                            </div>
                            <span className="text-slate-600 dark:text-slate-300 font-medium pointer-events-none text-center px-4">
                                {cameraLoading ? "Opening camera..." : useCapacitorAndroidCamera ? "Open native camera and take photo" : "Open camera and take photo"}
                            </span>
                            <span className="text-slate-400 dark:text-slate-500 text-xs pointer-events-none uppercase font-bold tracking-widest">
                                Camera first mode
                            </span>
                        </button>
                    ) : (
                        <label
                            htmlFor="answer-upload"
                            className="flex flex-col items-center justify-center gap-3 w-full h-44 border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50/50 dark:hover:bg-violet-900/20 rounded-2xl cursor-pointer transition-all"
                        >
                            <div className="w-14 h-14 bg-violet-100 dark:bg-violet-900/40 rounded-2xl flex items-center justify-center pointer-events-none">
                                <Upload className="w-7 h-7 text-violet-500 dark:text-violet-400" />
                            </div>
                            <span className="text-slate-600 dark:text-slate-300 font-medium pointer-events-none text-center px-4">
                                Click to upload your answer file
                            </span>
                            <span className="text-slate-400 dark:text-slate-500 text-xs pointer-events-none uppercase font-bold tracking-widest">
                                JPG, PNG up to 10MB
                            </span>
                            <input
                                id="answer-upload"
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="sr-only"
                                onChange={onFileChange}
                            />
                        </label>
                    )}

                    {isMobile && (
                        <label htmlFor="answer-upload-fallback" className="block text-center text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-pointer hover:text-violet-600 dark:hover:text-violet-400">
                            Use gallery instead
                            <input
                                id="answer-upload-fallback"
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={onFileChange}
                            />
                        </label>
                    )}

                    {cameraError && (
                        <p className="text-xs text-red-600 dark:text-red-400 text-center font-medium">{cameraError}</p>
                    )}

                    {showCamera && stream && (
                        <div className="rounded-2xl border border-violet-200 dark:border-violet-800/50 bg-violet-50 dark:bg-violet-900/20 p-3 space-y-3">
                            <video
                                className="w-full rounded-xl bg-black max-h-72 object-contain"
                                autoPlay
                                playsInline
                                muted
                                ref={(node) => {
                                    videoRef.current = node;
                                    if (node && node.srcObject !== stream) {
                                        node.srcObject = stream;
                                    }
                                }}
                            />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={captureFromStream}
                                    disabled={isCapturing}
                                    className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold py-2.5 rounded-xl transition-all"
                                >
                                    {isCapturing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />} Capture
                                </button>
                                <button
                                    type="button"
                                    onClick={closeCamera}
                                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="w-full rounded-2xl border-2 border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20 overflow-hidden">
                    <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={previewUrl}
                            alt="Your answer preview"
                            className="w-full max-h-72 object-contain bg-white dark:bg-slate-900"
                        />
                        {!isMobile && (
                            <button
                                onClick={onClearFile}
                                className="absolute top-2 right-2 w-8 h-8 bg-white/90 dark:bg-slate-800/90 hover:bg-red-50 dark:hover:bg-red-900/30 border border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-800/50 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors shadow-sm"
                                title="Remove and choose different file"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {/* File info bar */}
                    <div className="px-4 py-2.5 flex items-center justify-between bg-violet-50 dark:bg-violet-900/20 border-t border-violet-200 dark:border-violet-800/50">
                        <div className="flex items-center gap-2 text-xs text-violet-700 dark:text-violet-300 font-medium min-w-0">
                            <FileImage className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{selectedFile?.name || "Captured Answer"}</span>
                        </div>
                        <label htmlFor="answer-upload-change" className="ml-3 text-xs text-violet-600 dark:text-violet-400 font-bold cursor-pointer hover:text-violet-800 dark:hover:text-violet-300 shrink-0">
                            Change
                            <input
                                id="answer-upload-change"
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="sr-only"
                                onChange={onFileChange}
                            />
                        </label>
                    </div>
                </div>
            )}

            {/* Time's up warning */}
            {solveTimeLeft === 0 && (
                <div className="mt-3 px-4 py-2.5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 rounded-xl text-sm text-red-700 dark:text-red-400 font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Time&apos;s up! You can still submit but the answer will be marked late.
                </div>
            )}

            <button
                onClick={onUpload}
                disabled={!selectedFile || uploading}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl transition-all shadow-md shadow-violet-500/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
                {uploading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> {isMobile ? "Auto-Submitting..." : "Uploading..."} </>
                    : <>{isMobile ? <Camera className="w-4 h-4" /> : <Upload className="w-4 h-4" />} {isMobile ? "Submit My Photo" : "Submit My Answer"}</>
                }
            </button>
        </div>
    );
}
