import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSpring } from 'react-native-reanimated';
import { useTheme } from '../theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface VoiceButtonProps {
  onResult: (text: string) => void;
  onError?: (error: string) => void;
}

export function VoiceButton({ onResult, onError }: VoiceButtonProps) {
  const { theme } = useTheme();
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const scale = useSharedValue(1);
  const pulse = useSharedValue(1);

  // Check Web Speech API support (for web preview)
  useEffect(() => {
    if (Platform.OS === 'web') {
      setSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
    } else {
      // On native, assume supported (expo-speech-recognition handles this)
      setSupported(true);
    }
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: listening ? 0.6 : 0,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const startListening = async () => {
    if (Platform.OS === 'web') {
      startWebSpeech();
      return;
    }
    // Native: use expo-speech-recognition (dynamic import to avoid web crash)
    try {
      // @ts-ignore — expo-speech-recognition is native-only, not installed for web
      const ExpoSpeech = await import('expo-speech-recognition').catch(() => null);
      if (!ExpoSpeech) { onError?.('Speech recognition not available'); return; }
      // Native implementation would go here
      onError?.('Native speech recognition requires device build');
    } catch {
      onError?.('Speech recognition failed');
    }
  };

  const startWebSpeech = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) { onError?.('Browser không hỗ trợ'); return; }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListening(true);
      pulse.value = withRepeat(withTiming(1.4, { duration: 600 }), -1, true);
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };
    recognition.onerror = (event: any) => {
      onError?.(event.error === 'no-speech' ? 'Không nghe thấy gì' : `Lỗi: ${event.error}`);
    };
    recognition.onend = () => {
      setListening(false);
      pulse.value = withSpring(1);
    };

    recognition.start();
  };

  if (!supported) return null;

  return (
    <>
      {/* Pulse ring */}
      {listening && (
        <Animated.View style={[styles.pulse, { backgroundColor: theme.colors.primary, borderRadius: 999 }, pulseStyle]} />
      )}
      <AnimatedTouchable
        onPress={listening ? undefined : startListening}
        onPressIn={() => { scale.value = withSpring(0.9); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        activeOpacity={0.7}
        style={[
          styles.button,
          {
            backgroundColor: listening ? theme.colors.danger : theme.colors.primary,
            borderRadius: theme.radius.full,
          },
          buttonStyle,
        ]}
      >
        <Text style={styles.icon}>{listening ? '⏹' : '🎤'}</Text>
      </AnimatedTouchable>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 20 },
  pulse: {
    position: 'absolute',
    width: 44,
    height: 44,
    right: 0,
  },
});
