import { AudioWaveform } from '../AudioWaveform';
import type { IStartRecording } from '../types';
import { isNil } from 'lodash';

export interface IStoppedAudioRecordingData {
  path: string;
  duration: string;
}

export const useAudioRecorder = () => {
  const startRecording = (args?: Partial<IStartRecording>) =>
    AudioWaveform.startRecording(args);

  const stopRecording = async (): Promise<IStoppedAudioRecordingData> => {
    const pathAndDurationArray = await AudioWaveform.stopRecording();
    const path = pathAndDurationArray[0];
    const duration = pathAndDurationArray[1];
    if (!!path && !!duration) {
      return { path, duration };
    }
    throw new Error(
      `Stop recoding error: Invalid path [${path}] and/or duration [${duration}]`
    );
  };

  const pauseRecording = async () => {
    const paused = await AudioWaveform.pauseRecording();

    if (!isNil(paused))
      throw new Error('Pause recording error: paused is null or undefined');

    return paused;
  };

  const resumeRecording = async () => {
    const resumed = await AudioWaveform.resumeRecording();

    if (isNil(resumed))
      throw new Error('Resume recording error: resumed is null or undefined');

    return resumed;
  };

  const getDecibel = () => AudioWaveform.getDecibel();

  return {
    getDecibel,
    pauseRecording,
    resumeRecording,
    startRecording,
    stopRecording,
  };
};
