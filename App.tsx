import React, { useCallback, useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useTheme } from './src/theme';
import { AppNavigator } from './src/navigation/AppNavigator';
import { TaskReminderModal } from './src/components';
import { requestPermissions } from './src/services/notifications';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { theme } = useTheme();

  useEffect(() => {
    // Request notification permissions on startup (native only)
    if (Platform.OS !== 'web') {
      requestPermissions().then(granted => {
        console.log('[Notifications] Permission:', granted ? 'granted' : 'denied');
      });
    }
    // Warm up Railway server (free tier sleeps after inactivity, cold start takes 30-60s)
    const warmUp = async () => {
      for (let i = 0; i < 3; i++) {
        try {
          const res = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL ?? 'https://vietask-production.up.railway.app'}/health`,
            { signal: AbortSignal.timeout(60_000) }
          );
          if (res.ok) {
            console.log('[API] Server ready ✓');
            return;
          }
        } catch { /* ignore, retry */ }
        console.log(`[API] Server waking up... (attempt ${i + 1}/3)`);
        await new Promise(r => setTimeout(r, 10_000));
      }
    };
    warmUp();
  }, []);

  return (
    <>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.background} />
      <AppNavigator />
      <TaskReminderModal />
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (fontsLoaded) {
      onLayoutRootView();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
