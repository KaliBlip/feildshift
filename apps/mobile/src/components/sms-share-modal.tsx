import * as Clipboard from 'expo-clipboard';
import { Check, Copy, MessageSquareShare, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Modal, Pressable, Share, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface SmsShareModalProps {
  visible: boolean;
  strategyName: string;
  message: string;
  onClose: () => void;
}

/**
 * Low-bandwidth EN + Ashanti Twi SMS/WhatsApp summary card preview modal
 * using expo-clipboard and React Native Share without Reanimated 4 conflicts.
 */
export function SmsShareModal({
  visible,
  strategyName,
  message,
  onClose,
}: SmsShareModalProps) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
  }, [message, visible]);

  const charCount = message.length;
  const segments = Math.max(1, Math.ceil(charCount / 160));

  const handleCopy = async () => {
    await Clipboard.setStringAsync(message);
    setCopied(true);
  };

  const handleNativeShare = async () => {
    try {
      await Share.share({ message });
    } catch {
      // User dismissed share sheet cleanly
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            CardShadow,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}>
          <View style={styles.headerRow}>
            <View style={styles.flexOne}>
              <ThemedText type="sectionTitle">
                Farmer SMS / WhatsApp Card
              </ThemedText>
              <ThemedText type="small" themeColor="textMuted">
                {strategyName} · Bilingual EN + Twi
              </ThemedText>
            </View>
            <Pressable
              accessibilityLabel="Close share sheet"
              onPress={onClose}
              style={[
                styles.closeBtn,
                { backgroundColor: theme.backgroundElement },
              ]}>
              <X size={18} color={theme.text} />
            </Pressable>
          </View>

          <View
            style={[
              styles.messageBubble,
              {
                backgroundColor: theme.primarySoft,
                borderColor: theme.primary,
              },
            ]}>
            <ThemedText type="small" style={{ color: theme.text }}>
              {message}
            </ThemedText>
          </View>

          <View style={styles.metaRow}>
            <ThemedText type="code" themeColor="textSecondary">
              {charCount}/320 chars · {segments} SMS {segments === 1 ? 'part' : 'parts'}
            </ThemedText>
            <ThemedText type="code" style={{ color: theme.primaryText }}>
              2G-ready format
            </ThemedText>
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => void handleCopy()}
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: theme.backgroundElement },
                pressed && styles.pressed,
              ]}>
              {copied ? (
                <Check size={16} color={theme.primaryText} />
              ) : (
                <Copy size={16} color={theme.text} />
              )}
              <ThemedText
                type="smallBold"
                style={{ color: copied ? theme.primaryText : theme.text }}>
                {copied ? 'Copied!' : 'Copy Text'}
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => void handleNativeShare()}
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: theme.primary },
                pressed && styles.pressed,
              ]}>
              <MessageSquareShare size={16} color="#FFFFFF" />
              <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                Share via App
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 18, 16, 0.45)',
    justifyContent: 'flex-end',
    padding: Spacing.three,
  },
  sheet: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.four,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flexOne: { flex: 1 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    borderRadius: Radii.md,
    borderWidth: 1,
    padding: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radii.md,
  },
  pressed: { opacity: 0.78 },
});
