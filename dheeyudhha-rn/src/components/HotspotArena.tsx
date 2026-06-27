// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, Image, TouchableWithoutFeedback, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';

interface HotspotArenaProps {
  question: any;
  onAttempt: (isCorrect: boolean) => void;
  disabled?: boolean;
  isSubmitting?: boolean;
}

export default function HotspotArena({ question, onAttempt, disabled, isSubmitting }: HotspotArenaProps) {
  const [pin, setPin] = useState<{ x: number; y: number } | null>(null);

  const resolveImageUrl = (raw?: string | null) => {
    if (!raw) return null;
    if (raw.startsWith('http')) return raw;
    if (raw.startsWith('/')) return `${process.env.EXPO_PUBLIC_API_URL}${raw}`;
    return `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/question-images/${raw}`;
  };
  
  const imageUrl = resolveImageUrl(question?.image_url || question?.image_path);
  const hotspots = question.match_pairs || [];

  const handleImagePress = (event: any) => {
    if (disabled) return;
    const { locationX, locationY } = event.nativeEvent;
    
    // We need to know the rendered image dimensions to calculate normalized coordinates.
    // However, on layout, Image scales. Since we use resizeMode="contain", the actual image
    // size might differ from the view size. But for simplicity, we'll assume the Image view
    // covers the exact layout if we force it to cover, or we just calculate based on the
    // layout bounding box.
    // Wait, with resizeMode='contain', the image might have letterboxes. That makes coordinates wrong!
    // A better approach is to use resizeMode='cover' but give it an aspect ratio if possible,
    // or just let it fill and crop. Since we don't know aspect ratio, resizeMode="stretch" or "cover"?
    // For hotspots, it's CRITICAL the image fills the view so X/Y map correctly. Let's force it to fill
    // a square or a specific ratio, or use stretch so 0-1 mapped coordinates align.
    
    // Let's use the touch event on the container View which has the exact dimensions
  };

  const [layoutDims, setLayoutDims] = useState<{ width: number; height: number } | null>(null);

  const handlePress = (e: any) => {
    if (disabled || !layoutDims) return;
    const { locationX, locationY } = e.nativeEvent;
    const x = locationX / layoutDims.width;
    const y = locationY / layoutDims.height;
    setPin({ x, y });
  };

  const handleSubmit = () => {
    if (!pin || disabled) return;
    
    let isCorrect = false;
    for (const h of hotspots) {
      const dist = Math.sqrt(Math.pow(pin.x - h.x, 2) + Math.pow(pin.y - h.y, 2));
      const effectiveRadius = h.radius + 0.04;
      if (dist <= effectiveRadius) {
        isCorrect = true;
        break;
      }
    }
    
    onAttempt(isCorrect);
  };

  if (!imageUrl) return <Text className="text-red-500">Image is missing for hotspot question.</Text>;

  return (
    <View className="space-y-4">
      <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
        Tap on the image to place your pin at the correct location.
      </Text>
      
      {/* We use aspect-square to ensure consistent mapping and use resizeMode="stretch" or "cover" 
          We'll use stretch so the coordinates align perfectly with the backend's relative values, 
          even if it slightly distorts. (Web allows varying aspect ratios but relative coords are used). */}
      <TouchableWithoutFeedback onPress={handlePress} disabled={disabled}>
        <View 
            className="w-full aspect-square bg-slate-200 dark:bg-slate-800 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 relative"
            onLayout={(e) => {
                setLayoutDims({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height });
            }}
        >
          <Image 
            source={{ uri: imageUrl }} 
            className="w-full h-full"
            style={{ resizeMode: 'stretch' }} // 'stretch' guarantees normalized X,Y from 0 to 1 match exactly
          />
          
          {/* User Pin */}
          {pin && (
            <View 
              style={[
                styles.pinContainer, 
                { left: pin.x * 100 + '%', top: pin.y * 100 + '%' }
              ]}
            >
              <View style={styles.pinInner} />
            </View>
          )}

          {/* Reveal correct hotspots after submit */}
          {disabled && hotspots.map((h: any, i: number) => (
             <View
                key={i}
                style={[
                    styles.hotspotReveal,
                    { left: h.x * 100 + '%', top: h.y * 100 + '%', width: (h.radius + 0.04) * 2 * 100 + '%', height: (h.radius + 0.04) * 2 * 100 + '%' }
                ]}
             />
          ))}
        </View>
      </TouchableWithoutFeedback>

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={!pin || disabled || isSubmitting}
        className={`w-full py-4 rounded-xl flex-row justify-center items-center mt-4 ${(!pin || disabled) ? 'bg-slate-300 dark:bg-slate-800' : 'bg-indigo-600'}`}
      >
        <Text className={`font-bold text-lg ${(!pin || disabled) ? 'text-slate-500 dark:text-slate-500' : 'text-white'}`}>
          Submit Location
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  pinContainer: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: 'white',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  pinInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
  hotspotReveal: {
      position: 'absolute',
      borderRadius: 9999,
      borderWidth: 2,
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.3)',
      transform: [{ translateX: '-50%' }, { translateY: '-50%' }]
  }
});
