
import { Text, TextProps } from './Themed';

export function MonoText(props: TextProps) {
  return <Text style={[props.style, { fontFamily: 'SpaceMono' }]} />;
}
