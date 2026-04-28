import GauntletEngine from '@/components/GauntletEngine';
import { ALL_LEVELS } from './data';

export default function NationalismInEuropeChapter() {
  return (
    <GauntletEngine 
      chapterId="nationalism-europe" 
      title="Nationalism in Europe" 
      levels={ALL_LEVELS} 
    />
  );
}
