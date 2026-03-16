import React, { useState, useCallback, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform, Alert } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSpring } from 'react-native-reanimated';
import { useTheme } from '../theme';

// Native imports (tree-shaken on web)
let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: any = null;

if (Platform.OS !== 'web') {
  try {
    const mod = require('expo-speech-recognition');
    ExpoSpeechRecognitionModule = mod.ExpoSpeechRecognitionModule;
    useSpeechRecognitionEvent = mod.useSpeechRecognitionEvent;
  } catch {
    // Not available — will fall back gracefully
  }
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface VoiceButtonProps {
  onResult: (text: string) => void;
  onError?: (error: string) => void;
  autoStart?: boolean;
}

// ===== Native Voice Button (Android/iOS) =====
function NativeVoiceButton({ onResult, onError, autoStart }: VoiceButtonProps) {
  const { theme } = useTheme();
  const [listening, setListening] = useState(false);
  const scale = useSharedValue(1);
  const pulse = useSharedValue(1);

  // Register native event listeners via hooks
  useSpeechRecognitionEvent('start', () => {
    setListening(true);
    pulse.value = withRepeat(withTiming(1.4, { duration: 600 }), -1, true);
  });

  useSpeechRecognitionEvent('end', () => {
    setListening(false);
    pulse.value = withSpring(1);
  });

  useSpeechRecognitionEvent('result', (event: any) => {
    const transcript = event.results?.[0]?.transcript ?? '';
    if (transcript) {
      onResult(transcript);
    }
  });

  useSpeechRecognitionEvent('error', (event: any) => {
    const errorMsg = event.error === 'no-speech'
      ? 'Không nghe thấy gì, thử lại nhé'
      : event.error === 'not-allowed'
        ? 'Chưa cấp quyền microphone'
        : `Lỗi nhận diện: ${event.error}`;
    onError?.(errorMsg);
  });

  const handlePress = useCallback(async () => {
    if (listening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    try {
      // Request permissions
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        Alert.alert(
          'Cần cấp quyền',
          'Vui lòng cấp quyền microphone và nhận diện giọng nói để sử dụng tính năng này.',
          [{ text: 'OK' }],
        );
        return;
      }

      // Start speech recognition
      ExpoSpeechRecognitionModule.start({
        lang: 'vi-VN',
        interimResults: false,
        continuous: false,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      onError?.(`Không thể bắt đầu nhận diện: ${msg}`);
    }
  }, [listening, onError]);

  // Auto-start speech recognition when autoStart prop is true
  useEffect(() => {
    if (autoStart && !listening) {
      const timer = setTimeout(() => handlePress(), 500);
      return () => clearTimeout(timer);
    }
  }, [autoStart]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: listening ? 0.6 : 0,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <>
      {listening && (
        <Animated.View style={[styles.pulse, { backgroundColor: theme.colors.primary, borderRadius: 999 }, pulseStyle]} />
      )}
      <AnimatedTouchable
        onPress={handlePress}
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

// ===== Web Voice Button (Browser) =====
function WebVoiceButton({ onResult, onError }: VoiceButtonProps) {
  const { theme } = useTheme();
  const [listening, setListening] = useState(false);
  const scale = useSharedValue(1);
  const pulse = useSharedValue(1);

  const supported = typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  const handlePress = useCallback(() => {
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
  }, [onResult, onError]);

  if (!supported) return null;

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: listening ? 0.6 : 0,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <>
      {listening && (
        <Animated.View style={[styles.pulse, { backgroundColor: theme.colors.primary, borderRadius: 999 }, pulseStyle]} />
      )}
      <AnimatedTouchable
        onPress={listening ? undefined : handlePress}
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

// ===== Fallback — module not installed =====
function FallbackVoiceButton({ onError }: VoiceButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    Alert.alert(
      'Chưa cài đặt',
      'Tính năng nhận diện giọng nói cần cài thêm expo-speech-recognition. Vui lòng chạy:\nnpx expo install expo-speech-recognition',
      [{ text: 'OK' }],
    );
    onError?.('Chưa cài expo-speech-recognition');
  }, [onError]);

  return (
    <AnimatedTouchable
      onPress={handlePress}
      onPressIn={() => { scale.value = withSpring(0.9); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      activeOpacity={0.7}
      style={[
        styles.button,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.full,
        },
        buttonStyle,
      ]}
    >
      <Text style={styles.icon}>🎤</Text>
    </AnimatedTouchable>
  );
}

// ===== Main Export =====
export function VoiceButton(props: VoiceButtonProps) {
  if (Platform.OS !== 'web' && ExpoSpeechRecognitionModule && useSpeechRecognitionEvent) {
    return <NativeVoiceButton {...props} />;
  }
  if (Platform.OS === 'web') {
    return <WebVoiceButton {...props} />;
  }
  // Native but module not available — show fallback
  return <FallbackVoiceButton {...props} />;
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
