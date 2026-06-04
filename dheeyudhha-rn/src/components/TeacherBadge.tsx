import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ViewStyle, StyleProp } from 'react-native';

export default function TeacherBadge({ style, size = 16 }: { style?: StyleProp<ViewStyle>; size?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={style}
    >
      <Path
        d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"
        fill="#22c55e" /* Tailwind green-500 */
      />
      <Path
        d="M7.75 12.75L10.25 15.25L16.25 9.25"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
