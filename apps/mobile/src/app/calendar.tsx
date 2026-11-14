import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SEASONAL_VULNERABILITY_CALENDAR } from '@/constants/pilot-data';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { usePilotState } from '@/hooks/use-pilot-state';

type CalendarFilter = 'all' | 'bare' | 'cloud';

const QA_TIER_TEXT = {
  high: 'QA: High clear-sky',
  moderate: 'QA: Moderate',
  low_cloud_gap: 'QA: Cloud-gap fill',
} as const;

export default function CalendarScreen() {
  const { selectedCell } = usePilotState();
  const [filter, setFilter] = useState<CalendarFilter>('all');

  const filteredWindows = SEASONAL_VULNERABILITY_CALENDAR.filter((item) => {
    if (filter === 'bare') return item.bareFieldRisk;
    if (filter === 'cloud') return item.qaTier === 'low_cloud_gap';
    return true;
  });

  const bareCount = SEASONAL_VULNERABILITY_CALENDAR.filter(
    (item) => item.bareFieldRisk,
  ).length;

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            Platform.OS === 'web' && styles.webContentOffset,
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {selectedCell.cellId} · 36-Dekad Baseline
            </ThemedText>
            <ThemedText type="subtitle">Vulnerability Calendar</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Tracks bimodal rainfall reliability, SMAP moisture anomaly,
              smoothed NDVI cover, and bare-soil erosion windows.
            </ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={styles.summaryCard}>
            <ThemedText type="smallBold">
              {bareCount} high-exposure bare-field months flagged (NDVI &lt; 0.28)
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Optical gaps during May-June and September rains are bridged via
              cloud masking and Savitzky-Golay smoothing.
            </ThemedText>

            <View style={styles.chipRow}>
              {(
                [
                  { id: 'all', label: 'All 12 windows' },
                  { id: 'bare', label: 'Bare-field risk' },
                  { id: 'cloud', label: 'Cloud-gap QA' },
                ] as const
              ).map((option) => {
                const isSelected = filter === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setFilter(option.id)}
                    style={({ pressed }) => pressed && styles.pressed}>
                    <ThemedView
                      type={isSelected ? 'backgroundSelected' : 'background'}
                      style={styles.chip}>
                      <ThemedText
                        type="small"
                        themeColor={isSelected ? 'text' : 'textSecondary'}>
                        {option.label}
                      </ThemedText>
                    </ThemedView>
                  </Pressable>
                );
              })}
            </View>
          </ThemedView>

          {filteredWindows.map((win) => (
            <ThemedView
              key={win.id}
              type="backgroundElement"
              style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <ThemedText type="default">
                    {win.monthLabel} · {win.dekadRange}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {win.seasonLabel}
                  </ThemedText>
                </View>

                <View style={styles.badgeStack}>
                  {win.bareFieldRisk && (
                    <ThemedView type="background" style={styles.riskBadge}>
                      <ThemedText type="code">Bare-soil risk</ThemedText>
                    </ThemedView>
                  )}
                  <ThemedView type="background" style={styles.qaBadge}>
                    <ThemedText type="code">
                      {QA_TIER_TEXT[win.qaTier]}
                    </ThemedText>
                  </ThemedView>
                </View>
              </View>

              <View style={styles.metricsRow}>
                <ThemedText type="code" themeColor="textSecondary">
                  Rain {win.rainMm} mm ({win.rainReliability})
                </ThemedText>
                <ThemedText type="code" themeColor="textSecondary">
                  SMAP z={win.smapAnomalyZ >= 0 ? '+' : ''}
                  {win.smapAnomalyZ.toFixed(2)}
                </ThemedText>
                <ThemedText type="code" themeColor="textSecondary">
                  NDVI {win.ndviSmooth.toFixed(2)}
                </ThemedText>
              </View>

              <ThemedText type="small">{win.summaryNote}</ThemedText>
            </ThemedView>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1, alignItems: 'center' },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.two,
  },
  webContentOffset: {
    paddingTop: Spacing.six,
  },
  header: { gap: Spacing.one, marginBottom: Spacing.one },
  summaryCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  badgeStack: {
    alignItems: 'flex-end',
    gap: Spacing.half,
  },
  riskBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#C65102',
  },
  qaBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.two,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingVertical: Spacing.half,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
  },
  pressed: { opacity: 0.7 },
});
