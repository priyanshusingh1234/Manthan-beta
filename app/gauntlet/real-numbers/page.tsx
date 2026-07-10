import GauntletEngine from '@/components/GauntletEngine';
import { ALL_LEVELS } from './data';

export default function RealNumbersChapter() {
  return (
    <GauntletEngine 
      chapterId="real-numbers" 
      title="Real Numbers" 
      levels={ALL_LEVELS} 
    />
  );
}
