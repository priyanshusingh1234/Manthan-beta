import { useAudioPlayer } from 'expo-audio';

export function useMessageSound() {
  const player = useAudioPlayer(require('../../assets/sounds/message_notif.mp3'));

  const play = () => {
    try {
      player.play();
    } catch (e) {
      console.log('Error playing message sound', e);
    }
  };

  return play;
}
