import { Wifi, WifiOff } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { PlannerIcon } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { roofiRadii, roofiSpacing } from '@/constants/theme';
import { usePilotState } from '@/hooks/use-pilot-state';
import { useTheme } from '@/hooks/use-theme';
import { toast } from '@/lib/toast';

/**
 * Compact header status bar surfacing network state, data origin, pending offline queue,
 * and one-tap Supabase refresh / queue flush, styled with Autis Planner pill tokens.
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
        : 'Ashanti Bundle';

  const statusToneBg = isConnected ? theme.sage.surface : theme.gold.surface;
  const statusToneFg = isConnected ? theme.sage.ink : theme.gold.ink;
  const timeShort = lastSyncedAt ? lastSyncedAt.slice(11, 16) : null;

  const handleSyncPress = async () => {
    await refreshLivePilotData();
    if (!isConnected) {
      toast.warning(
        'Offline mode',
        'Showing cached Ashanti pilot data until connection returns.',
      );
    } else {
      toast.success(
        'Telemetry synced',
        'Refreshed 30 m HLS, 30 m iSDAsoil, and queued field logs.',
      );
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Refresh satellite data and flush offline queue"
      onPress={() => void handleSyncPress()}
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
          {isConnected ? 'ONLINE' : 'OFFLINE'}
        </ThemedText>
      </View>

      <ThemedText
        type="small"
        themeColor="secondary"
        style={styles.flexOne}
        numberOfLines={1}>
        {sourceLabel}
        {timeShort ? ` · ${timeShort} UTC` : ''}
        {queuedLogsCount > 0 ? ` · ${queuedLogsCount} queued` : ''}
      </ThemedText>

      <View
        style={[
          styles.syncBtn,
          { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
        ]}>
        <PlannerIcon name="repeat" size={13} color={theme.foreground} />
        <ThemedText type="code" themeColor="foreground">
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
    gap: roofiSpacing[2],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: roofiRadii.pill,
    borderWidth: 1,
  },
  dotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: roofiRadii.pill,
  },
  flexOne: { flex: 1 },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: roofiRadii.pill,
    borderWidth: 1,
  },
  pressed: { opacity: 0.75 },
});
