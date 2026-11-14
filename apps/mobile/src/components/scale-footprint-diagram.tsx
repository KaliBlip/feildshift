import { StyleSheet, View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Nested visual footprint comparison (log-compressed visual scale) contrasting
 * SMAP (9 km), SoilGrids/MODIS (250 m), iSDAsoil/HLS (30 m), and the user's farm area.
 */
export function ScaleFootprintDiagram({ farmAreaHa }: { farmAreaHa: number }) {
  const theme = useTheme();
  const safeHa = Math.max(0.25, farmAreaHa);
  const farmKm2 = safeHa / 100;
  // Smooth log curve so 0.5 ha -> ~12 px and 50 ha -> ~66 px inside the 92 px 250 m / 30 m rings
  const farmPx = Math.min(62, Math.max(12, Math.round(14 + Math.log2(safeHa + 0.5) * 8)));

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: theme.backgroundElement,
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
          rx={10}
          fill={theme.surface}
          stroke={theme.amber}
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
        <SvgText x={10} y={17} fontSize={9} fill={theme.amber} fontWeight="600">
          SMAP / IMERG (~9-10 km)
        </SvgText>

        {/* MODIS / SoilGrids 250 m */}
        <Rect
          x={22}
          y={26}
          width={78}
          height={78}
          rx={7}
          fill={theme.blueSoft}
          stroke={theme.blue}
          strokeWidth={1.5}
        />
        <SvgText x={28} y={39} fontSize={9} fill={theme.blue} fontWeight="600">
          250 m MODIS/Soil
        </SvgText>

        {/* iSDAsoil / HLS 30 m */}
        <Rect
          x={38}
          y={46}
          width={46}
          height={46}
          rx={5}
          fill={theme.primarySoft}
          stroke={theme.primary}
          strokeWidth={1.5}
        />
        <SvgText x={42} y={57} fontSize={8} fill={theme.primaryText} fontWeight="600">
          30 m Pixel
        </SvgText>

        {/* User plot centred inside 30 m / 250 m box */}
        <Rect
          x={61 - farmPx / 2}
          y={74 - farmPx / 2}
          width={farmPx}
          height={farmPx}
          rx={3}
          fill={theme.primary}
          opacity={0.82}
        />
      </Svg>

      <View style={styles.legendCol}>
        <ThemedText type="smallBold">Scale Honesty Picture</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Your {safeHa.toFixed(1)} ha farm ({farmKm2.toFixed(3)} km²) sits inside a coarse{' '}
          <ThemedText type="smallBold" style={{ color: theme.amber }}>
            9 km
          </ThemedText>{' '}
          SMAP box.
        </ThemedText>
        <ThemedText type="code" style={{ color: theme.primaryText }}>
          30 m HLS/iSDAsoil matches parcel scale closely; 9 km SMAP stays regional.
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  legendCol: {
    flex: 1,
    gap: 4,
  },
});
