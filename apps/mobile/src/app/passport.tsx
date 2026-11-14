import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { EVIDENCE_PASSPORTS, GLOSSARY_ITEMS } from '@/constants/pilot-data';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { usePilotState } from '@/hooks/use-pilot-state';

const EVIDENCE_TIER_LABELS: Record<
  (typeof EVIDENCE_PASSPORTS)[number]['evidenceTier'],
  string
> = {
  established_science: 'Established science',
  data_derived_finding: 'Data-derived finding',
  farmer_reported_observation: 'Farmer-reported',
  unverified_hypothesis: 'Unverified hypothesis',
  expert_validated_insight: 'Expert-validated',
};

export default function PassportScreen() {
  const { selectedCell } = usePilotState();

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
              {selectedCell.cellId} · Auditable Decision Support
            </ThemedText>
            <ThemedText type="subtitle">Evidence Passports</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Every strategy states its evidence tier, datasets, uncertainty,
              pixel scale limits, and required local expert checks.
            </ThemedText>
          </View>

          {EVIDENCE_PASSPORTS.map((passport) => (
            <ThemedView
              key={passport.id}
              type="backgroundElement"
              style={styles.card}>
              <View style={styles.cardHeader}>
                <ThemedText type="default" style={styles.flexOne}>
                  {passport.title}
                </ThemedText>
                <ThemedView type="background" style={styles.tierBadge}>
                  <ThemedText type="code">
                    {EVIDENCE_TIER_LABELS[passport.evidenceTier]}
                  </ThemedText>
                </ThemedView>
              </View>

              <ThemedText type="small">{passport.observationSummary}</ThemedText>

              <ThemedText type="code" themeColor="textSecondary">
                Datasets: {passport.datasetsUsed.join(', ')}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Coverage: {passport.spatialTemporalCoverage}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Method: {passport.methodApplied}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Uncertainty: {passport.uncertaintySummary}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Scale honesty: {passport.scaleHonestyNote}
              </ThemedText>

              <View style={styles.listBlock}>
                <ThemedText type="smallBold">Information gaps</ThemedText>
                {passport.informationGaps.map((gap) => (
                  <ThemedText
                    key={gap}
                    type="small"
                    themeColor="textSecondary">
                    • {gap}
                  </ThemedText>
                ))}
              </View>

              <View style={styles.listBlock}>
                <ThemedText type="smallBold">Required local review</ThemedText>
                {passport.requiredLocalReview.map((item) => (
                  <ThemedText
                    key={item}
                    type="small"
                    themeColor="textSecondary">
                    • {item}
                  </ThemedText>
                ))}
              </View>
            </ThemedView>
          ))}

          <View style={styles.glossarySection}>
            <ThemedText type="smallBold">Plain-Language Glossary</ThemedText>
            {GLOSSARY_ITEMS.map((entry) => (
              <Collapsible key={entry.term} title={entry.term}>
                <View style={styles.glossaryBody}>
                  <ThemedText type="small">{entry.plainMeaning}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Why it matters: {entry.whyItMatters}
                  </ThemedText>
                </View>
              </Collapsible>
            ))}
          </View>
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  flexOne: { flex: 1 },
  tierBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.two,
  },
  listBlock: {
    gap: Spacing.half,
  },
  glossarySection: {
    gap: Spacing.two,
    paddingTop: Spacing.one,
  },
  glossaryBody: {
    gap: Spacing.one,
  },
});
