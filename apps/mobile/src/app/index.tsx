import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { baseScores, rankProbabilities } from '@/lib/scoring';

const PREVIEW_SCORING_DATA = {
  strategies: ['Existing rotation', 'Strategy A', 'Strategy B'],
  criteria: [
    'Water efficiency',
    'Soil health',
    'Erosion protection',
    'Income and market',
  ],
  scores: [
    [0.55, 0.4, 0.5, 0.3],
    [0.7, 0.65, 0.6, 0.55],
    [0.6, 0.8, 0.75, 0.45],
  ],
  weights: [0.4, 0.3, 0.2, 0.1],
};

export default function HomeScreen() {
  const computedBaseScores = baseScores(
    PREVIEW_SCORING_DATA.scores,
    PREVIEW_SCORING_DATA.weights,
  );
  const stability = rankProbabilities(
    PREVIEW_SCORING_DATA.scores,
    PREVIEW_SCORING_DATA.weights,
    { runs: 2000, seed: 42 },
  );

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
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

          <View style={styles.section}>
            <ThemedText type="smallBold">
              Baseline Strategy Comparison (Illustrative Fixture)
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Weights:{' '}
              {PREVIEW_SCORING_DATA.weights
                .map(
                  (w, idx) =>
                    `${PREVIEW_SCORING_DATA.criteria[idx]} ${w.toFixed(1)}`,
                )
                .join(' · ')}
            </ThemedText>

            {PREVIEW_SCORING_DATA.strategies.map((strategy, sIdx) => (
              <ThemedView
                key={strategy}
                type="backgroundElement"
                style={styles.card}>
                <View style={styles.cardHeader}>
                  <ThemedText type="default">{strategy}</ThemedText>
                  <ThemedText type="smallBold">
                    Score {computedBaseScores[sIdx].toFixed(3)}
                  </ThemedText>
                </View>

                <ThemedText type="small" themeColor="textSecondary">
                  First-rank probability:{' '}
                  {(stability.probabilityFirst[sIdx] * 100).toFixed(1)}% (mean
                  rank {stability.meanRank[sIdx].toFixed(2)})
                </ThemedText>

                <View style={styles.criteriaList}>
                  {PREVIEW_SCORING_DATA.criteria.map((criterion, cIdx) => (
                    <View key={criterion} style={styles.criterionRow}>
                      <ThemedText type="small" themeColor="textSecondary">
                        {criterion}
                      </ThemedText>
                      <ThemedText type="code">
                        {PREVIEW_SCORING_DATA.scores[sIdx][cIdx].toFixed(2)}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </ThemedView>
            ))}
          </View>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">
              Evidence Passport &amp; Local Review
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Numbers above mirror shared/test-vectors/scoring_basic.json for
              cross-platform scoring parity. Farmer priorities, seed access,
              disease risk, and coarse satellite pixel scale must be reviewed
              with a local agronomist before acting.
            </ThemedText>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.one,
  },
  section: {
    gap: Spacing.two,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  criteriaList: {
    gap: Spacing.one,
    paddingTop: Spacing.one,
  },
  criterionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
