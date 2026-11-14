import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AshantiMapPreview } from '@/components/ashanti-map-preview';
import {
  type ChartPoint,
  InteractiveAreaChartCard,
  KpiMetricCard,
  SegmentedPillBar,
  SmartInsightCard,
  TopSearchRegionHeader,
} from '@/components/design-system';
import { ScaleFootprintDiagram } from '@/components/scale-footprint-diagram';
import { SyncStatusPill } from '@/components/sync-status-pill';
import { ThemedText } from '@/components/themed-text';
import { evaluateMobileScaleHonesty } from '@/constants/pilot-data';
import {
  BottomTabInset,
  CardShadow,
  MaxContentWidth,
  Radii,
  Spacing,
} from '@/constants/theme';
import { usePilotState } from '@/hooks/use-pilot-state';
import { useTheme } from '@/hooks/use-theme';

const CELL_METRICS: Record<
  string,
  {
    soilMoisturePct: string;
    airTempC: string;
    soilTempC: string;
    canopyPct: string;
    insight: string;
  }
> = {
  ASH_R05_C05: {
    soilMoisturePct: '52',
    airTempC: '29',
    soilTempC: '25',
    canopyPct: '67',
    insight:
      'Optimal major-season moisture in Ejura-Kumasi sandy clay loam — minor-season cowpea relay holds soil cover.',
  },
  ASH_R04_C04: {
    soilMoisturePct: '58',
    airTempC: '28',
    soilTempC: '24',
    canopyPct: '71',
    insight:
      'Higher upland rainfall (1,380 mm) increases runoff on 7.2% slopes — cover mulch strongly lowers soil wash.',
  },
  ASH_R06_C06: {
    soilMoisturePct: '47',
    airTempC: '30',
    soilTempC: '26',
    canopyPct: '62',
    insight:
      'Faster drainage in sandy loam soils calls for early drought-tolerant planting windows in late March.',
  },
};

type HomeTimeframeId = 'maj' | 'min' | 'dry' | 'yr';

const MOISTURE_SERIES: Record<HomeTimeframeId, ChartPoint[]> = {
  maj: [
    { xLabel: 'D07', value: 38, calloutTitle: 'Mar D07' },
    { xLabel: 'D09', value: 49, calloutTitle: 'Mar D09' },
    { xLabel: 'D11', value: 64, calloutTitle: 'Apr D11' },
    { xLabel: 'D13', value: 78, calloutTitle: 'May D13' },
    { xLabel: 'D16', value: 86, calloutTitle: 'Jun D16' },
    { xLabel: 'D19', value: 70, calloutTitle: 'Jul D19' },
    { xLabel: 'D21', value: 58, calloutTitle: 'Jul D21' },
  ],
  min: [
    { xLabel: 'D25', value: 44, calloutTitle: 'Sep D25' },
    { xLabel: 'D27', value: 62, calloutTitle: 'Sep D27' },
    { xLabel: 'D29', value: 74, calloutTitle: 'Oct D29' },
    { xLabel: 'D30', value: 79, calloutTitle: 'Oct D30' },
    { xLabel: 'D32', value: 56, calloutTitle: 'Nov D32' },
    { xLabel: 'D33', value: 42, calloutTitle: 'Nov D33' },
  ],
  dry: [
    { xLabel: 'D34', value: 35, calloutTitle: 'Dec D34' },
    { xLabel: 'D36', value: 27, calloutTitle: 'Dec D36' },
    { xLabel: 'D02', value: 21, calloutTitle: 'Jan D02' },
    { xLabel: 'D04', value: 19, calloutTitle: 'Feb D04' },
    { xLabel: 'D05', value: 24, calloutTitle: 'Feb D05' },
    { xLabel: 'D06', value: 30, calloutTitle: 'Feb D06' },
  ],
  yr: [
    { xLabel: 'Jan', value: 24, calloutTitle: 'Jan D02' },
    { xLabel: 'Feb', value: 26, calloutTitle: 'Feb D05' },
    { xLabel: 'Mar', value: 45, calloutTitle: 'Mar D08' },
    { xLabel: 'Apr', value: 62, calloutTitle: 'Apr D11' },
    { xLabel: 'May', value: 78, calloutTitle: 'May D14' },
    { xLabel: 'Jun', value: 86, calloutTitle: 'Jun D17' },
    { xLabel: 'Jul', value: 66, calloutTitle: 'Jul D20' },
    { xLabel: 'Aug', value: 42, calloutTitle: 'Aug D23' },
    { xLabel: 'Sep', value: 64, calloutTitle: 'Sep D26' },
    { xLabel: 'Oct', value: 74, calloutTitle: 'Oct D29' },
    { xLabel: 'Nov', value: 48, calloutTitle: 'Nov D32' },
    { xLabel: 'Dec', value: 29, calloutTitle: 'Dec D35' },
  ],
};

const HOME_TIMEFRAMES = [
  { id: 'maj', label: 'Maj' },
  { id: 'min', label: 'Min' },
  { id: 'dry', label: 'Dry' },
  { id: 'yr', label: 'Yr' },
];

const TIER_LABELS = {
  field_scale: 'Field scale',
  sub_regional: 'Sub-regional',
  regional_context_only: 'Regional context',
} as const;

export default function HomeScreen() {
  const theme = useTheme();
  const {
    cells,
    selectedCell,
    selectCell,
    farmAreaHa,
    setFarmAreaHa,
  } = usePilotState();

  const [searchQuery, setSearchQuery] = useState('');
  const [timeframeId, setTimeframeId] = useState<HomeTimeframeId>('maj');

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    const trimmed = text.trim().toLowerCase();
    if (trimmed.length >= 2) {
      const match = cells.find(
        (c) =>
          c.cellId.toLowerCase().includes(trimmed) ||
          c.zoneName.toLowerCase().includes(trimmed) ||
          c.soilTexture.toLowerCase().includes(trimmed),
      );
      if (match && match.cellId !== selectedCell.cellId) {
        selectCell(match.cellId);
      }
    }
  };

  const kpis = CELL_METRICS[selectedCell.cellId] ?? CELL_METRICS.ASH_R05_C05;
  const soilOptions = cells.map((c) => ({
    id: c.cellId,
    label: c.soilTexture.replace('Sandy clay loam', 'Sandy clay'),
  }));
  const scaleAssessment = evaluateMobileScaleHonesty(farmAreaHa);

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <TopSearchRegionHeader
        searchQuery={searchQuery}
        onChangeSearch={handleSearchChange}
        searchPlaceholder="Search soil or cell"
        regionCaption="Region"
        regionName="Ashanti, Ghana"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <SyncStatusPill />

        <SegmentedPillBar
          options={soilOptions}
          selectedId={selectedCell.cellId}
          onSelect={selectCell}
        />

        <AshantiMapPreview
          cells={cells}
          selectedCellId={selectedCell.cellId}
          onSelectCell={selectCell}
        />

        <View style={styles.kpiGrid}>
          <View style={styles.kpiRow}>
            <KpiMetricCard
              icon={{
                ios: 'drop',
                android: 'water_drop',
                web: 'water_drop',
              }}
              value={kpis.soilMoisturePct}
              unit="%"
              label="Soil Moisture"
            />
            <KpiMetricCard
              icon={{
                ios: 'thermometer.medium',
                android: 'thermostat',
                web: 'thermostat',
              }}
              value={kpis.airTempC}
              unit="°C"
              label="Air temp"
            />
          </View>
          <View style={styles.kpiRow}>
            <KpiMetricCard
              icon={{
                ios: 'thermometer.medium',
                android: 'thermostat',
                web: 'thermostat',
              }}
              value={kpis.soilTempC}
              unit="°C"
              label="Soil Temp"
            />
            <KpiMetricCard
              icon={{
                ios: 'leaf',
                android: 'eco',
                web: 'eco',
              }}
              value={kpis.canopyPct}
              unit="%"
              label="Canopy Cover"
            />
          </View>
        </View>

        <InteractiveAreaChartCard
          title="Soil moisture"
          points={MOISTURE_SERIES[timeframeId]}
          unit="%"
          colorTone="green"
          timeframes={HOME_TIMEFRAMES}
          activeTimeframeId={timeframeId}
          onSelectTimeframe={(id) => setTimeframeId(id as HomeTimeframeId)}
          yMin={0}
          yMax={100}
          yTickCount={4}
        />

        <View style={styles.sectionHeader}>
          <ThemedText type="sectionTitle">Smart Insights</ThemedText>
          <ThemedText type="small" themeColor="textMuted">
            {selectedCell.cellId}
          </ThemedText>
        </View>

        <SmartInsightCard
          icon={{ ios: 'leaf', android: 'eco', web: 'eco' }}
          category="SOIL STATUS"
          headline={kpis.insight}
          footer={`Baseline 2015-2025 · Slope ${selectedCell.slopePct}% · pH ${selectedCell.soilPh}`}
          tone="green"
        />

        <View
          style={[
            styles.scaleCard,
            CardShadow,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}>
          <View style={styles.scaleHeader}>
            <View style={styles.flexOne}>
              <ThemedText type="captionUppercase" themeColor="textMuted">
                SCALE HONESTY CHECK
              </ThemedText>
              <ThemedText type="smallBold">
                Your farm: {farmAreaHa.toFixed(1)} ha (
                {(farmAreaHa / 100).toFixed(3)} km²)
              </ThemedText>
            </View>

            <View style={styles.stepperGroup}>
              <Pressable
                accessibilityLabel="Decrease farm area"
                onPress={() => setFarmAreaHa(farmAreaHa - 0.5)}
                style={({ pressed }) => [
                  styles.stepperBtn,
                  { backgroundColor: theme.backgroundElement },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold">−</ThemedText>
              </Pressable>
              <Pressable
                accessibilityLabel="Increase farm area"
                onPress={() => setFarmAreaHa(farmAreaHa + 0.5)}
                style={({ pressed }) => [
                  styles.stepperBtn,
                  { backgroundColor: theme.primarySoft },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" style={{ color: theme.primaryText }}>
                  +
                </ThemedText>
              </Pressable>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <ScaleFootprintDiagram farmAreaHa={farmAreaHa} />

          {scaleAssessment.slice(0, 4).map((entry) => {
            const isField = entry.resolvesFarm;
            return (
              <View key={entry.dataset} style={styles.scaleRow}>
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  style={styles.flexOne}
                  numberOfLines={1}>
                  {entry.dataset}
                </ThemedText>
                <View
                  style={[
                    styles.scaleBadge,
                    {
                      backgroundColor: isField
                        ? theme.primarySoft
                        : theme.backgroundElement,
                    },
                  ]}>
                  <ThemedText
                    type="code"
                    style={{
                      color: isField ? theme.primaryText : theme.textSecondary,
                    }}>
                    {TIER_LABELS[entry.advisoryTier]}
                  </ThemedText>
                </View>
              </View>
            );
          })}
        </View>
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
  kpiGrid: {
    gap: 10,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  scaleCard: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: 10,
  },
  scaleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  flexOne: { flex: 1 },
  stepperGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: Radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  scaleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  scaleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.xs,
  },
  pressed: { opacity: 0.75 },
});
