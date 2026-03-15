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
