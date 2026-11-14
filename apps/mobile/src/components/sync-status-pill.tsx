import { RefreshCw, Wifi, WifiOff } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii } from '@/constants/theme';
import { usePilotState } from '@/hooks/use-pilot-state';
import { useTheme } from '@/hooks/use-theme';

/**
 * Compact header status bar surfacing network state, data origin, pending offline queue,
 * and one-tap Supabase refresh / queue flush.
 */
export function SyncStatusPill() {
  const theme = useTheme();
  const {
    dataSourceMode,
    isConnected,
    isSyncing,
    queuedLogsCount,
    lastSyncedAt,
    refreshLivePilotData,
  } = usePilotState();

  const sourceLabel =
    dataSourceMode === 'supabase'
      ? 'Live Supabase'
      : dataSourceMode === 'cached'
        ? 'Cached Cell'
        : 'Ashanti Fixture';

  const statusToneBg = isConnected ? theme.primarySoft : theme.amberSoft;
  const statusToneFg = isConnected ? theme.primaryText : theme.amber;
  const timeShort = lastSyncedAt ? lastSyncedAt.slice(11, 16) : null;

  return (
    <Pressable
      accessibilityLabel="Refresh satellite data and flush offline queue"
      onPress={() => void refreshLivePilotData()}
      style={({ pressed }) => [
        styles.bar,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.dotBadge, { backgroundColor: statusToneBg }]}>
        {isConnected ? (
          <Wifi size={13} color={statusToneFg} />
        ) : (
          <WifiOff size={13} color={statusToneFg} />
        )}
        <ThemedText type="code" style={{ color: statusToneFg }}>
          {isConnected ? 'Online' : 'Offline'}
        </ThemedText>
      </View>

      <ThemedText type="small" themeColor="textSecondary" style={styles.flexOne} numberOfLines={1}>
        {sourceLabel}
        {timeShort ? ` · ${timeShort} UTC` : ''}
        {queuedLogsCount > 0 ? ` · ${queuedLogsCount} queued` : ''}
      </ThemedText>

      <View style={[styles.syncBtn, { backgroundColor: theme.backgroundElement }]}>
        <RefreshCw size={13} color={theme.textSecondary} />
        <ThemedText type="code" themeColor="textSecondary">
          {isSyncing ? 'Syncing' : 'Sync'}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  dotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  flexOne: { flex: 1 },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  pressed: { opacity: 0.75 },
});
