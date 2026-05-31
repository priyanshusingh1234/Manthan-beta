type CompressionPreset = "avatar" | "banner" | "answer";

export async function compressImage(
    file: any,
    preset: CompressionPreset
): Promise<any> {
    // In React Native, browser-image-compression doesn't work.
    // Returning the original file for now. 
    // Image compression can be handled via expo-image-manipulator later.
    return file;
}
