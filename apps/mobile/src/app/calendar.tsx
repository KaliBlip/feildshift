import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DekadHeatmapMatrix } from '@/components/dekad-heatmap-matrix';
import {
  type ChartPoint,
  HeroStatusCard,
  InteractiveAreaChartCard,
  SegmentedPillBar,
  TopBarHeader,
} from '@/components/design-system';
import { SyncStatusPill } from '@/components/sync-status-pill';
import { ThemedText } from '@/components/themed-text';
import { SEASONAL_VULNERABILITY_CALENDAR } from '@/constants/pilot-data';
import {
  BottomTabInset,
  CardShadow,
  MaxContentWidth,
  Radii,
  Spacing,
} from '@/constants/theme';
import { usePilotState } from '@/hooks/use-pilot-state';
import { useTheme } from '@/hooks/use-theme';

type CalendarFilter = 'all' | 'bare' | 'cloud';

const FILTER_OPTIONS = [
  { id: 'all', label: 'Year' },
  { id: 'bare', label: 'Bare Risk' },
  { id: 'cloud', label: 'Cloud QA' },
] as const;

const QA_TIER_LABELS = {
  high: 'QA: High clear-sky',
  moderate: 'QA: Moderate',
  low_cloud_gap: 'QA: Cloud-gap fill',
} as const;

const TEMP_BY_MONTH = [33, 35, 34, 31, 29, 27, 27, 28, 29, 29, 31, 32];
const ET0_BY_MONTH = [138, 140, 144, 130, 122, 112, 114, 118, 118, 120, 126, 132];

export default function CalendarScreen() {
  const theme = useTheme();
  const { cells, selectedCell, selectCell } = usePilotState();
  const [filter, setFilter] = useState<CalendarFilter>('all');

  const cycleCell = () => {
    const idx = cells.findIndex((c) => c.cellId === selectedCell.cellId);
    const next = cells[(idx + 1) % cells.length];
    selectCell(next.cellId);
  };

  const filteredWindows = SEASONAL_VULNERABILITY_CALENDAR.filter((item) => {
    if (filter === 'bare') return item.bareFieldRisk;
    if (filter === 'cloud') return item.qaTier === 'low_cloud_gap';
    return true;
  });

  const bareCount = SEASONAL_VULNERABILITY_CALENDAR.filter(
    (item) => item.bareFieldRisk,
  ).length;

  const moistureChartPoints: ChartPoint[] = SEASONAL_VULNERABILITY_CALENDAR.map(
    (w) => ({
      xLabel: w.monthLabel,
      value: Math.round(w.ndviSmooth * 100),
      calloutTitle: `${w.monthLabel} ${w.dekadRange}`,
    }),
  );

  const tempChartPoints: ChartPoint[] = SEASONAL_VULNERABILITY_CALENDAR.map(
    (w, idx) => ({
      xLabel: w.monthLabel,
      value: TEMP_BY_MONTH[idx],
      calloutTitle: `${w.monthLabel} Tmax`,
    }),
  );

  const rainEt0BarData = SEASONAL_VULNERABILITY_CALENDAR.flatMap((w, idx) => [
    {
      value: w.rainMm,
      label: w.monthLabel,
      spacing: 2,
      labelWidth: 26,
      frontColor: w.bareFieldRisk ? theme.amber : theme.primary,
    },
    {
      value: ET0_BY_MONTH[idx],
      frontColor: theme.blue,
    },
  ]);

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <TopBarHeader
        title={selectedCell.zoneName.split(' ')[0]}
        subtitle={`${selectedCell.soilTexture} · ${selectedCell.cellId}`}
        leftAction={{
          id: 'cycle-cell',
          icon: {
            ios: 'chevron.left',
            android: 'arrow_back',
            web: 'arrow_back',
          },
          onPress: cycleCell,
          accessibilityLabel: 'Switch pilot cell',
        }}
        rightActions={[
          {
            id: 'reset-filter',
            icon: {
              ios: 'ellipsis',
              android: 'more_vert',
              web: 'more_vert',
            },
            onPress: () => setFilter('all'),
            accessibilityLabel: 'Reset calendar filter',
          },
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <SyncStatusPill />

        <HeroStatusCard
          value="67"
          unit="%"
          deltaText={
            filter === 'bare'
              ? `↓ ${bareCount} bare months exposed`
              : '↑ +14% vs dry baseline'
          }
          statusLabel={filter === 'bare' ? 'Bare Risk' : 'Optimal'}
          statusTone={filter === 'bare' ? 'warning' : 'optimal'}
          subtitle="Canopy Greenness & Moisture Window"
          metaLeft={selectedCell.cellId}
          metaRight="36-dekad baseline"
        />

        <DekadHeatmapMatrix windows={SEASONAL_VULNERABILITY_CALENDAR} />

        <View
          style={[
            styles.windowCard,
            CardShadow,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}>
          <View style={styles.windowTopRow}>
            <ThemedText type="sectionTitle">Rainfall vs. ET₀ Demand</ThemedText>
            <ThemedText type="code" themeColor="textMuted">
              mm / month
            </ThemedText>
          </View>
          <View style={styles.statChipsRow}>
            <View style={[styles.miniChip, { backgroundColor: theme.primarySoft }]}>
              <ThemedText type="code" style={{ color: theme.primaryText }}>
                Rain (Wet)
              </ThemedText>
            </View>
            <View style={[styles.miniChip, { backgroundColor: theme.amberSoft }]}>
              <ThemedText type="code" style={{ color: theme.amber }}>
                Rain (Bare Dip)
              </ThemedText>
            </View>
            <View style={[styles.miniChip, { backgroundColor: theme.blueSoft }]}>
              <ThemedText type="code" style={{ color: theme.blue }}>
                ET₀ Demand
              </ThemedText>
            </View>
          </View>
          <BarChart
            data={rainEt0BarData}
            barWidth={8}
            spacing={12}
            roundedTop
            hideRules
            noOfSections={4}
            maxValue={240}
            height={145}
            xAxisThickness={0}
            yAxisThickness={0}
            yAxisTextStyle={{ color: theme.textMuted, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: theme.textSecondary, fontSize: 10 }}
          />
        </View>

        <SegmentedPillBar
          options={FILTER_OPTIONS}
          selectedId={filter}
          onSelect={setFilter}
        />

        <InteractiveAreaChartCard
          title="Vegetation Cover & Moisture"
          points={moistureChartPoints}
          unit="%"
          colorTone="green"
          statChips={['Avg 46%', 'Min 22%', 'Max 72%']}
          yMin={0}
          yMax={100}
          yTickCount={4}
        />

        <InteractiveAreaChartCard
          title="Air & Surface Temperature"
          points={tempChartPoints}
          unit="°C"
          colorTone="amber"
          statChips={['Avg 30°C', 'Min 27°C', 'Max 35°C']}
          yMin={20}
          yMax={40}
          yTickCount={4}
        />

        <View style={styles.sectionRow}>
          <ThemedText type="sectionTitle">
            Dekad Windows ({filteredWindows.length})
          </ThemedText>
          <ThemedText type="small" themeColor="textMuted">
            NDVI &lt; 0.28 flagged bare
          </ThemedText>
        </View>

        {filteredWindows.map((win) => (
          <View
            key={win.id}
            style={[
              styles.windowCard,
              CardShadow,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}>
            <View style={styles.windowTopRow}>
              <View style={styles.flexOne}>
                <ThemedText type="smallBold">
                  {win.monthLabel} · {win.dekadRange}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {win.seasonLabel}
                </ThemedText>
              </View>

              <View style={styles.badgeColumn}>
                {win.bareFieldRisk && (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: theme.amberSoft },
                    ]}>
                    <ThemedText type="code" style={{ color: theme.amber }}>
                      Bare risk
                    </ThemedText>
                  </View>
                )}
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: theme.backgroundElement },
                  ]}>
                  <ThemedText type="code" themeColor="textSecondary">
                    {QA_TIER_LABELS[win.qaTier]}
                  </ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.statChipsRow}>
              <View
                style={[
                  styles.miniChip,
                  { backgroundColor: theme.backgroundElement },
                ]}>
                <ThemedText type="code" themeColor="textSecondary">
                  Rain {win.rainMm} mm ({win.rainReliability})
                </ThemedText>
              </View>
              <View
                style={[
                  styles.miniChip,
                  { backgroundColor: theme.backgroundElement },
                ]}>
                <ThemedText type="code" themeColor="textSecondary">
                  SMAP z={win.smapAnomalyZ >= 0 ? '+' : ''}
                  {win.smapAnomalyZ.toFixed(2)}
                </ThemedText>
              </View>
              <View
                style={[
                  styles.miniChip,
                  { backgroundColor: theme.primarySoft },
                ]}>
                <ThemedText type="code" style={{ color: theme.primaryText }}>
                  NDVI {win.ndviSmooth.toFixed(2)}
                </ThemedText>
              </View>
            </View>

            <ThemedText type="small" themeColor="textSecondary">
              {win.summaryNote}
            </ThemedText>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  windowCard: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: 10,
  },
  windowTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  flexOne: { flex: 1 },
  badgeColumn: {
    alignItems: 'flex-end',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.xs,
  },
  statChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  miniChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.xs,
  },
});
