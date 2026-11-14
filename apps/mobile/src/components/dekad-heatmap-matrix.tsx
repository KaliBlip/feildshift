import { CloudRain, Sun } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { DekadWindowSummary } from '@/constants/pilot-data';
import { CardShadow, Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * 12 months x 3 dekads = 36-dekad visual vulnerability & bare-field heatmap.
 * Tapping any month selects it in an inline inspector card so farmers can spot
 * Harmattan bare-soil exposure and monsoon cloud gaps at a glance.
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
        <ThemedText type="code" themeColor="textMuted">
          12 mos × 3 dekads
        </ThemedText>
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: theme.primary }]} />
          <ThemedText type="code" themeColor="textSecondary">
            Cover OK
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: theme.amber }]} />
          <ThemedText type="code" themeColor="textSecondary">
            Bare risk
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: theme.blue }]} />
          <ThemedText type="code" themeColor="textSecondary">
            Cloud QA gap
          </ThemedText>
        </View>
      </View>

      <View style={styles.gridRow}>
        {windows.map((win) => {
          const isSelected = win.id === selectedId;
          const isCloudGap = win.qaTier === 'low_cloud_gap';
          const cellBg = win.bareFieldRisk
            ? theme.amberSoft
            : win.ndviSmooth >= 0.55
              ? theme.primarySoft
              : theme.backgroundElement;
          const cellFg = win.bareFieldRisk
            ? theme.amber
            : win.ndviSmooth >= 0.55
              ? theme.primaryText
              : theme.textSecondary;

          return (
            <Pressable
              key={win.id}
              accessibilityLabel={`${win.monthLabel} dekad matrix column`}
              onPress={() => setSelectedId(win.id)}
              style={[
                styles.monthCol,
                {
                  borderColor: isSelected ? theme.text : theme.border,
                  backgroundColor: cellBg,
                },
              ]}>
              <ThemedText type="code" style={{ color: cellFg }}>
                {win.monthLabel}
              </ThemedText>
              {[0, 1, 2].map((d) => {
                // Slight progressive transition per dekad across onset/cessation
                const stepTint = win.bareFieldRisk
                  ? theme.amber
                  : win.ndviSmooth >= 0.48 || (win.id === 'mar' && d === 2)
                    ? theme.primary
                    : theme.textMuted;
                return (
                  <View
                    key={`${win.id}-d${d}`}
                    style={[
                      styles.dekadTile,
                      {
                        backgroundColor: stepTint,
                        opacity: win.bareFieldRisk ? 0.85 : 0.45 + win.ndviSmooth * 0.55,
                      },
                    ]}
                  />
                );
              })}
              {isCloudGap && (
                <View style={[styles.cloudDot, { backgroundColor: theme.blue }]} />
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
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}>
          <View style={styles.inspectorHeader}>
            <View style={styles.titleIconRow}>
              {selectedWindow.bareFieldRisk ? (
                <Sun size={15} color={theme.amber} />
              ) : (
                <CloudRain size={15} color={theme.primaryText} />
              )}
              <ThemedText type="smallBold">
                {selectedWindow.monthLabel} ({selectedWindow.dekadRange}) ·{' '}
                {selectedWindow.seasonLabel}
              </ThemedText>
            </View>
            <ThemedText type="code" style={{ color: selectedWindow.bareFieldRisk ? theme.amber : theme.primaryText }}>
              NDVI {selectedWindow.ndviSmooth.toFixed(2)} · {selectedWindow.rainMm} mm
            </ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {selectedWindow.summaryNote}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: 10,
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
    gap: 5,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 3,
  },
  monthCol: {
    flex: 1,
    borderRadius: Radii.xs,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 2,
    alignItems: 'center',
    gap: 3,
    position: 'relative',
  },
  dekadTile: {
    width: '100%',
    height: 11,
    borderRadius: 2,
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
    borderRadius: Radii.md,
    borderWidth: 1,
    padding: 10,
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
