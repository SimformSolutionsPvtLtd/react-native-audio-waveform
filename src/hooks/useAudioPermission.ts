import { AudioWaveform } from '../audioWaveform';

export const useAudioPermission = () => {
  const checkHasAudioRecorderPermission = () => {
    return AudioWaveform.checkHasAudioRecorderPermission();
  };

  const getAudioRecorderPermission = () => {
    return AudioWaveform.getAudioRecorderPermission();
  };

  const checkHasAudioReadPermission = () => {
    return AudioWaveform.checkHasAudioRecorderPermission();
  };

  const getAudioReadPermission = () => {
    return AudioWaveform.getAudioReadPermission();
  };

  return {
    checkHasAudioRecorderPermission,
    getAudioRecorderPermission,
    checkHasAudioReadPermission,
    getAudioReadPermission,
  };
};
