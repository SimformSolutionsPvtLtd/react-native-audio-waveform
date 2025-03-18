import { NativeEventEmitter, NativeModules } from 'react-native';
import { AudioWaveform } from '../AudioWaveform';
import type { IOnCurrentRecordingWaveForm, IStartRecording } from '../types';
import { NativeEvents, RecorderState } from '../constants';
import { useState } from 'react';
import { isEmpty, isNil } from 'lodash';

export const useAudioRecorder = () => {
  const [recorderState, setRecorderState] = useState(RecorderState.stopped);

  const audioPlayerEmitter = new NativeEventEmitter(
    NativeModules.AudioWaveformsEventEmitter
  );

  const startRecording = async (args?: Partial<IStartRecording>) => {
    const start = await AudioWaveform.startRecording(args);
    if (!isNil(start) && start) {
      setRecorderState(RecorderState.recording);
      return Promise.resolve(true);
    } else {
      return Promise.reject(new Error('error in start recording action'));
    }
  };

  const stopRecording = async () => {
    const data = await AudioWaveform.stopRecording();
    if (!isNil(data) && !isEmpty(data)) {
      return Promise.resolve(data);
    } else {
      return Promise.reject(
        new Error('error in stopping recording. can not get path of recording')
      );
    }
  };

  const pauseRecording = async () => {
    const pause = await AudioWaveform.pauseRecording();
    if (!isNil(pause) && pause) {
      setRecorderState(RecorderState.paused);
      return Promise.resolve(pause);
    } else {
      return Promise.reject(new Error('Error in pausing recording audio'));
    }
  };

  const resumeRecording = async () => {
    const resume = await AudioWaveform.resumeRecording();
    if (!isNil(resume)) {
      setRecorderState(RecorderState.recording);
      return Promise.resolve(resume);
    } else {
      return Promise.reject(new Error('Error in resume recording'));
    }
  };

  const getDecibel = () => AudioWaveform.getDecibel();

  const onCurrentRecordingWaveformData = (
    callback: (result: IOnCurrentRecordingWaveForm) => void
  ) =>
    audioPlayerEmitter.addListener(
      NativeEvents.onCurrentRecordingWaveformData,
      result => callback(result)
    );

  return {
    recorderState,
    getDecibel,
    pauseRecording,
    resumeRecording,
    startRecording,
    stopRecording,
    onCurrentRecordingWaveformData,
  };
};
