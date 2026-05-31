import { View } from 'react-native';
import { Skull, Sword, Map as MapIcon } from 'lucide-react-native';

export default function RoughSketch({ type, width = 200, height = 200 }: { type: string, width?: number, height?: number }) {
  
  const renderIcon = () => {
    const size = Math.min(width, height) * 0.5;
    if (type === 'demon') return <Skull size={size} color="#ef4444" />;
    if (type === 'sword') return <Sword size={size} color="#94a3b8" />;
    if (type === 'map') return <MapIcon size={size} color="#92400e" />;
    return <Skull size={size} color="#64748b" />;
  };

  return (
    <View className="flex justify-center items-center my-6" style={{ width, height, backgroundColor: '#f8fafc', borderRadius: 16 }}>
      {renderIcon()}
    </View>
  );
}
