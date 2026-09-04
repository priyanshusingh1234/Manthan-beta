import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from './src/widget/widgetTaskHandler';

registerWidgetTaskHandler(widgetTaskHandler);

import './src/lib/backgroundTask';
import 'expo-router/entry';
