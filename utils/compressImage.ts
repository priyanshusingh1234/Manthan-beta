import imageCompression from "browser-image-compression";

type CompressionPreset = "avatar" | "banner" | "answer" | "post" | "chat";

const POST_IMAGE_PRESET: Parameters<typeof imageCompression>[1] = {
    maxSizeMB: 0.6,
    maxWidthOrHeight: 1280,
    useWebWorker: true,
    fileType: "image/webp",
    initialQuality: 0.82,
};

const LARGE_IMAGE_PRESET: Parameters<typeof imageCompression>[1] = {
    maxSizeMB: 1.0,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: "image/webp",
    initialQuality: 0.88,
};

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
    answer: { ...LARGE_IMAGE_PRESET }, // readable upload preset for answer OCR
    post: { ...POST_IMAGE_PRESET }, // post upload fallback preset
    chat: { ...LARGE_IMAGE_PRESET }, // chat upload fallback preset
};

const MB = 1024 * 1024;

/**
 * Compress an image file before uploading to Supabase Storage.
 * Falls back to the original file if compression fails.
 */
export async function compressImage(
    file: File,
    preset: CompressionPreset
): Promise<File> {
    const isBlob = file && (file instanceof Blob || (typeof (file as any).size === 'number' && typeof (file as any).type === 'string' && typeof (file as any).slice === 'function'));
    if (!isBlob) {
        console.warn("[compressImage] Provided file is not a Blob/File. Type:", typeof file, "isBlob:", isBlob);
        return file;
    }

    const targetBytes = Math.floor((PRESETS[preset].maxSizeMB || 1) * MB);

    // Skip work when already small enough.
    if (file.size <= targetBytes) {
        return file;
    }

    try {
        const options = PRESETS[preset];
        const compressed = await imageCompression(file, options);

        let best = compressed;

        // If first pass is still large, do a stronger second pass.
        if (compressed.size > targetBytes) {
            const aggressive = await imageCompression(compressed, {
                ...options,
                maxSizeMB: Math.max(0.2, (options.maxSizeMB || 1) * 0.75),
                maxWidthOrHeight: Math.max(900, Math.floor((options.maxWidthOrHeight || 1600) * 0.85)),
                initialQuality: 0.72,
                fileType: "image/webp",
                useWebWorker: true,
            });

            if (aggressive.size < best.size) {
                best = aggressive;
            }
        }

        // Keep compressed file whenever it improves size or when original was oversized.
        if (best.size < file.size || file.size > targetBytes) {
            const originalName = file.name || "image.jpg";
            const newName = originalName.replace(/\.\w+$/, ".webp");
            
            try {
                return new File([best], newName, {
                    type: "image/webp",
                    lastModified: Date.now(),
                });
            } catch (e) {
                // Fallback to Blob with a custom property if File constructor fails
                console.warn("[compressImage] File constructor failed in finish, using Blob fallback");
                const b = best as any;
                b.name = newName;
                return b as File;
            }
        }

        return file;
    } catch (err) {
        console.warn("[compressImage] Compression failed, using original:", err);
        return file;
    }
}
