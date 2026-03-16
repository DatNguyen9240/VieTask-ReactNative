import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../theme';
import { Button, Input, TaskCard, VoiceButton } from '../components';
import { parseText, fetchSuggestions, type ParsedTask } from '../services/api';
import { useTaskStore } from '../store/taskStore';
import { useShortcutStore } from '../store/contactStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

const FALLBACK_EXAMPLES = [
  '8 giờ sáng báo thức',
  'Nhắc tôi uống thuốc lúc 7 rưỡi',
  'Sáng mai 6h báo thức rồi 8h họp team',
  '3 giờ chiều gọi cho khách hàng',
];

export function AddTaskScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const addTasks = useTaskStore((s) => s.addTasks);
  const getShortcutsMap = useShortcutStore((s) => s.getShortcutsMap);
  const scrollRef = useRef<ScrollView>(null);

  const prefillTime = (route.params as any)?.prefillTime as string | undefined;
  const voiceAutoStart = (route.params as any)?.voiceAutoStart as boolean | undefined;

  const [text, setText] = useState(prefillTime ? `${prefillTime.split(' ')[1]} ` : '');
  const [loading, setLoading] = useState(false);
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[] | null>(null);
  const [error, setError] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [originalText, setOriginalText] = useState('');
  const [examples, setExamples] = useState<string[]>(FALLBACK_EXAMPLES);

  // Fetch AI suggestions on mount
  useEffect(() => {
    fetchSuggestions().then(suggestions => {
      if (suggestions.length > 0) setExamples(suggestions);
    });
  }, []);

  // Whether we're in clarification mode (waiting for user reply)
  const needsClarification = parsedTasks?.some(t => t.need_clarification) ?? false;
  const clarifyQuestions = parsedTasks
    ?.filter(t => t.need_clarification && t.clarifying_question)
    .map(t => t.clarifying_question!) ?? [];

  // Auto-scroll to bottom when chat updates
  useEffect(() => {
    if (chatHistory.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    }
  }, [chatHistory.length, parsedTasks]);

  const handleParse = async (inputText?: string) => {
    const sendText = (inputText ?? text).trim();
    if (!sendText) return;
    setLoading(true);
    setError('');

    const isReply = chatHistory.length > 0;
    const fullText = isReply ? `${originalText}, ${sendText}` : sendText;

    setChatHistory(prev => [...prev, { role: 'user', text: sendText }]);
    if (!isReply) setOriginalText(sendText);
    setText('');

    try {
      const result = await parseText(fullText, 'Asia/Ho_Chi_Minh', getShortcutsMap());
      if (result.tasks?.length) {
        const hasClarify = result.tasks.some(t => t.need_clarification);
        setParsedTasks(result.tasks);

        if (hasClarify) {
          const questions = result.tasks
            .filter(t => t.need_clarification && t.clarifying_question)
            .map(t => t.clarifying_question!);
          if (questions.length > 0) {
            setChatHistory(prev => [...prev, { role: 'ai', text: questions.join('\n') }]);
          }
          setOriginalText(fullText);
        }
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
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Main' as never);
  };

  const handleReset = () => {
    setParsedTasks(null);
    setChatHistory([]);
    setOriginalText('');
    setText('');
    setError('');
  };

  // Final tasks ready for confirmation (no clarification needed)
  const tasksReady = parsedTasks && !needsClarification;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header — only show when no chat history */}
        {chatHistory.length === 0 && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={[theme.typography.h2, { color: theme.colors.text, marginBottom: 8 }]}>
              Thêm việc mới
            </Text>
            <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary, marginBottom: 20 }]}>
              Nhập hoặc nói bằng tiếng Việt, AI sẽ tự hiểu
            </Text>
          </Animated.View>
        )}

        {/* Chat History */}
        {chatHistory.map((msg, i) => (
          <Animated.View
            key={i}
            entering={FadeInUp.duration(300)}
            style={[
              styles.chatBubble,
              msg.role === 'user' ? styles.userBubble : styles.aiBubble,
              {
                backgroundColor: msg.role === 'user'
                  ? theme.colors.primary
                  : theme.colors.surface,
                borderRadius: theme.radius.lg,
              },
              msg.role === 'ai' && theme.shadows.sm,
            ]}
          >
            {msg.role === 'ai' && (
              <Text style={[theme.typography.caption, { color: theme.colors.primary, fontWeight: '600', marginBottom: 4 }]}>
                🤖 AI hỏi lại
              </Text>
            )}
            <Text style={[
              theme.typography.body,
              { color: msg.role === 'user' ? '#fff' : theme.colors.text },
            ]}>
              {msg.text}
            </Text>
          </Animated.View>
        ))}

        {/* Quick-reply suggestions from BE */}
        {needsClarification && (() => {
          const allSuggestions = parsedTasks
            ?.flatMap(t => t.suggestions ?? [])
            .filter((s, i, arr) => arr.indexOf(s) === i) ?? [];
          if (allSuggestions.length === 0) return null;
          return (
            <Animated.View entering={FadeInUp.delay(100).duration(300)} style={styles.suggestionsRow}>
              {allSuggestions.map((suggestion) => (
              <Pressable
                key={suggestion}
                onPress={() => handleParse(suggestion)}
                style={[
                  styles.suggestionChip,
                  {
                    backgroundColor: theme.colors.primaryLight,
                    borderRadius: theme.radius.full ?? 20,
                    borderColor: theme.colors.primary + '40',
                  },
                ]}
              >
                <Text style={[theme.typography.bodySmall, { color: theme.colors.primary, fontWeight: '600' }]}>
                  {suggestion}
                </Text>
              </Pressable>
              ))}
            </Animated.View>
          );
        })()}

        {/* Input Area */}
        <Animated.View entering={FadeInDown.duration(400)}>
          {!tasksReady && (
            <>
              <Input
                value={text}
                onChangeText={setText}
                placeholder={needsClarification ? 'Trả lời...' : 'Ví dụ: 8 giờ sáng báo thức...'}
                multiline
                autoFocus
                rightIcon={
                  <VoiceButton
                    autoStart={voiceAutoStart}
                    onResult={(transcript) => setText(prev => prev ? prev + ' ' + transcript : transcript)}
                    onError={(err) => setError(err)}
                  />
                }
              />

              <View style={styles.buttonRow}>
                {chatHistory.length > 0 && (
                  <>
                    <Button title="Làm lại" variant="secondary" onPress={handleReset} style={{ flex: 1 }} />
                    <View style={{ width: 12 }} />
                  </>
                )}
                <Button
                  title={needsClarification ? 'Gửi trả lời' : 'Phân tích'}
                  onPress={() => handleParse()}
                  loading={loading}
                  disabled={!text.trim()}
                  style={{ flex: 1 }}
                />
              </View>

              {/* Accept with clarification — user can still confirm despite questions */}
              {needsClarification && parsedTasks && (
                <Button
                  title="Chấp nhận kết quả hiện tại ✓"
                  variant="ghost"
                  size="sm"
                  onPress={handleConfirm}
                  style={{ alignSelf: 'center', marginTop: 12 }}
                />
              )}
            </>
          )}
        </Animated.View>

        {/* Examples — only when fresh start */}
        {chatHistory.length === 0 && !parsedTasks && !error && (
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

        {/* Final Results — all tasks confirmed, no clarification */}
        {tasksReady && (
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
              <Button title="Làm lại" variant="secondary" onPress={handleReset} style={{ flex: 1 }} />
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
  chatBubble: { padding: 14, marginBottom: 10, maxWidth: '85%' },
  userBubble: { alignSelf: 'flex-end' },
  aiBubble: { alignSelf: 'flex-start' },
  suggestionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  suggestionChip: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
});
