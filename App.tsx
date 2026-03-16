import React, { useCallback, useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useTheme } from './src/theme';
import { AppNavigator } from './src/navigation/AppNavigator';
import { navigationRef } from './src/navigation/AppNavigator';
import { TaskReminderModal } from './src/components';
import { requestPermissions, setupNotifications, addNotificationResponseListener } from './src/services/notifications';
import { useTaskStore } from './src/store/taskStore';
import { executeTaskAction } from './src/services/taskActions';
import { startWakeWordListening, stopWakeWordListening } from './src/services/wakeWord';

// Configure notification handler before any component renders
setupNotifications();

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { theme } = useTheme();
  const completeTask = useTaskStore((s) => s.completeTask);
  const markReminded = useTaskStore((s) => s.markReminded);

  useEffect(() => {
    // Request notification permissions on startup (native only)
    if (Platform.OS !== 'web') {
      requestPermissions().then(granted => {
        console.log('[Notifications] Permission:', granted ? 'granted' : 'denied');
      });
    }

    // Listen for notification action button taps
    const cleanup = addNotificationResponseListener(
      async (taskId) => {
        const task = useTaskStore.getState().tasks.find(t => t.id === taskId);
        completeTask(taskId);
        console.log('[Notifications] Completed:', taskId, 'task:', task?.title, task?.action);
        if (task) {
          const timeParts = task.datetime_local.match(/(\d{2}):(\d{2})$/);
          const hour = timeParts ? Number(timeParts[1]) : undefined;
          const minute = timeParts ? Number(timeParts[2]) : undefined;
          try {
            const result = await executeTaskAction({
              action: task.action,
              title: task.title,
              app_name: task.app_name,
              action_url: task.action_url,
              android_package: task.android_package,
              hour,
              minute,
            });
            console.log('[Notifications] Action result:', result);
          } catch (e) {
            console.error('[Notifications] Action error:', e);
          }
        }
      },
      (taskId) => { markReminded(taskId); console.log('[Notifications] Dismissed:', taskId); },
    );

    // Warm up Railway server (free tier sleeps after inactivity, cold start takes 30-60s)
    const warmUp = async () => {
      for (let i = 0; i < 3; i++) {
        try {
          console.log(`[API] Attempting health check... (attempt ${i + 1}/3)`);
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 60_000);
          const res = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL || 'https://vietask-production.up.railway.app'}/health`,
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

    // Start wake word listening ("Hey Jarvis")
    if (Platform.OS !== 'web') {
      const armWakeWord = () => {
        startWakeWordListening(() => {
          if (navigationRef.isReady()) {
            (navigationRef as any).navigate('AddTask', { voiceAutoStart: true });
          }
          // Re-arm after 30s (user finishes adding task)
          setTimeout(armWakeWord, 30_000);
        });
      };
      armWakeWord();
    }

    return () => {
      cleanup();
      stopWakeWordListening();
    };
  }, [completeTask, markReminded]);

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
