import React from 'react';
import Svg, {
  Path,
  Circle,
  Rect,
  SvgProps,
} from 'react-native-svg';

export type IconVariant = 'outline' | 'duotone' | 'glass';

export interface MobileIconProps extends SvgProps {
  size?: number;
  color?: string;
  variant?: IconVariant;
  filled?: boolean;
}

// 1. Home Icon matching Roofi mock
export function HomeIcon({
  size = 22,
  color = '#FFFFFF',
  variant = 'outline',
  ...props
}: MobileIconProps) {
  if (variant === 'duotone') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
        <Path
          d="M4 10.2C3.38 10.74 3 11.53 3 12.35V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V12.35C21 11.53 20.62 10.74 20 10.2L13.2 4.2C12.52 3.6 11.48 3.6 10.8 4.2L4 10.2Z"
          fill="#FF6A2B"
          fillOpacity={0.25}
          stroke={color}
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path d="M10 14.5V18.5M14 14.5V18.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M4 10.2C3.38 10.74 3 11.53 3 12.35V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V12.35C21 11.53 20.62 10.74 20 10.2L13.2 4.2C12.52 3.6 11.48 3.6 10.8 4.2L4 10.2Z"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M10 14.5V18.5M14 14.5V18.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

// 2. Grid Icon (Explore 2x2 rounded squares)
export function GridIcon({
  size = 21,
  color = '#FFFFFF',
  variant = 'outline',
  ...props
}: MobileIconProps) {
  if (variant === 'duotone') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
        <Rect x="3.5" y="3.5" width="7" height="7" rx="2.5" fill="#FF6A2B" fillOpacity={0.25} stroke={color} strokeWidth={1.9} />
        <Rect x="13.5" y="3.5" width="7" height="7" rx="2.5" fill="#FF6A2B" fillOpacity={0.25} stroke={color} strokeWidth={1.9} />
        <Rect x="13.5" y="13.5" width="7" height="7" rx="2.5" fill="#FF6A2B" fillOpacity={0.25} stroke={color} strokeWidth={1.9} />
        <Rect x="3.5" y="13.5" width="7" height="7" rx="2.5" fill="#FF6A2B" fillOpacity={0.25} stroke={color} strokeWidth={1.9} />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Rect x="3.5" y="3.5" width="7" height="7" rx="2.5" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="13.5" y="3.5" width="7" height="7" rx="2.5" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="13.5" y="13.5" width="7" height="7" rx="2.5" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="3.5" y="13.5" width="7" height="7" rx="2.5" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// 3. Bookmark / Save Icon
export function BookmarkIcon({
  size = 21,
  color = '#FFFFFF',
  variant = 'outline',
  filled = false,
  ...props
}: MobileIconProps) {
  if (filled) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
        <Path
          d="M6 3.5C5.17 3.5 4.5 4.17 4.5 5V21L12 16.5L19.5 21V5C19.5 4.17 18.83 3.5 18 3.5H6Z"
          fill="#FF6A2B"
          stroke="#FF6A2B"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  if (variant === 'duotone') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
        <Path
          d="M6 3.5C5.17 3.5 4.5 4.17 4.5 5V21L12 16.5L19.5 21V5C19.5 4.17 18.83 3.5 18 3.5H6Z"
          fill="#FF6A2B"
          fillOpacity={0.2}
          stroke={color}
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M6 3.5C5.17 3.5 4.5 4.17 4.5 5V21L12 16.5L19.5 21V5C19.5 4.17 18.83 3.5 18 3.5H6Z"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 4. Chat Icon
export function ChatIcon({
  size = 22,
  color = '#111111',
  variant = 'outline',
  ...props
}: MobileIconProps) {
  if (variant === 'duotone') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
        <Path
          d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0034 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z"
          fill="#FF6A2B"
          fillOpacity={0.2}
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0034 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 5. User Icon
export function UserIcon({
  size = 22,
  color = '#111111',
  variant = 'outline',
  ...props
}: MobileIconProps) {
  if (variant === 'duotone') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
        <Circle cx="12" cy="7" r="4" fill="#FF6A2B" fillOpacity={0.2} stroke={color} strokeWidth={1.8} />
        <Path
          d="M20 21C20 16.5817 16.4183 13 12 13C7.58172 13 4 16.5817 4 21"
          fill="#FF6A2B"
          fillOpacity={0.1}
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 6. Search Icon
export function SearchIcon({
  size = 18,
  color = '#111111',
  variant = 'outline',
  ...props
}: MobileIconProps) {
  if (variant === 'duotone') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
        <Circle cx="11" cy="11" r="7" fill="#FF6A2B" fillOpacity={0.18} />
        <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M20 20L16 16" stroke="#FF6A2B" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20 20L16 16" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// 7. Filter Icon
export function FilterIcon({
  size = 18,
  color = '#111111',
  variant = 'outline',
  ...props
}: MobileIconProps) {
  if (variant === 'duotone') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
        <Circle cx="8" cy="7" r="3" fill="#FF6A2B" fillOpacity={0.25} stroke={color} strokeWidth={1.8} />
        <Circle cx="16" cy="17" r="3" fill="#FF6A2B" fillOpacity={0.25} stroke={color} strokeWidth={1.8} />
        <Path d="M3 7H5M11 7H21M3 17H13M19 17H21" stroke={color} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M4 21V14M4 10V3M12 21V12M12 8V3M20 21V16M20 12V3M1 14H7M9 8H15M17 16H23"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 8. Bed Icon
export function BedIcon({
  size = 18,
  color = '#111111',
  variant = 'outline',
  ...props
}: MobileIconProps) {
  if (variant === 'duotone') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
        <Path d="M4 11H20V17H4V11Z" fill="#FF6A2B" fillOpacity={0.2} stroke={color} strokeWidth={1.8} />
        <Path d="M2 19V5M22 19V11M2 11H20" stroke={color} strokeWidth={2} strokeLinecap="round" />
        <Circle cx="7" cy="8" r="2" fill="#FF6A2B" fillOpacity={0.3} stroke={color} strokeWidth={1.5} />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M2 19V5M22 19V11M2 11H22M4 11V8C4 6.89543 4.89543 6 6 6H10C11.1046 6 12 6.89543 12 8V11"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 9. Bath Icon
export function BathIcon({
  size = 18,
  color = '#111111',
  variant = 'outline',
  ...props
}: MobileIconProps) {
  if (variant === 'duotone') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
        <Path
          d="M4 12H20C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12Z"
          fill="#1FB26B"
          fillOpacity={0.2}
          stroke={color}
          strokeWidth={1.8}
        />
        <Path d="M6 12V6C6 4.89543 6.89543 4 8 4H9M5 22L6 20M19 22L18 20" stroke={color} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M4 12H20C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12ZM6 12V6C6 4.89543 6.89543 4 8 4H9M5 22L6 20M19 22L18 20"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 10. Cube 3D Icon
export function Cube3DIcon({
  size = 18,
  color = '#111111',
  variant = 'duotone',
  ...props
}: MobileIconProps) {
  if (variant === 'duotone') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
        <Path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#FF6A2B" fillOpacity={0.3} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path d="M12 2L2 7L12 12L22 7L12 2ZM2 17L12 22L22 17M2 12L12 17L22 12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// 11. Verified Check Icon (Twitter-style badge)
export function VerifiedCheckIcon({
  size = 16,
  ...props
}: MobileIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
        fill="#FF6A2B"
      />
      <Path
        d="M8.5 12L10.5 14L15.5 9"
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 12. Zap / Featured / Power Icon
export function ZapIcon({
  size = 18,
  color = '#111111',
  variant = 'outline',
  ...props
}: MobileIconProps) {
  if (variant === 'duotone') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
        <Path
          d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
          fill="#FF6A2B"
          fillOpacity={0.2}
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 13. Sign Out Icon
export function SignOutIcon({
  size = 22,
  color = '#DC2626',
  ...props
}: MobileIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 17L20 13L16 9"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 13H9"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 14. Phone Call Icon
export function PhoneIcon({
  size = 16,
  color = '#111111',
  variant = 'duotone',
  ...props
}: MobileIconProps) {
  if (variant === 'duotone') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
        <Path
          d="M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.69 14.9 16.08 14.82 16.43 14.93C17.55 15.3 18.75 15.5 20 15.5C20.55 15.5 21 15.95 21 16.5V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z"
          fill="#111111"
          fillOpacity={0.15}
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4741 21.8325 20.7294C21.7209 20.9846 21.5573 21.2137 21.3521 21.4019C21.1468 21.5901 20.9046 21.733 20.6407 21.8213C20.3769 21.9097 20.0974 21.9415 19.82 21.914C16.7428 21.5799 13.787 20.5273 11.19 18.84C8.77382 17.2932 6.70677 15.2262 5.16 12.81C3.46671 10.2014 2.41378 7.23126 2.08 4.14C2.05272 3.86345 2.08412 3.58474 2.17215 3.32152C2.26019 3.05831 2.40286 2.81662 2.59055 2.61176C2.77824 2.4069 3.00673 2.2435 3.26124 2.13198C3.51574 2.02047 3.79044 1.96342 4.068 1.964H7.07C7.56837 1.95914 8.05051 2.14081 8.41999 2.47271C8.78947 2.80461 9.02011 3.26477 9.066 3.761C9.15174 4.68962 9.37894 5.59994 9.74 6.463C9.88725 6.81223 9.92556 7.19815 9.85047 7.56816C9.77538 7.93816 9.58988 8.27581 9.32 8.535L8.05 9.805C9.47959 12.3188 11.6812 14.5204 14.195 15.95L15.465 14.68C15.7242 14.4101 16.0618 14.2246 16.4318 14.1495C16.8018 14.0744 17.1878 14.1127 17.537 14.26C18.4001 14.6211 19.3104 14.8483 20.239 14.934C20.7396 14.9804 21.2033 15.2144 21.5367 15.5888C21.8701 15.9633 22.0494 16.4518 22.04 16.953L22 16.92Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 14. WhatsApp Icon
export function WhatsAppIcon({
  size = 16,
  color = '#25D366',
  ...props
}: MobileIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.04 14.69 2 12.04 2Z"
        fill={color}
      />
      <Path
        d="M17.5 14.33C17.2 14.18 15.72 13.45 15.44 13.35C15.17 13.25 14.97 13.2 14.77 13.5C14.57 13.8 14 14.51 13.82 14.71C13.65 14.92 13.47 14.94 13.17 14.79C12.87 14.64 11.9 14.32 10.75 13.29C9.85 12.49 9.24 11.5 9.07 11.2C8.89 10.9 9.05 10.74 9.2 10.59C9.33 10.46 9.5 10.24 9.65 10.06C9.8 9.88 9.85 9.75 9.95 9.55C10.05 9.35 10 9.17 9.92 9.02C9.85 8.87 9.25 7.4 9 6.8C8.75 6.22 8.5 6.3 8.32 6.29L7.75 6.28C7.55 6.28 7.23 6.35 6.95 6.65C6.68 6.95 5.9 7.68 5.9 9.15C5.9 10.62 6.98 12.04 7.13 12.24C7.28 12.44 9.23 15.44 12.23 16.73C12.94 17.04 13.5 17.23 13.93 17.37C14.65 17.6 15.31 17.57 15.82 17.49C16.4 17.4 17.59 16.77 17.84 16.07C18.09 15.37 18.09 14.77 18.01 14.64C17.94 14.52 17.8 14.47 17.5 14.33Z"
        fill="white"
      />
    </Svg>
  );
}

// 15. Share Icon
export function ShareIcon({
  size = 18,
  color = '#111111',
  ...props
}: MobileIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Circle cx="18" cy="5" r="3" stroke={color} strokeWidth={2} />
      <Circle cx="6" cy="12" r="3" stroke={color} strokeWidth={2} />
      <Circle cx="18" cy="19" r="3" stroke={color} strokeWidth={2} />
      <Path d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

// 16. Chevron Left Icon (Back)
export function ChevronLeftIcon({
  size = 20,
  color = '#111111',
  ...props
}: MobileIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M15 18L9 12L15 6"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 17. Close Icon (X)
export function CloseIcon({
  size = 18,
  color = '#111111',
  ...props
}: MobileIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M18 6L6 18M6 6L18 18"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 18. Water Drop Icon
export function WaterDropIcon({
  size = 18,
  color = '#111111',
  ...props
}: MobileIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M12 2.69L6.69 8.6C4.46 11.08 4.46 14.88 6.69 17.36C8.92 19.84 12.54 19.84 14.77 17.36C17 14.88 17 11.08 14.77 8.6L12 2.69Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 19. Gate Icon (Walled & Gated compound)
export function GateIcon({
  size = 18,
  color = '#111111',
  ...props
}: MobileIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M4 21V4C4 3.45 4.45 3 5 3H7M20 21V4C20 3.45 19.55 3 19 3H17M4 7H20M4 17H20M7 3V21M11 7V17M13 7V17M17 3V21"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 20. Shield Icon (Safety & Verification)
export function ShieldIcon({
  size = 18,
  color = '#111111',
  ...props
}: MobileIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 12L11 14L15 10"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 21. Kitchen Icon
export function KitchenIcon({
  size = 18,
  color = '#111111',
  ...props
}: MobileIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M3 11H21M5 11V18C5 19.1 5.9 20 7 20H17C18.1 20 19 19.1 19 18V11M8 11V7C8 5.9 8.9 5 10 5H14C15.1 5 16 5.9 16 7V11M10 5V3M14 5V3"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 22. Map Pin Icon
export function MapPinIcon({
  size = 14,
  color = '#111111',
  ...props
}: MobileIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M21 10C21 15.5 12 22 12 22C12 22 3 15.5 3 10C3 5.58 7.03 2 12 2C16.97 2 21 5.58 21 10Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="10" r="3" fill={color} />
    </Svg>
  );
}

// 22b. Map Icon
export function MapIcon({
  size = 22,
  color = '#111111',
  ...props
}: MobileIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M9 18L3 21V6L9 3M9 18L15 21M9 18V3M15 21L21 18V3L15 6M15 21V6M15 6L9 3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 23. Chevron Down Icon
export function ChevronDownIcon({
  size = 16,
  color = '#111111',
  ...props
}: MobileIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M6 9L12 15L18 9"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 24. Calendar Icon (Advance Calculation)
export function CalendarIcon({
  size = 18,
  color = '#111111',
  ...props
}: MobileIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth={1.8} />
      <Path d="M16 2V6M8 2V6M3 10H21" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

// 24. Document / Deed Check Icon
export function DocumentCheckIcon({
  size = 14,
  color = '#1FB26B',
  ...props
}: MobileIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2V8H20" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 15L11 17L15 13" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function FlagIcon({
  size = 20,
  color = '#71717A',
  ...props
}: MobileIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M4 15C4 15 5 14 8 14C11 14 13 16 16 16C19 16 20 15 20 15V3C20 3 19 4 16 4C13 4 11 2 8 2C5 2 4 3 4 3V22"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function InboxIcon({ size = 22, color = '#111111', ...props }: MobileIconProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M4 4H20L22 15V20H2V15L4 4Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    <Path d="M2 15H7L9 18H15L17 15H22" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
  </Svg>;
}

export function ChartIcon({ size = 22, color = '#111111', ...props }: MobileIconProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M4 20V12M10 20V4M16 20V9M22 20H2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>;
}

export function EditIcon({ size = 18, color = '#111111', ...props }: MobileIconProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M12 20H21M16.5 3.5L20.5 7.5L8 20H4V16L16.5 3.5Z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>;
}

export function ChevronRightIcon({ size = 18, color = '#71717A', ...props }: MobileIconProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M9 18L15 12L9 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>;
}

export function ClockIcon({ size = 14, color = '#92400E', ...props }: MobileIconProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={2} />
    <Path d="M12 7V12L15 14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>;
}

export function EyeIcon({ size = 20, color = '#111111', ...props }: MobileIconProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M2 12S5.5 5 12 5S22 12 22 12S18.5 19 12 19S2 12 2 12Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={1.8} />
  </Svg>;
}

export function CameraIcon({ size = 22, color = '#111111', ...props }: MobileIconProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M4 7H7L9 4H15L17 7H20C21.1 7 22 7.9 22 9V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V9C2 7.9 2.9 7 4 7Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    <Circle cx="12" cy="13" r="3.5" stroke={color} strokeWidth={1.8} />
  </Svg>;
}

export function SettingsIcon({ size = 22, color = '#111111', ...props }: MobileIconProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M12 8.5A3.5 3.5 0 1 0 12 15.5A3.5 3.5 0 0 0 12 8.5Z" stroke={color} strokeWidth={1.8} />
    <Path d="M19.4 15A1.7 1.7 0 0 0 19.7 17.1L19.8 17.2L17.2 19.8L17.1 19.7A1.7 1.7 0 0 0 15 19.4A1.7 1.7 0 0 0 14 21V21.2H10V21A1.7 1.7 0 0 0 9 19.4A1.7 1.7 0 0 0 6.9 19.7L6.8 19.8L4.2 17.2L4.3 17.1A1.7 1.7 0 0 0 4.6 15A1.7 1.7 0 0 0 3 14H2.8V10H3A1.7 1.7 0 0 0 4.6 9A1.7 1.7 0 0 0 4.3 6.9L4.2 6.8L6.8 4.2L6.9 4.3A1.7 1.7 0 0 0 9 4.6A1.7 1.7 0 0 0 10 3V2.8H14V3A1.7 1.7 0 0 0 15 4.6A1.7 1.7 0 0 0 17.1 4.3L17.2 4.2L19.8 6.8L19.7 6.9A1.7 1.7 0 0 0 19.4 9A1.7 1.7 0 0 0 21 10H21.2V14H21A1.7 1.7 0 0 0 19.4 15Z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
  </Svg>;
}

export function VideoIcon({ size = 22, color = '#111111', ...props }: MobileIconProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Rect x="3" y="5" width="13" height="14" rx="2" stroke={color} strokeWidth={1.8} />
    <Path d="M16 10L21 7V17L16 14V10Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
  </Svg>;
}

export function RepeatIcon({ size = 22, color = '#111111', ...props }: MobileIconProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M17 2L21 6L17 10M3 11V9C3 7.34 4.34 6 6 6H21M7 22L3 18L7 14M21 13V15C21 16.66 19.66 18 18 18H3" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>;
}

export function TagIcon({ size = 22, color = '#111111', ...props }: MobileIconProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M20.59 13.41L13.42 20.58A2 2 0 0 1 10.59 20.58L3.42 13.41A2 2 0 0 1 2.83 12V4A2 2 0 0 1 4.83 2H12A2 2 0 0 1 13.41 2.59L20.59 9.76A2.58 2.58 0 0 1 20.59 13.41Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    <Circle cx="7.5" cy="7.5" r="1.25" stroke={color} strokeWidth={1.5} />
  </Svg>;
}

export function PaperclipIcon({ size = 20, color = '#111111', ...props }: MobileIconProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M8 12.5L14.5 6A4 4 0 0 1 20.16 11.66L11.18 20.64A6 6 0 0 1 2.7 12.16L12.39 2.47" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M7.5 13L15 5.5" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
  </Svg>;
}

export function SendIcon({ size = 20, color = '#111111', ...props }: MobileIconProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M21.5 2.5L14 21.5L10 13L2.5 9L21.5 2.5Z" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M21.5 2.5L10 13" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>;
}

// 16. Trash Icon
export function TrashIcon({
  size = 20,
  color = '#DC2626',
  ...props
}: MobileIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M3 6H5H21"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 17. Moon Icon (Dark Mode)
export function MoonIcon({
  size = 20,
  color = '#111827',
  ...props
}: MobileIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 18. Key Icon (Passkey)
export function KeyIcon({
  size = 20,
  color = '#111827',
  ...props
}: MobileIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 19. Globe Icon (Legal)
export function GlobeIcon({
  size = 20,
  color = '#111827',
  ...props
}: MobileIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
      <Path d="M2 12h20" stroke={color} strokeWidth={2} />
      <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

// 20. Users / Occupancy Icon
export function UsersIcon({
  size = 20,
  color = '#111827',
  ...props
}: MobileIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth={1.9} />
      <Path
        d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 21. Snowflake / AC Icon
export function SnowflakeIcon({
  size = 20,
  color = '#111827',
  ...props
}: MobileIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
      <Path d="M12 6l2-2m-2 2L10 4m2 14l2 2m-2-2l-2 2M6 12l-2 2m2-2L4 10m14 2l2 2m-2-2l2-2" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
    </Svg>
  );
}

// 22. Graduation Cap / Student Icon
export function GraduationCapIcon({
  size = 20,
  color = '#111827',
  ...props
}: MobileIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M22 10v6M2 10l10-5 10 5-10 5z"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}// 23. Lightbulb / Tip Icon
export function LightbulbIcon({
  size = 20,
  color = '#111827',
  ...props
}: MobileIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4.9 11.9c.7.7 1.1 1.6 1.3 2.6h7.2c.2-1 .6-1.9 1.3-2.6A7 7 0 0 0 12 2z"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 24. Check Icon
export function CheckIcon({
  size = 18,
  color = '#FFFFFF',
  ...props
}: MobileIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M20 6L9 17L4 12"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 25. Lock Icon
export function LockIcon({
  size = 20,
  color = '#111111',
  ...props
}: MobileIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// 26. Heart Icon
export function HeartIcon({
  size = 20,
  color = '#111111',
  ...props
}: MobileIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 27. Play Icon
export function PlayIcon({
  size = 12,
  color = '#FFFFFF',
  ...props
}: MobileIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} {...props}>
      <Path d="M6 4l15 8-15 8V4z" />
    </Svg>
  );
}

// 28. MultiPhoto Icon
export function MultiPhotoIcon({
  size = 16,
  color = '#FFFFFF',
  ...props
}: MobileIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Rect x="7" y="7" width="13" height="13" rx="2.5" fill={color} />
      <Path
        d="M4 17V5a2 2 0 0 1 2-2h12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// 29. FeedTabGridIcon (3-bar grid with dropdown arrow)
export function FeedTabGridIcon({
  size = 22,
  color = '#111111',
  ...props
}: MobileIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Rect x="4" y="5" width="2.8" height="14" rx="1.2" fill={color} />
      <Rect x="9.6" y="5" width="2.8" height="14" rx="1.2" fill={color} />
      <Rect x="15.2" y="5" width="2.8" height="8.5" rx="1.2" fill={color} />
      <Path d="M14.8 16.5l3.2 4 3.2-4h-6.4z" fill={color} />
    </Svg>
  );
}

// 30. ArchiveBoxIcon
export function ArchiveBoxIcon({
  size = 16,
  color = '#FFFFFF',
  ...props
}: MobileIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <Path d="M21 8v13H3V8" />
      <Path d="M1 3h22v5H1z" />
      <Path d="M10 12h4" />
    </Svg>
  );
}


