/**
 * Wake Word Service — listens for "Hey Jarvis" trigger phrase.
 *
 * Uses expo-speech-recognition in continuous loop mode.
 * When the wake word is detected, calls the onWakeWord callback.
 * Auto-restarts when speech recognition ends (timeout).
 *
 * ⚠️ Only works on development builds (not Expo Go).
 */

import { Platform } from 'react-native';

let ExpoSpeechRecognitionModule: any = null;

if (Platform.OS !== 'web') {
  try {
    const mod = require('expo-speech-recognition');
    ExpoSpeechRecognitionModule = mod.ExpoSpeechRecognitionModule;
  } catch {
    // Not available
  }
}

// Wake word variations (Vietnamese speakers may pronounce differently)
const WAKE_WORDS = [
  'hey jarvis',
  'hê jarvis',
  'hey gia vis',
  'hey jar vis',
  'hei jarvis',
  'hey javis',
  'hê javis',
  'hey giá vít',
  'a jarvis',
  'ê jarvis',
];

type WakeWordCallback = () => void;

let _listening = false;
let _onWakeWord: WakeWordCallback | null = null;
let _restartTimer: ReturnType<typeof setTimeout> | null = null;
let _subscription: any = null;

function containsWakeWord(transcript: string): boolean {
  const lower = transcript.toLowerCase().trim();
  return WAKE_WORDS.some(w => lower.includes(w));
}

/**
 * Start listening for the wake word.
 * @param onWakeWord - callback when wake word is detected
 */
export async function startWakeWordListening(onWakeWord: WakeWordCallback): Promise<boolean> {
  if (!ExpoSpeechRecognitionModule) {
    console.warn('[WakeWord] expo-speech-recognition not available');
    return false;
  }

  if (_listening) {
    console.log('[WakeWord] Already listening');
    return true;
  }

  _onWakeWord = onWakeWord;

  try {
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) {
      console.warn('[WakeWord] Microphone permission denied');
      return false;
    }
  } catch (e) {
    console.warn('[WakeWord] Permission error:', e);
    return false;
  }

  // Set up event listeners
  _setupListeners();
  _startRecognition();
  return true;
}

function _setupListeners() {
  if (_subscription) return; // already set up

  // Listen for results
  ExpoSpeechRecognitionModule.addListener('result', (event: any) => {
    const transcript = event.results?.[0]?.transcript ?? '';
    if (transcript) {
      console.log('[WakeWord] Heard:', transcript);
      if (containsWakeWord(transcript)) {
        console.log('[WakeWord] 🎯 WAKE WORD DETECTED!');
        // Stop listening temporarily, trigger callback
        stopWakeWordListening();
        _onWakeWord?.();
      }
    }
  });

  ExpoSpeechRecognitionModule.addListener('end', () => {
    console.log('[WakeWord] Session ended');
    // Auto-restart after a short delay (if still supposed to be listening)
    if (_listening) {
      _restartTimer = setTimeout(() => {
        console.log('[WakeWord] Auto-restarting...');
        _startRecognition();
      }, 500);
    }
  });

  ExpoSpeechRecognitionModule.addListener('error', (event: any) => {
    console.log('[WakeWord] Error:', event.error);
    // Restart on non-fatal errors
    if (_listening && event.error !== 'not-allowed') {
      _restartTimer = setTimeout(() => {
        _startRecognition();
      }, 2000);
    }
  });

  _subscription = true;
}

function _startRecognition() {
  try {
    _listening = true;
    ExpoSpeechRecognitionModule.start({
      lang: 'vi-VN',
      interimResults: true,
      continuous: true,
    });
    console.log('[WakeWord] 🎤 Listening for wake word...');
  } catch (e) {
    console.warn('[WakeWord] Start failed:', e);
    _listening = false;
  }
}

/**
 * Stop listening for the wake word.
 */
export function stopWakeWordListening() {
  _listening = false;
  if (_restartTimer) {
    clearTimeout(_restartTimer);
    _restartTimer = null;
  }
  try {
    ExpoSpeechRecognitionModule?.stop();
  } catch { /* ignore */ }
  console.log('[WakeWord] ⏹ Stopped listening');
}

/**
 * Check if currently listening for wake word.
 */
export function isWakeWordListening(): boolean {
  return _listening;
}
