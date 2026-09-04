import React from 'react';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { LeaderboardWidget } from './LeaderboardWidget';
import { supabase } from '@/lib/supabaseClient';

export async function widgetTaskHandler(props: any) {
  const widgetInfo = props.widgetInfo;
  
  let rank = 0;
  let points = 0;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      // Fetch user profile stats
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_score, rank')
        .eq('id', session.user.id)
        .single();
        
      if (profile) {
        points = profile.total_score || 0;
        rank = profile.rank || 0;
      }
    }
  } catch (e) {
    console.error('Error fetching data for widget', e);
  }

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      requestWidgetUpdate({
        widgetName: 'Leaderboard',
        renderWidget: () => <LeaderboardWidget rank={rank} points={points} />,
        widgetInfo,
      });
      break;

    case 'WIDGET_CLICK':
      // Open the app when clicked
      break;

    default:
      break;
  }
}
