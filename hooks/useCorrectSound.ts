/**
 * useCorrectSound — plays right.mp3 when the user answers correctly.
 *
 * Strategy:
 *   • Android (Capacitor native): @capacitor-community/native-audio
 *     → preloads from the app bundle's assets folder for zero-latency playback
 *   • Web / iOS fallback: HTMLAudioElement
 *     → plays from /right.mp3 in the public folder
 *
 * Usage:
 *   const playCorrect = useCorrectSound();
 *   playCorrect();
 */

import { useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

const SOUND_ID = 'dheeyudhha_correct';
const ASSET_PATH = 'sounds/right.mp3'; // bundled directly into Android assets/sounds

let nativeReady = false;
let nativeAudioModule: any = null;

/** Lazily load NativeAudio only on native platforms */
async function getNativeAudio() {
  if (!Capacitor.isNativePlatform()) return null;
  if (nativeAudioModule) return nativeAudioModule;
  try {
    const mod = await import('@capacitor-community/native-audio');
    nativeAudioModule = mod.NativeAudio;
    return nativeAudioModule;
  } catch {
    return null;
  }
}

/** One-time preload (idempotent — safe to call multiple times) */
async function preloadNativeSound() {
  if (nativeReady) return;
  const NA = await getNativeAudio();
  if (!NA) return;
  try {
    await NA.preload({
      assetId: SOUND_ID,
      assetPath: ASSET_PATH,
      audioChannelNum: 1,
      isUrl: false,
    });
    nativeReady = true;
  } catch (e: any) {
    // Already loaded or unsupported — treat as ready
    if (e?.message?.includes('already')) nativeReady = true;
  }
}

export function useCorrectSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Preload as early as possible so first answer is instant
      preloadNativeSound();
    } else {
      // Web: create a pooled Audio element and preload
      const a = new Audio('/right.mp3');
      a.preload = 'auto';
      a.volume = 0.85;
      audioRef.current = a;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const play = useCallback(async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const NA = await getNativeAudio();
        if (!NA) return;

        if (!nativeReady) await preloadNativeSound();

        // Stop any previous playback first (idempotent)
        try { await NA.stop({ assetId: SOUND_ID }); } catch { /* ok */ }
        await NA.play({ assetId: SOUND_ID });
      } else {
        // Web fallback — clone so rapid replays work
        const a = audioRef.current;
        if (!a) return;
        const clone = a.cloneNode() as HTMLAudioElement;
        clone.volume = 0.85;
        clone.play().catch(() => { /* autoplay blocked — no-op */ });
      }
    } catch (e) {
      console.warn('[useCorrectSound] play error:', e);
    }
  }, []);

  return play;
}
