import { CloudRain, Sun } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { DekadWindowSummary } from '@/constants/pilot-data';
import { CardShadow, roofiRadii, roofiSpacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * 12 months x 3 dekads = 36-dekad visual vulnerability & bare-field heatmap.
 * Styled to match Autis Planner's MiniMonthCalendar card language.
 */
export function DekadHeatmapMatrix({
  windows,
}: {
  windows: DekadWindowSummary[];
}) {
  const theme = useTheme();
  const [selectedId, setSelectedId] = useState<string>(windows[0]?.id ?? 'jan');

  const selectedWindow =
    windows.find((w) => w.id === selectedId) ?? windows[0];

  return (
    <View
      style={[
        styles.card,
        CardShadow,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}>
      <View style={styles.headerRow}>
        <ThemedText type="sectionTitle">36-Dekad Exposure Matrix</ThemedText>
        <ThemedText type="code" themeColor="mutedText">
          12 MOS × 3 DEKADS
        </ThemedText>
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View
            style={[styles.swatch, { backgroundColor: theme.sage.edge }]}
          />
          <ThemedText type="code" themeColor="secondary">
            Cover OK
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.swatch, { backgroundColor: theme.primary }]}
          />
          <ThemedText type="code" themeColor="secondary">
            Bare risk
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.swatch, { backgroundColor: theme.pair.edge }]}
          />
          <ThemedText type="code" themeColor="secondary">
            Cloud QA gap
          </ThemedText>
        </View>
      </View>

      <View style={styles.gridRow}>
        {windows.map((win) => {
          const isSelected = win.id === selectedId;
          const isCloudGap = win.qaTier === 'low_cloud_gap';
          const cellBg = win.bareFieldRisk
            ? theme.personal.surface
            : win.ndviSmooth >= 0.55
              ? theme.sage.surface
              : theme.surfaceSubtle;
          const cellFg = win.bareFieldRisk
            ? theme.personal.ink
            : win.ndviSmooth >= 0.55
              ? theme.sage.ink
              : theme.secondary;

          return (
            <Pressable
              key={win.id}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${win.monthLabel} dekad matrix column`}
              onPress={() => setSelectedId(win.id)}
              style={[
                styles.monthCol,
                {
                  borderColor: isSelected ? theme.foreground : theme.border,
                  borderWidth: isSelected ? 1.5 : 1,
                  backgroundColor: cellBg,
                },
              ]}>
              <ThemedText type="code" style={{ color: cellFg }}>
                {win.monthLabel}
              </ThemedText>
              {[0, 1, 2].map((d) => {
                const stepTint = win.bareFieldRisk
                  ? theme.primary
                  : win.ndviSmooth >= 0.48 || (win.id === 'mar' && d === 2)
                    ? theme.sage.edge
                    : theme.mutedText;
                return (
                  <View
                    key={`${win.id}-d${d}`}
                    style={[
                      styles.dekadTile,
                      {
                        backgroundColor: stepTint,
                        opacity: win.bareFieldRisk
                          ? 0.88
                          : 0.45 + win.ndviSmooth * 0.55,
                      },
                    ]}
                  />
                );
              })}
              {isCloudGap && (
                <View
                  style={[
                    styles.cloudDot,
                    { backgroundColor: theme.pair.edge },
                  ]}
                />
              )}
            </Pressable>
          );
        })}
      </View>

      {selectedWindow && (
        <View
          style={[
            styles.inspector,
            {
              backgroundColor: theme.surfaceSubtle,
              borderColor: theme.border,
            },
          ]}>
          <View style={styles.inspectorHeader}>
            <View style={styles.titleIconRow}>
              {selectedWindow.bareFieldRisk ? (
                <Sun size={15} color={theme.primary} />
              ) : (
                <CloudRain size={15} color={theme.sage.ink} />
              )}
              <ThemedText type="smallBold">
                {selectedWindow.monthLabel} ({selectedWindow.dekadRange}) ·{' '}
                {selectedWindow.seasonLabel}
              </ThemedText>
            </View>
            <ThemedText
              type="code"
              style={{
                color: selectedWindow.bareFieldRisk
                  ? theme.personal.ink
                  : theme.sage.ink,
              }}>
              NDVI {selectedWindow.ndviSmooth.toFixed(2)} ·{' '}
              {selectedWindow.rainMm} mm
            </ThemedText>
          </View>
          <ThemedText type="small" themeColor="secondary">
            {selectedWindow.summaryNote}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: roofiRadii['2xl'],
    borderWidth: 1,
    padding: roofiSpacing[4],
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 3,
  },
  monthCol: {
    flex: 1,
    borderRadius: roofiRadii.md,
    paddingVertical: 5,
    paddingHorizontal: 2,
    alignItems: 'center',
    gap: 3,
    position: 'relative',
  },
  dekadTile: {
    width: '100%',
    height: 11,
    borderRadius: 3,
  },
  cloudDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  inspector: {
    borderRadius: roofiRadii.xl,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  inspectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  titleIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
