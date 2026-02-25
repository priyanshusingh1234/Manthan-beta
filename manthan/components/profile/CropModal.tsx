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
}: CropModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl h-[70vh] p-6">
                <div className="h-[60%] bg-slate-100 dark:bg-slate-700 rounded-xl overflow-hidden relative">
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
                <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Zoom</label>
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.01}
                            value={zoom}
                            onChange={(e) => onZoomChange(Number(e.target.value))}
                            className="w-40 accent-blue-600"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="px-5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onSave}
                            className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-700 hover:to-purple-700 transition shadow-md"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
