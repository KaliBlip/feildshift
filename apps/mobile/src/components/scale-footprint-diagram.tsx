import { StyleSheet, View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { roofiRadii, roofiTypography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Nested visual footprint comparison (log-compressed visual scale) contrasting
 * SMAP (9 km), Copernicus DEM (90 m), iSDAsoil/HLS (30 m), and the user's farm area.
 */
export function ScaleFootprintDiagram({ farmAreaHa }: { farmAreaHa: number }) {
  const theme = useTheme();
  const safeHa = Math.max(0.25, farmAreaHa);
  const farmKm2 = safeHa / 100;
  const farmPx = Math.min(
    62,
    Math.max(12, Math.round(14 + Math.log2(safeHa + 0.5) * 8)),
  );

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: theme.surfaceSubtle,
          borderColor: theme.border,
        },
      ]}>
      <Svg width={150} height={122} viewBox="0 0 150 122">
        {/* SMAP / IMERG ~9-10 km backdrop */}
        <Rect
          x={4}
          y={4}
          width={114}
          height={114}
          rx={12}
          fill={theme.surface}
          stroke={theme.warning}
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
        <SvgText
          x={10}
          y={17}
          fontSize={9}
          fill={theme.warning}
          fontFamily={roofiTypography.fontFamily.bodyBold}
          fontWeight="700">
          SMAP / IMERG (~9-10 km)
        </SvgText>

        {/* Copernicus DEM 90 m */}
        <Rect
          x={22}
          y={26}
          width={78}
          height={78}
          rx={9}
          fill={theme.pair.surface}
          stroke={theme.pair.edge}
          strokeWidth={1.5}
        />
        <SvgText
          x={28}
          y={39}
          fontSize={9}
          fill={theme.pair.ink}
          fontFamily={roofiTypography.fontFamily.bodyBold}
          fontWeight="700">
          90 m DEM Terrain
        </SvgText>

        {/* iSDAsoil / HLS 30 m */}
        <Rect
          x={38}
          y={46}
          width={46}
          height={46}
          rx={6}
          fill={theme.personal.surface}
          stroke={theme.primary}
          strokeWidth={1.5}
        />
        <SvgText
          x={42}
          y={57}
          fontSize={8}
          fill={theme.personal.ink}
          fontFamily={roofiTypography.fontFamily.bodyBold}
          fontWeight="700">
          30 m HLS/Soil
        </SvgText>

        {/* User plot centred inside 30 m / 90 m box */}
        <Rect
          x={61 - farmPx / 2}
          y={74 - farmPx / 2}
          width={farmPx}
          height={farmPx}
          rx={4}
          fill={theme.primary}
          opacity={0.85}
        />
      </Svg>

      <View style={styles.legendCol}>
        <ThemedText type="smallBold">Scale Honesty Picture</ThemedText>
        <ThemedText type="small" themeColor="secondary">
          Your {safeHa.toFixed(1)} ha farm ({farmKm2.toFixed(3)} km²) sits
          inside a coarse{' '}
          <ThemedText type="smallBold" style={{ color: theme.warning }}>
            9 km
          </ThemedText>{' '}
          SMAP box.
        </ThemedText>
        <ThemedText type="code" style={{ color: theme.personal.ink }}>
          30 m HLS/iSDAsoil matches parcel scale closely; 9 km SMAP stays
          regional.
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: roofiRadii.xl,
    borderWidth: 1,
  },
  legendCol: {
    flex: 1,
    gap: 4,
  },
});
