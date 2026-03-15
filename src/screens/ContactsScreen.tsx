import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../theme';
import { useShortcutStore, type Shortcut } from '../store/contactStore';
import { Button } from '../components';

export default function ContactsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const shortcuts = useShortcutStore((s) => s.shortcuts);
  const addShortcut = useShortcutStore((s) => s.addShortcut);
  const removeShortcut = useShortcutStore((s) => s.removeShortcut);
  const updateShortcut = useShortcutStore((s) => s.updateShortcut);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');

  const resetForm = () => { setKey(''); setValue(''); setEditingId(null); setShowForm(false); };

  const handleSave = () => {
    if (!key.trim() || !value.trim()) {
      Platform.OS === 'web' ? alert('Nhập đủ tên và giá trị') : Alert.alert('Thiếu', 'Nhập đủ tên và giá trị');
      return;
    }
    if (editingId) {
      updateShortcut(editingId, { key: key.trim(), value: value.trim() });
    } else {
      addShortcut(key.trim(), value.trim());
    }
    resetForm();
  };

  const handleEdit = (s: Shortcut) => { setKey(s.key); setValue(s.value); setEditingId(s.id); setShowForm(true); };

  const handleDelete = (id: string, name: string) => {
    Platform.OS === 'web'
      ? confirm(`Xóa "${name}"?`) && removeShortcut(id)
      : Alert.alert('Xóa', `Xóa "${name}"?`, [{ text: 'Hủy' }, { text: 'Xóa', style: 'destructive', onPress: () => removeShortcut(id) }]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingTop: insets.top + 16 }}
    >
      <View style={styles.header}>
        <Text style={[theme.typography.h2, { color: theme.colors.text }]}>📇 Từ điển cá nhân</Text>
        <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary, marginTop: 4 }]}>
          Định nghĩa từ khóa để app hiểu ý bạn
        </Text>
      </View>

      {!showForm && (
        <Pressable
          onPress={() => setShowForm(true)}
          style={[styles.addBtn, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md }]}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>＋ Thêm định nghĩa</Text>
        </Pressable>
      )}

      {showForm && (
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[styles.form, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg }, theme.shadows.sm]}
        >
          <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary, marginBottom: 4 }]}>
            Từ khóa
          </Text>
          <TextInput
            value={key}
            onChangeText={setKey}
            placeholder="Ví dụ: con trai, dép lào, yêu từ bé..."
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.input, { backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.text, borderRadius: theme.radius.sm }]}
          />

          <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary, marginBottom: 4, marginTop: 14 }]}>
            Nghĩa là
          </Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="Ví dụ: 0912345567, zalo, youtube..."
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.input, { backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.text, borderRadius: theme.radius.sm }]}
          />

          <View style={styles.formActions}>
            <Button title="Hủy" variant="secondary" size="sm" onPress={resetForm} />
            <Button title={editingId ? "Cập nhật" : "Lưu"} variant="primary" size="sm" onPress={handleSave} />
          </View>
        </Animated.View>
      )}

      {shortcuts.length === 0 && !showForm && (
        <View style={styles.empty}>
          <Text style={{ fontSize: 48 }}>📝</Text>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 8, textAlign: 'center' }]}>
            Chưa có định nghĩa nào{'\n'}Ví dụ: "dép lào" = "zalo"
          </Text>
        </View>
      )}

      {shortcuts.map((s, index) => (
        <Animated.View
          key={s.id}
          entering={FadeInDown.delay(index * 50).duration(300)}
          style={[styles.card, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg }, theme.shadows.sm]}
        >
          <View style={styles.cardContent}>
            <View style={{ flex: 1 }}>
              <Text style={[theme.typography.body, { color: theme.colors.text, fontWeight: '700' }]}>
                {s.key}
              </Text>
              <Text style={[theme.typography.bodySmall, { color: theme.colors.primary, marginTop: 2 }]}>
                = {s.value}
              </Text>
            </View>
            <View style={styles.cardActions}>
              <Pressable onPress={() => handleEdit(s)} style={styles.iconBtn}>
                <Text style={{ fontSize: 16 }}>✏️</Text>
              </Pressable>
              <Pressable onPress={() => handleDelete(s.id, s.key)} style={styles.iconBtn}>
                <Text style={{ fontSize: 16 }}>🗑️</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { marginBottom: 16 },
  addBtn: { paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  form: { padding: 20, marginBottom: 16 },
  input: { paddingHorizontal: 14, paddingVertical: 10, fontSize: 16 },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
  empty: { alignItems: 'center', marginTop: 60 },
  card: { padding: 16, marginBottom: 10 },
  cardContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 6 },
});
