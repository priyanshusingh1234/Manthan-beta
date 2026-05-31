import GauntletEngine from '@/components/GauntletEngine';
import { ALL_LEVELS } from './data';

export default function NationalismInIndiaChapter() {
  return (
    <GauntletEngine 
      chapterId="nationalism-india" 
      title="Nationalism in India" 
      levels={ALL_LEVELS} 
    />
  );
}
