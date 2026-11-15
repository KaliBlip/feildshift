import Svg, { Path, Rect } from 'react-native-svg';
import {
  CalendarIcon,
  ChartIcon,
  ChatIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  DocumentCheckIcon,
  FilterIcon,
  GlobeIcon,
  HomeIcon,
  MapIcon,
  MapPinIcon,
  RepeatIcon,
  SearchIcon,
  ShareIcon,
  ShieldIcon,
  UserIcon,
  WaterDropIcon,
  WhatsAppIcon,
  ZapIcon,
} from './roofi-icons';

export type PlannerIconName =
  | 'home'
  | 'calendar'
  | 'compare'
  | 'passport'
  | 'chat'
  | 'pairs'
  | 'tasks'
  | 'search'
  | 'plus'
  | 'filter'
  | 'chevron'
  | 'back'
  | 'profile'
  | 'map'
  | 'pin'
  | 'shield'
  | 'document'
  | 'zap'
  | 'water'
  | 'share'
  | 'whatsapp'
  | 'repeat'
  | 'check'
  | 'close'
  | 'globe';

export function PlannerIcon({
  name,
  size = 22,
  color = '#111111',
  strokeWidth = 1.7,
}: {
  name: PlannerIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  if (name === 'home') return <HomeIcon size={size} color={color} />;
  if (name === 'calendar') return <CalendarIcon size={size} color={color} />;
  if (name === 'compare') return <ChartIcon size={size} color={color} />;
  if (name === 'passport') return <ShieldIcon size={size} color={color} />;
  if (name === 'chat') return <ChatIcon size={size} color={color} />;
  if (name === 'search') return <SearchIcon size={size} color={color} />;
  if (name === 'filter') return <FilterIcon size={size} color={color} />;
  if (name === 'chevron') return <ChevronRightIcon size={size} color={color} />;
  if (name === 'back') return <ChevronLeftIcon size={size} color={color} />;
  if (name === 'profile') return <UserIcon size={size} color={color} />;
  if (name === 'map') return <MapIcon size={size} color={color} />;
  if (name === 'pin') return <MapPinIcon size={size} color={color} />;
  if (name === 'shield') return <ShieldIcon size={size} color={color} />;
  if (name === 'document') return <DocumentCheckIcon size={size} color={color} />;
  if (name === 'zap') return <ZapIcon size={size} color={color} />;
  if (name === 'water') return <WaterDropIcon size={size} color={color} />;
  if (name === 'share') return <ShareIcon size={size} color={color} />;
  if (name === 'whatsapp') return <WhatsAppIcon size={size} color={color} />;
  if (name === 'repeat') return <RepeatIcon size={size} color={color} />;
  if (name === 'check') return <CheckIcon size={size} color={color} />;
  if (name === 'close') return <CloseIcon size={size} color={color} />;
  if (name === 'globe') return <GlobeIcon size={size} color={color} />;

  const common = {
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'pairs' ? (
        <>
          <Rect {...common} x="3" y="4" width="12" height="15" rx="2" />
          <Rect {...common} x="9" y="7" width="12" height="14" rx="2" />
        </>
      ) : null}
      {name === 'tasks' ? (
        <>
          <Rect {...common} x="5" y="4" width="14" height="17" rx="2" />
          <Path {...common} d="M9 4V3h6v1M8.5 10h7M8.5 14h7M8.5 18h4" />
        </>
      ) : null}
      {name === 'plus' ? <Path {...common} d="M12 5v14M5 12h14" /> : null}
    </Svg>
  );
}

export function BellIcon({
  size = 20,
  color = '#111111',
  strokeWidth = 1.7,
}: {
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const common = {
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        {...common}
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
      />
      <Path {...common} d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Svg>
  );
}

export * from './roofi-icons';
