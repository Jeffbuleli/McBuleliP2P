import Svg, { Circle, Path } from "react-native-svg";

type Props = { size?: number; color?: string };

export function IconShield({ size = 22, color = "currentColor" }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3 5 6.5v5.2c0 4.2 2.8 7.9 7 9.3 4.2-1.4 7-5.1 7-9.3V6.5L12 3Z"
        stroke={color}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconEye({ size = 22, color = "currentColor" }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z"
        stroke={color}
        strokeWidth="1.75"
      />
      <Circle cx="12" cy="12" r="2.5" stroke={color} strokeWidth="1.75" />
    </Svg>
  );
}

export function IconSpark({ size = 22, color = "currentColor" }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v3M12 18v3M3 12h3M18 12h3M6.2 6.2l2.1 2.1M15.7 15.7l2.1 2.1M17.8 6.2l-2.1 2.1M8.3 15.7l-2.1 2.1"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.75" />
    </Svg>
  );
}

export function IconGraduation({ size = 22, color = "currentColor" }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3 3 7.5 12 12l9-4.5L12 3Z"
        stroke={color}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <Path
        d="M6 10v4.5c0 2 3.5 3.5 6 3.5s6-1.5 6-3.5V10M21 7.5V14"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function IconUsers({ size = 22, color = "currentColor" }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="8" r="3" stroke={color} strokeWidth="1.75" />
      <Path
        d="M3.5 19c0-2.5 2.5-4 5.5-4s5.5 1.5 5.5 4M16 7.5a2.5 2.5 0 1 1 0 5M14.5 19c.3-1.8 2.2-3 4.5-3"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </Svg>
  );
}
