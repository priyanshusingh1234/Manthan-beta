"use client";

import Cropper, { type Area } from "react-easy-crop";

interface CropModalProps {
    imageSrc: string;
    crop: { x: number; y: number };
    zoom: number;
    cropType: "avatar" | "banner";
    onCropChange: (crop: { x: number; y: number }) => void;
    onZoomChange: (zoom: number) => void;
    onCropComplete: (croppedArea: Area, croppedAreaPixels: Area) => void;
    onSave: () => void;
    onCancel: () => void;
    loading?: boolean;
}

export default function CropModal({
    imageSrc,
    crop,
    zoom,
    cropType,
    onCropChange,
    onZoomChange,
    onCropComplete,
    onSave,
    onCancel,
    loading = false,
}: CropModalProps) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-white dark:bg-slate-800 sm:rounded-2xl shadow-2xl w-full max-w-3xl h-full sm:h-[70vh] sm:max-h-[90vh] flex flex-col p-4 md:p-6 overflow-hidden pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))] sm:pb-4">
                <div className="flex-1 bg-slate-100 dark:bg-slate-700 sm:rounded-xl overflow-hidden relative min-h-0 mb-4 sm:mb-0">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={cropType === "avatar" ? 1 : 16 / 6}
                        onCropChange={onCropChange}
                        onZoomChange={onZoomChange}
                        onCropComplete={onCropComplete}
                    />
                </div>
                <div className="mt-4 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Zoom</label>
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.01}
                            value={zoom}
                            onChange={(e) => onZoomChange(Number(e.target.value))}
                            className="w-full sm:w-40 accent-blue-600"
                        />
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto justify-end shrink-0">
                        <button
                            onClick={onCancel}
                            className="px-5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onSave}
                            disabled={loading}
                            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-700 hover:to-purple-700 transition shadow-md disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : null}
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
