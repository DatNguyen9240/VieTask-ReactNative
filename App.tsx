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
          console.log(`[API] Attempting health check... (attempt ${i + 1}/3)`);
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 60_000);
          const res = await fetch(
            'https://vietask-production.up.railway.app/health',
            { signal: controller.signal }
          );
          clearTimeout(timer);
          console.log(`[API] Response status: ${res.status}`);
          if (res.ok) {
            const data = await res.text();
            console.log('[API] Server ready ✓', data);
            return;
          }
        } catch (err: any) {
          console.error(`[API] Health check failed:`, err?.message || err);
          console.error(`[API] Error name:`, err?.name);
          console.error(`[API] Error type:`, typeof err);
        }
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
