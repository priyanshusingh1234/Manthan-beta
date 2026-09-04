import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export function LeaderboardWidget({ rank = 0, points = 0 }: { rank?: number, points?: number }) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1e1b4b', // deep indigo
        borderRadius: 24,
        padding: 16,
      }}
    >
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space_between',
          width: 'match_parent',
          marginBottom: 8,
        }}
      >
        <TextWidget
          text="Dheeyudhha"
          style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: '#a5b4fc', // indigo-300
          }}
        />
        <TextWidget
          text="🏆"
          style={{
            fontSize: 20,
          }}
        />
      </FlexWidget>

      <FlexWidget
        style={{
          backgroundColor: '#312e81', // indigo-900
          borderRadius: 16,
          padding: 16,
          width: 'match_parent',
          alignItems: 'center',
        }}
      >
        <TextWidget
          text="CURRENT RANK"
          style={{
            fontSize: 10,
            fontWeight: 'bold',
            color: '#818cf8', // indigo-400
            marginBottom: 4,
          }}
        />
        <TextWidget
          text={rank > 0 ? `#${rank}` : 'Unranked'}
          style={{
            fontSize: 32,
            fontWeight: 'bold',
            color: '#ffffff',
          }}
        />
        <TextWidget
          text={`${points} XP`}
          style={{
            fontSize: 14,
            fontWeight: 'bold',
            color: '#fbbf24', // amber-400
            marginTop: 4,
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
