import imageCompression from "browser-image-compression";

type CompressionPreset = "avatar" | "banner" | "answer";

const PRESETS: Record<CompressionPreset, Parameters<typeof imageCompression>[1]> = {
    avatar: {
        maxSizeMB: 0.3,         // 300 KB max
        maxWidthOrHeight: 400,  // small — only used as a thumbnail
        useWebWorker: true,
        fileType: "image/webp",
        initialQuality: 0.80,
    },
    banner: {
        maxSizeMB: 0.6,         // 600 KB max
        maxWidthOrHeight: 1280, // wide banner
        useWebWorker: true,
        fileType: "image/webp",
        initialQuality: 0.82,
    },
    answer: {
        maxSizeMB: 1.0,         // 1 MB max — needs to stay readable for AI
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        fileType: "image/webp",
        initialQuality: 0.88,
    },
};

/**
 * Compress an image file before uploading to Supabase Storage.
 * Falls back to the original file if compression fails.
 */
export async function compressImage(
    file: File,
    preset: CompressionPreset
): Promise<File> {
    try {
        const options = PRESETS[preset];
        const compressed = await imageCompression(file, options);

        // Only use compressed version if it's actually smaller
        if (compressed.size < file.size) {
            return new File([compressed], file.name.replace(/\.\w+$/, ".webp"), {
                type: "image/webp",
                lastModified: Date.now(),
            });
        }
        return file;
    } catch (err) {
        console.warn("[compressImage] Compression failed, using original:", err);
        return file;
    }
}
