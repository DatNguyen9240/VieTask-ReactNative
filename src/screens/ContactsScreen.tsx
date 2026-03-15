import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../theme';
import { useContactStore, type Contact } from '../store/contactStore';
import { Button } from '../components';

export default function ContactsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const contacts = useContactStore((s) => s.contacts);
  const addContact = useContactStore((s) => s.addContact);
  const removeContact = useContactStore((s) => s.removeContact);
  const updateContact = useContactStore((s) => s.updateContact);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');

  const resetForm = () => {
    setName('');
    setPhone('');
    setNote('');
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = () => {
    if (!name.trim() || !phone.trim()) {
      if (Platform.OS === 'web') {
        alert('Vui lòng nhập tên và số điện thoại');
      } else {
        Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên và số điện thoại');
      }
      return;
    }

    if (editingId) {
      updateContact(editingId, { name: name.trim(), phone: phone.trim(), note: note.trim() || undefined });
    } else {
      addContact(name.trim(), phone.trim(), note.trim() || undefined);
    }
    resetForm();
  };

  const handleEdit = (contact: Contact) => {
    setName(contact.name);
    setPhone(contact.phone);
    setNote(contact.note ?? '');
    setEditingId(contact.id);
    setShowForm(true);
  };

  const handleDelete = (id: string, contactName: string) => {
    if (Platform.OS === 'web') {
      if (confirm(`Xóa "${contactName}"?`)) removeContact(id);
    } else {
      Alert.alert('Xóa', `Xóa "${contactName}"?`, [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: () => removeContact(id) },
      ]);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingTop: 16 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[theme.typography.h2, { color: theme.colors.text }]}>📇 Danh bạ cá nhân</Text>
        <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary, marginTop: 4 }]}>
          Lưu tên → SĐT để app hiểu "nhắn con trai", "gọi vợ"...
        </Text>
      </View>

      {/* Add button */}
      {!showForm && (
        <Pressable
          onPress={() => setShowForm(true)}
          style={[styles.addBtn, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md }]}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>＋ Thêm liên hệ</Text>
        </Pressable>
      )}

      {/* Add/Edit form */}
      {showForm && (
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[styles.form, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg }, theme.shadows.sm]}
        >
          <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary, marginBottom: 4 }]}>
            Tên gọi (ví dụ: con trai, vợ, sếp)
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="con trai"
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.input, { backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.text, borderRadius: theme.radius.sm }]}
          />

          <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary, marginBottom: 4, marginTop: 12 }]}>
            Số điện thoại
          </Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="0901234567"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="phone-pad"
            style={[styles.input, { backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.text, borderRadius: theme.radius.sm }]}
          />

          <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary, marginBottom: 4, marginTop: 12 }]}>
            Ghi chú (tùy chọn)
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Con trai lớn"
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.input, { backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.text, borderRadius: theme.radius.sm }]}
          />

          <View style={styles.formActions}>
            <Button title="Hủy" variant="secondary" size="sm" onPress={resetForm} />
            <Button title={editingId ? "Cập nhật" : "Lưu"} variant="primary" size="sm" onPress={handleSave} />
          </View>
        </Animated.View>
      )}

      {/* Contact list */}
      {contacts.length === 0 && !showForm && (
        <View style={styles.empty}>
          <Text style={{ fontSize: 48 }}>📱</Text>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 8, textAlign: 'center' }]}>
            Chưa có liên hệ nào{'\n'}Thêm để app hiểu "nhắn con trai" → đúng SĐT
          </Text>
        </View>
      )}

      {contacts.map((contact, index) => (
        <Animated.View
          key={contact.id}
          entering={FadeInDown.delay(index * 50).duration(300)}
          style={[styles.card, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg }, theme.shadows.sm]}
        >
          <View style={styles.cardContent}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primaryLight, borderRadius: theme.radius.md }]}>
              <Text style={{ fontSize: 20 }}>👤</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[theme.typography.body, { color: theme.colors.text, fontWeight: '600' }]}>
                {contact.name}
              </Text>
              <Text style={[theme.typography.bodySmall, { color: theme.colors.primary }]}>
                📞 {contact.phone}
              </Text>
              {contact.note ? (
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 2 }]}>
                  {contact.note}
                </Text>
              ) : null}
            </View>
            <View style={styles.cardActions}>
              <Pressable onPress={() => handleEdit(contact)} style={styles.iconBtn}>
                <Text style={{ fontSize: 16 }}>✏️</Text>
              </Pressable>
              <Pressable onPress={() => handleDelete(contact.id, contact.name)} style={styles.iconBtn}>
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
  avatar: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  cardActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 6 },
});
