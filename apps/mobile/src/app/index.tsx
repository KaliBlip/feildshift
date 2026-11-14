import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  PRIORITY_PRESETS,
  SCORING_CRITERIA,
  evaluateMobileScaleHonesty,
} from '@/constants/pilot-data';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { usePilotState } from '@/hooks/use-pilot-state';

const TIER_LABELS = {
  field_scale: 'Field scale',
  sub_regional: 'Sub-regional',
  regional_context_only: 'Regional context',
} as const;

export default function HomeScreen() {
  const {
    cells,
    selectedCell,
    selectCell,
    farmAreaHa,
    setFarmAreaHa,
    weights,
    setWeightAt,
    applyPreset,
  } = usePilotState();

  const scaleAssessment = evaluateMobileScaleHonesty(farmAreaHa);
  const weightSum = weights.reduce((acc, w) => acc + w, 0);

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
              NASA Space Apps Challenge 2026
            </ThemedText>
            <ThemedText type="subtitle">Field Shift</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Ashanti Region, Ghana · Evidence-graded crop-rotation decision
              support powered by NASA Earth observations.
            </ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">1. Pilot Cell Selector</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Choose an Ashanti 0.05° analysis cell (~5.5 × 5.5 km) inside the
              50 × 50 km pilot corridor:
            </ThemedText>

            <View style={styles.chipRow}>
              {cells.map((cell) => {
                const isSelected = cell.cellId === selectedCell.cellId;
                return (
                  <Pressable
                    key={cell.cellId}
                    onPress={() => selectCell(cell.cellId)}
                    style={({ pressed }) => pressed && styles.pressed}>
                    <ThemedView
                      type={
                        isSelected ? 'backgroundSelected' : 'background'
                      }
                      style={[
                        styles.chip,
                        isSelected && styles.chipSelected,
                      ]}>
                      <ThemedText
                        type="smallBold"
                        themeColor={isSelected ? 'text' : 'textSecondary'}>
                        {cell.cellId}
                      </ThemedText>
                    </ThemedView>
                  </Pressable>
                );
              })}
            </View>

            <ThemedText type="small">{selectedCell.zoneName}</ThemedText>
            <ThemedText type="code" themeColor="textSecondary">
              {selectedCell.centreLat.toFixed(3)}°N,{' '}
              {Math.abs(selectedCell.centreLon).toFixed(3)}°W · Slope{' '}
              {selectedCell.slopePct}% · {selectedCell.soilTexture} (pH{' '}
              {selectedCell.soilPh}) · ~{selectedCell.typicalAnnualRainMm} mm/yr
            </ThemedText>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={styles.flexOne}>
                <ThemedText type="smallBold">2. Scale-Honesty Check</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Farm size: {farmAreaHa.toFixed(1)} ha (
                  {(farmAreaHa / 100).toFixed(3)} km²)
                </ThemedText>
              </View>
              <View style={styles.stepperRow}>
                <Pressable
                  onPress={() => setFarmAreaHa(farmAreaHa - 0.5)}
                  style={({ pressed }) => pressed && styles.pressed}>
                  <ThemedView type="background" style={styles.stepperButton}>
                    <ThemedText type="smallBold">−</ThemedText>
                  </ThemedView>
                </Pressable>
                <Pressable
                  onPress={() => setFarmAreaHa(farmAreaHa + 0.5)}
                  style={({ pressed }) => pressed && styles.pressed}>
                  <ThemedView type="background" style={styles.stepperButton}>
                    <ThemedText type="smallBold">+</ThemedText>
                  </ThemedView>
                </Pressable>
              </View>
            </View>

            <View style={styles.listGap}>
              {scaleAssessment.map((entry) => (
                <View key={entry.dataset} style={styles.scaleRow}>
                  <View style={styles.flexOne}>
                    <ThemedText type="small">{entry.dataset}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {entry.note}
                    </ThemedText>
                  </View>
                  <ThemedView type="background" style={styles.badge}>
                    <ThemedText type="code">
                      {TIER_LABELS[entry.advisoryTier]}
                    </ThemedText>
                  </ThemedView>
                </View>
              ))}
            </View>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">3. Farmer Priority Weights</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Adjust priorities here or on the Compare tab to re-rank strategies
              live:
            </ThemedText>

            <View style={styles.chipRow}>
              {PRIORITY_PRESETS.map((preset) => (
                <Pressable
                  key={preset.id}
                  onPress={() => applyPreset(preset.weights)}
                  style={({ pressed }) => pressed && styles.pressed}>
                  <ThemedView type="background" style={styles.chip}>
                    <ThemedText type="small">{preset.label}</ThemedText>
                  </ThemedView>
                </Pressable>
              ))}
            </View>

            <View style={styles.listGap}>
              {SCORING_CRITERIA.map((criterion, idx) => {
                const sharePct = Math.round((weights[idx] / weightSum) * 100);
                return (
                  <View key={criterion} style={styles.rowBetween}>
                    <View style={styles.flexOne}>
                      <ThemedText type="small">{criterion}</ThemedText>
                      <ThemedText type="code" themeColor="textSecondary">
                        Weight {weights[idx].toFixed(2)} ({sharePct}%)
                      </ThemedText>
                    </View>
                    <View style={styles.stepperRow}>
                      <Pressable
                        onPress={() => setWeightAt(idx, -0.05)}
                        style={({ pressed }) => pressed && styles.pressed}>
                        <ThemedView type="background" style={styles.stepperButton}>
                          <ThemedText type="smallBold">−</ThemedText>
                        </ThemedView>
                      </Pressable>
                      <Pressable
                        onPress={() => setWeightAt(idx, 0.05)}
                        style={({ pressed }) => pressed && styles.pressed}>
                        <ThemedView type="background" style={styles.stepperButton}>
                          <ThemedText type="smallBold">+</ThemedText>
                        </ThemedView>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          </ThemedView>
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
    gap: Spacing.three,
  },
  webContentOffset: {
    paddingTop: Spacing.six,
  },
  header: { gap: Spacing.one },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
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
  chipSelected: {
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  flexOne: { flex: 1 },
  stepperRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  stepperButton: {
    width: 34,
    height: 34,
    borderRadius: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listGap: {
    gap: Spacing.two,
    paddingTop: Spacing.one,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.two,
  },
  pressed: { opacity: 0.7 },
});
