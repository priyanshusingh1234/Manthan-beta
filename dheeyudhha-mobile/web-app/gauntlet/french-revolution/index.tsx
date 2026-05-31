import GauntletEngine from '@/components/GauntletEngine';
import { ALL_LEVELS } from './data';

export default function FrenchRevolutionChapter() {
  return (
    <GauntletEngine 
      chapterId="french-revolution" 
      title="The French Revolution" 
      levels={ALL_LEVELS} 
    />
  );
}
