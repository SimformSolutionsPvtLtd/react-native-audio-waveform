import { AudioWaveform } from '../AudioWaveform';

export const useAudioPermission = () => {
  const checkHasAudioRecorderPermission = () =>
    AudioWaveform.checkHasAudioRecorderPermission();

  const getAudioRecorderPermission = () =>
    AudioWaveform.getAudioRecorderPermission();

  const checkHasAudioReadPermission = () =>
    AudioWaveform.checkHasAudioReadPermission();

  const getAudioReadPermission = () => AudioWaveform.getAudioReadPermission();

  return {
    checkHasAudioRecorderPermission,
    getAudioRecorderPermission,
    checkHasAudioReadPermission,
    getAudioReadPermission,
  };
};
