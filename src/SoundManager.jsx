// src/components/SoundManager.jsx
import { useRef } from "react";

/**
 * Minimal sound helper. Place audio files in public/sounds/
 * - key.wav
 * - error.wav
 * - win.wav
 *
 * Usage:
 * import { useSoundPlayer } from './components/SoundManager'
 * const sound = useSoundPlayer();
 * sound.playKey();
 */

export function useSoundPlayer() {
  const keyRef = useRef(null);
  const errRef = useRef(null);
  const winRef = useRef(null);

  if (!keyRef.current) {
    keyRef.current = new Audio("/sounds/key.wav");
    errRef.current = new Audio("/sounds/error.wav");
    winRef.current = new Audio("/sounds/win.wav");
    // preload
    keyRef.current.preload = "auto";
    errRef.current.preload = "auto";
    winRef.current.preload = "auto";
  }

  function play(soundEl, volume = 0.6) {
    try {
      soundEl.volume = volume;
      // clone node to allow overlapping quick sounds
      const clone = soundEl.cloneNode();
      clone.play().catch(() => {});
    } catch (e) {
      // ignore autoplay issues on first user gesture
    }
  }

  return {
    playKey: (v) => play(keyRef.current, v ?? 0.3),
    playError: (v) => play(errRef.current, v ?? 0.6),
    playWin: (v) => play(winRef.current, v ?? 0.7),
  };
}

