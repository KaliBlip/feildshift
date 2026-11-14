import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  PRIORITY_PRESETS,
  ROTATION_STRATEGIES,
  SCORING_CRITERIA,
} from '@/constants/pilot-data';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { usePilotState } from '@/hooks/use-pilot-state';
import { baseScores, rankProbabilities } from '@/lib/scoring';

export default function CompareScreen() {
  const { selectedCell, weights, applyPreset } = usePilotState();

  const scoreMatrix = ROTATION_STRATEGIES.map((s) => [...s.criterionScores]);
  const computedScores = baseScores(scoreMatrix, [...weights]);
  const stability = rankProbabilities(scoreMatrix, [...weights], {
    runs: 2000,
    seed: 42,
  });

  const weightSum = weights.reduce((acc, w) => acc + w, 0);
  const rankedIndices = ROTATION_STRATEGIES.map((_, idx) => idx).sort(
    (a, b) => computedScores[b] - computedScores[a],
  );

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
              {selectedCell.cellId} · Transparent MCDA + Rank Stability
            </ThemedText>
            <ThemedText type="subtitle">Strategy Comparison</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Compares your existing rotation against three alternatives using
              2,000 weight and score perturbations.
            </ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={styles.presetCard}>
            <ThemedText type="smallBold">Priority Weight Presets</ThemedText>
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
            <ThemedText type="code" themeColor="textSecondary">
              Active shares:{' '}
              {SCORING_CRITERIA.map(
                (label, idx) =>
                  `${label.split(' ')[0]} ${Math.round((weights[idx] / weightSum) * 100)}%`,
              ).join(' · ')}
            </ThemedText>
          </ThemedView>

          {rankedIndices.map((sIdx, rankPos) => {
            const strategy = ROTATION_STRATEGIES[sIdx];
            return (
              <ThemedView
                key={strategy.code}
                type="backgroundElement"
                style={[
                  styles.card,
                  rankPos === 0 && styles.topRankedCard,
                ]}>
                <View style={styles.cardHeader}>
                  <View style={styles.flexOne}>
                    <ThemedText type="default">{strategy.name}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {strategy.sequence}
                    </ThemedText>
                  </View>
                  <ThemedView type="background" style={styles.scoreBadge}>
                    <ThemedText type="smallBold">
                      {computedScores[sIdx].toFixed(3)}
                    </ThemedText>
                  </ThemedView>
                </View>

                <ThemedText type="code" themeColor="textSecondary">
                  Rank #{rankPos + 1} · Top-rank probability{' '}
                  {(stability.probabilityFirst[sIdx] * 100).toFixed(1)}% · Mean
                  rank {stability.meanRank[sIdx].toFixed(2)}
                  {strategy.isBaseline ? ' · Current Baseline' : ''}
                </ThemedText>

                <View style={styles.criteriaGrid}>
                  {SCORING_CRITERIA.map((criterion, cIdx) => (
                    <View key={criterion} style={styles.criterionRow}>
                      <ThemedText type="small" themeColor="textSecondary">
                        {criterion}
                      </ThemedText>
                      <ThemedText type="code">
                        {strategy.criterionScores[cIdx].toFixed(2)}
                      </ThemedText>
                    </View>
                  ))}
                </View>

                <View style={styles.detailBlock}>
                  <ThemedText type="smallBold">Expected benefits</ThemedText>
                  {strategy.expectedBenefits.map((benefit) => (
                    <ThemedText
                      key={benefit}
                      type="small"
                      themeColor="textSecondary">
                      • {benefit}
                    </ThemedText>
                  ))}
                </View>

                <View style={styles.detailBlock}>
                  <ThemedText type="smallBold">Information gaps &amp; review</ThemedText>
                  {strategy.informationGaps.map((gap) => (
                    <ThemedText key={gap} type="small" themeColor="textSecondary">
                      • Gap: {gap}
                    </ThemedText>
                  ))}
                  {strategy.risksNeedingReview.map((risk) => (
                    <ThemedText
                      key={risk}
                      type="small"
                      themeColor="textSecondary">
                      • Local check: {risk}
                    </ThemedText>
                  ))}
                </View>
              </ThemedView>
            );
          })}
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
  presetCard: {
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
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  topRankedCard: {
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  flexOne: { flex: 1 },
  scoreBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
  },
  criteriaGrid: {
    gap: Spacing.half,
    paddingTop: Spacing.half,
  },
  criterionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailBlock: {
    gap: Spacing.half,
  },
  pressed: { opacity: 0.7 },
});
