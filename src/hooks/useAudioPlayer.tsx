import { NativeEventEmitter, NativeModules } from 'react-native';
import { AudioWaveform } from '../audioWaveform';
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
  type ISetVolume,
  type IStartPlayer,
  type IStopPlayer,
} from '../types';

export const useAudioPlayer = () => {
  const audioPlayerEmitter = new NativeEventEmitter(
    NativeModules.AudioWaveformsEventEmitter
  );

  const extractWaveformData = (args: IExtractWaveform) => {
    return AudioWaveform.extractWaveformData(args);
  };

  const preparePlayer = (args: IPreparePlayer) => {
    return AudioWaveform.preparePlayer(args);
  };

  const playPlayer = (args: IStartPlayer) => {
    return AudioWaveform.startPlayer(args);
  };

  const pausePlayer = (args: IPausePlayer) => {
    return AudioWaveform.pausePlayer(args);
  };

  const stopPlayer = (args: IStopPlayer) => {
    return AudioWaveform.stopPlayer(args);
  };

  const seekToPlayer = (args: ISeekPlayer) => {
    return AudioWaveform.seekToPlayer(args);
  };

  const setVolume = (args: ISetVolume) => {
    return AudioWaveform.setVolume(args);
  };

  const stopAllPlayers = () => {
    return AudioWaveform.stopAllPlayers();
  };

  const getDuration = (args: IGetDuration) => AudioWaveform.getDuration(args);

  const onDidFinishPlayingAudio = (
    callback: (result: IDidFinishPlayings) => void
  ) => {
    return audioPlayerEmitter.addListener(
      NativeEvents.onDidFinishPlayingAudio,
      result => callback(result)
    );
  };

  const onCurrentDuration = (
    callback: (result: IOnCurrentDurationChange) => void
  ) => {
    return audioPlayerEmitter.addListener(
      NativeEvents.onCurrentDuration,
      result => callback(result)
    );
  };

  const onCurrentExtractedWaveformData = (
    callback: (result: IOnCurrentExtractedWaveForm) => void
  ) => {
    return audioPlayerEmitter.addListener(
      NativeEvents.onCurrentExtractedWaveformData,
      result => callback(result)
    );
  };

  const onCurrentRecordingWaveformData = (
    callback: (result: IOnCurrentRecordingWaveForm) => void
  ) => {
    return audioPlayerEmitter.addListener(
      NativeEvents.onCurrentRecordingWaveformData,
      result => callback(result)
    );
  };

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
  };
};
