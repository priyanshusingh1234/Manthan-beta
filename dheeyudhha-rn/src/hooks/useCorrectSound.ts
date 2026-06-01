import { useEffect, useState } from 'react';
import { Audio } from 'expo-av';

export function useCorrectSound() {
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const play = async () => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/right.mp3')
      );
      setSound(newSound);
      await newSound.playAsync();
    } catch (e) {
      console.warn('[useCorrectSound] play error:', e);
    }
  };

  return play;
}
