import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ViewStyle, StyleProp } from 'react-native';

export default function AdminBadge({ style, size = 18 }: { style?: StyleProp<ViewStyle>; size?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={style}
    >
      <Path
        d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z"
        fill="#1DA1F2"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.7071 8.29289C17.0976 8.68342 17.0976 9.31658 16.7071 9.70711L11.7071 14.7071C11.3166 15.0976 10.6834 15.0976 10.2929 14.7071L7.29289 11.7071C6.90237 11.3166 6.90237 10.6834 7.29289 10.2929C7.68342 9.90237 8.31658 9.90237 8.70711 10.2929L11 12.5858L15.2929 8.29289C15.6834 7.90237 16.3166 7.90237 16.7071 8.29289Z"
        fill="white"
      />
    </Svg>
  );
}
