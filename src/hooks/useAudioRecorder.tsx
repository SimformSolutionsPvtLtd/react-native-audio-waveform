import { AudioWaveform } from '../AudioWaveform';
import type { IStartRecording } from '../types';

export const useAudioRecorder = () => {
  const startRecording = (args?: Partial<IStartRecording>) =>
    AudioWaveform.startRecording(args);

  const stopRecording = () => AudioWaveform.stopRecording();

  const pauseRecording = () => AudioWaveform.pauseRecording();

  const resumeRecording = () => AudioWaveform.resumeRecording();

  const getDecibel = () => AudioWaveform.getDecibel();

  return {
    getDecibel,
    pauseRecording,
    resumeRecording,
    startRecording,
    stopRecording,
  };
};
