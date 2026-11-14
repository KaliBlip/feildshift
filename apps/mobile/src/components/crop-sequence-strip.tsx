import { ArrowRight, Leaf, ShieldAlert, Sprout } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Visual rotation sequence strip parsing "Major X -> Minor Y" / Cover steps
 * into icon nodes so farmers can read crop order at a glance.
 */
export function CropSequenceStrip({
  sequence,
  isBaseline,
}: {
  sequence: string;
  isBaseline: boolean;
}) {
  const theme = useTheme();
  const steps = sequence
    .split(/\s*->\s*|\s*\/\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 3);

  const toneBg = isBaseline ? theme.amberSoft : theme.primarySoft;
  const toneFg = isBaseline ? theme.amber : theme.primaryText;

  return (
    <View
      style={[
        styles.strip,
        {
          backgroundColor: toneBg,
          borderColor: isBaseline ? theme.amber : theme.primary,
        },
      ]}>
      {steps.map((step, idx) => (
        <View key={`${step}-${idx}`} style={styles.stepGroup}>
          {idx > 0 && <ArrowRight size={13} color={toneFg} />}
          <View style={[styles.stepPill, { backgroundColor: theme.surface }]}>
            {idx === 0 ? (
              isBaseline ? (
                <ShieldAlert size={13} color={toneFg} />
              ) : (
                <Sprout size={13} color={toneFg} />
              )
            ) : (
              <Leaf size={13} color={toneFg} />
            )}
            <ThemedText type="smallBold" style={{ color: theme.text }} numberOfLines={1}>
              {step}
            </ThemedText>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  stepGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
});
