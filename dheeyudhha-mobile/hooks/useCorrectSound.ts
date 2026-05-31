import { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';

export function useCorrectSound() {
  const play = useCallback(async () => {
    // Sound functionality temporarily disabled during migration
    // Will be replaced with expo-av natively
  }, []);

  return play;
}