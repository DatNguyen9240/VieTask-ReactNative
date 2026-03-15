import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../theme';
import { Button, Input, TaskCard, VoiceButton } from '../components';
import { parseText, type ParsedTask } from '../services/api';
import { useTaskStore } from '../store/taskStore';
import { useShortcutStore } from '../store/contactStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

export function AddTaskScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const addTasks = useTaskStore((s) => s.addTasks);
  const getShortcutsMap = useShortcutStore((s) => s.getShortcutsMap);

  const prefillTime = (route.params as any)?.prefillTime as string | undefined;

  const [text, setText] = useState(prefillTime ? `${prefillTime.split(' ')[1]} ` : '');
  const [loading, setLoading] = useState(false);
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[] | null>(null);
  const [error, setError] = useState('');

  const handleParse = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setParsedTasks(null);

    try {
      const result = await parseText(text.trim(), 'Asia/Ho_Chi_Minh', getShortcutsMap());
      if (result.tasks?.length) {
        setParsedTasks(result.tasks);
      } else {
        setError(result.error || 'Không thể phân tích câu này');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!parsedTasks) return;
    await addTasks(parsedTasks);
    navigation.goBack();
  };

  const examples = [
    '8 giờ sáng báo thức',
    'Nhắc tôi uống thuốc lúc 7 rưỡi',
    'Sáng mai 6h báo thức rồi 8h họp team',
    '3 giờ chiều gọi cho khách hàng',
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Input Area */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={[theme.typography.h2, { color: theme.colors.text, marginBottom: 8 }]}>
            Thêm việc mới
          </Text>
          <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary, marginBottom: 20 }]}>
            Nhập hoặc nói bằng tiếng Việt, AI sẽ tự hiểu
          </Text>

          <Input
            value={text}
            onChangeText={setText}
            placeholder="Ví dụ: 8 giờ sáng báo thức..."
            multiline
            autoFocus
            rightIcon={
              <VoiceButton
                onResult={(transcript) => setText(prev => prev ? prev + ' ' + transcript : transcript)}
                onError={(err) => setError(err)}
              />
            }
          />

          <View style={styles.buttonRow}>
            <Button
              title="Phân tích"
              onPress={handleParse}
              loading={loading}
              disabled={!text.trim()}
              style={{ flex: 1 }}
            />
          </View>
        </Animated.View>

        {/* Examples */}
        {!parsedTasks && !error && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.examples}>
            <Text style={[theme.typography.label, { color: theme.colors.textTertiary, marginBottom: 8 }]}>
              GỢI Ý
            </Text>
            {examples.map((ex) => (
              <Button
                key={ex}
                title={ex}
                onPress={() => setText(ex)}
                variant="ghost"
                size="sm"
                style={{ alignSelf: 'flex-start', marginBottom: 6 }}
              />
            ))}
          </Animated.View>
        )}

        {/* Error */}
        {error ? (
          <Animated.View
            entering={FadeInUp.duration(300)}
            style={[styles.errorBox, { backgroundColor: theme.colors.dangerLight, borderRadius: theme.radius.md }]}
          >
            <Text style={[theme.typography.bodySmall, { color: theme.colors.danger }]}>{"❌ " + error}</Text>
          </Animated.View>
        ) : null}

        {/* Parsed Results */}
        {parsedTasks && (
          <Animated.View entering={FadeInUp.duration(400)}>
            <Text style={[theme.typography.label, { color: theme.colors.textTertiary, marginBottom: 12, marginTop: 24 }]}>
              KẾT QUẢ PHÂN TÍCH
            </Text>
            {parsedTasks.map((task, i) => (
              <TaskCard
                key={`${task.title}-${i}`}
                title={task.title}
                time={task.datetime_local}
                action={task.action}
                actionLabel={task.action_label}
                actionIcon={task.action_icon}
                clarifyQuestion={task.clarifying_question}
                index={i}
              />
            ))}
            <View style={styles.buttonRow}>
              <Button title="Thử lại" variant="secondary" onPress={() => setParsedTasks(null)} style={{ flex: 1 }} />
              <View style={{ width: 12 }} />
              <Button title={"Xác nhận \u2713"} onPress={handleConfirm} style={{ flex: 1 }} />
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 16 },
  buttonRow: { flexDirection: 'row', marginTop: 16 },
  examples: { marginTop: 28 },
  errorBox: { padding: 16, marginTop: 16 },
});
