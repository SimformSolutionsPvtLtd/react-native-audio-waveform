import { AudioWaveform } from '../audioWaveform';
import type { IStartRecording } from '../types';

export const useAudioRecorder = () => {
  const startRecording = (args?: Partial<IStartRecording>) => {
    return AudioWaveform.startRecording(args);
  };

  const stopRecording = () => {
    return AudioWaveform.stopRecording();
  };

  const pauseRecording = () => {
    return AudioWaveform.pauseRecording();
  };

  const resumeRecording = () => {
    return AudioWaveform.resumeRecording();
  };

  const getDecibel = () => {
    return AudioWaveform.getDecibel();
  };

  return {
    getDecibel,
    pauseRecording,
    resumeRecording,
    startRecording,
    stopRecording,
  };
};
