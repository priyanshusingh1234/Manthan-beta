import { useAudioPlayer } from 'expo-audio';

export function useCorrectSound() {
  const player = useAudioPlayer(require('../../assets/sounds/right.mp3'));

  const play = () => {
    player.play();
  };

  return play;
}
