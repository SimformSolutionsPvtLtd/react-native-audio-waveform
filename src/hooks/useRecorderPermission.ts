import { AudioWaveform } from '../audioWaveform';

export const useRecorderPermission = () => {
  const checkHasRecorderPermission = () => {
    return AudioWaveform.checkHasPermission();
  };

  const getAudioRecorderPermission = () => {
    return AudioWaveform.getAudioPermission();
  };
  return {
    checkHasRecorderPermission,
    getAudioRecorderPermission,
  };
};
