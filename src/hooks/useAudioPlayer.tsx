import { NativeEventEmitter, NativeModules } from 'react-native';
import { AudioWaveform } from '../AudioWaveform';
import { NativeEvents } from '../constants';
import {
  type IDidFinishPlayings,
  type IExtractWaveform,
  type IGetDuration,
  type IOnCurrentDurationChange,
  type IOnCurrentExtractedWaveForm,
  type IOnCurrentRecordingWaveForm,
  type IPausePlayer,
  type IPreparePlayer,
  type ISeekPlayer,
  type ISetPlaybackSpeed,
  type ISetVolume,
  type IStartPlayer,
  type IStopPlayer,
} from '../types';

let nbOfPromises = 0;

const logPromise = async (promise: any, promiseName: string) => {
  try {
    nbOfPromises++;
    console.log(`Promise ${promiseName} has been called`);
    return await promise();
  } finally {
    nbOfPromises--;
    console.log(`Promise ${promiseName} has finished`);
    console.log(`Number of promises remaining: ${nbOfPromises}`);
  }
};

export const useAudioPlayer = () => {
  const audioPlayerEmitter = new NativeEventEmitter(
    NativeModules.AudioWaveformsEventEmitter
  );

  const extractWaveformData = (args: IExtractWaveform): Promise<number[][]> =>
    logPromise(() => AudioWaveform.extractWaveformData(args), 'extractor');

  const preparePlayer = (args: IPreparePlayer) =>
    logPromise(() => AudioWaveform.preparePlayer(args), 'preparePlayer');

  const playPlayer = (args: IStartPlayer) =>
    logPromise(() => AudioWaveform.startPlayer(args), 'playPlayer');

  const pausePlayer = (args: IPausePlayer) =>
    logPromise(() => AudioWaveform.pausePlayer(args), 'pausePlayer');

  const stopPlayer = (args: IStopPlayer) =>
    logPromise(() => AudioWaveform.stopPlayer(args), 'stopPlayer');

  const seekToPlayer = (args: ISeekPlayer) =>
    logPromise(() => AudioWaveform.seekToPlayer(args), 'seekToPlayer');

  const setVolume = (args: ISetVolume) =>
    logPromise(() => AudioWaveform.setVolume(args), 'setVolume');

  const stopAllPlayers = () =>
    logPromise(AudioWaveform.stopAllPlayers, 'stopAllPlayers');

  const getDuration = (args: IGetDuration) =>
    logPromise(() => AudioWaveform.getDuration(args), 'getDuration');

  const onDidFinishPlayingAudio = (
    callback: (result: IDidFinishPlayings) => void
  ) =>
    audioPlayerEmitter.addListener(
      NativeEvents.onDidFinishPlayingAudio,
      result => callback(result)
    );

  const onCurrentDuration = (
    callback: (result: IOnCurrentDurationChange) => void
  ) =>
    audioPlayerEmitter.addListener(NativeEvents.onCurrentDuration, result =>
      callback(result)
    );

  const onCurrentExtractedWaveformData = (
    callback: (result: IOnCurrentExtractedWaveForm) => void
  ) =>
    audioPlayerEmitter.addListener(
      NativeEvents.onCurrentExtractedWaveformData,
      result => callback(result)
    );

  const onCurrentRecordingWaveformData = (
    callback: (result: IOnCurrentRecordingWaveForm) => void
  ) =>
    audioPlayerEmitter.addListener(
      NativeEvents.onCurrentRecordingWaveformData,
      result => callback(result)
    );

  const setPlaybackSpeed = (args: ISetPlaybackSpeed) =>
    logPromise(() => AudioWaveform.setPlaybackSpeed(args), 'setPlaybackSpeed');

  const markPlayerAsUnmounted = () =>
    logPromise(AudioWaveform.markPlayerAsUnmounted, 'markPlayerAsUnmounted');

  return {
    extractWaveformData,
    pausePlayer,
    playPlayer,
    preparePlayer,
    seekToPlayer,
    setVolume,
    stopAllPlayers,
    stopPlayer,
    onDidFinishPlayingAudio,
    onCurrentDuration,
    onCurrentExtractedWaveformData,
    getDuration,
    onCurrentRecordingWaveformData,
    setPlaybackSpeed,
    markPlayerAsUnmounted,
  };
};
