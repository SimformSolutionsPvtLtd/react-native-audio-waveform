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

export const useAudioPlayer = () => {
  const audioPlayerEmitter = new NativeEventEmitter(
    NativeModules.AudioWaveformsEventEmitter
  );

  const extractWaveformData = (args: IExtractWaveform) =>
    AudioWaveform.extractWaveformData(args);

  const preparePlayer = (args: IPreparePlayer) =>
    AudioWaveform.preparePlayer(args);

  const playPlayer = (args: IStartPlayer) => AudioWaveform.startPlayer(args);

  const pausePlayer = (args: IPausePlayer) => AudioWaveform.pausePlayer(args);

  const stopPlayer = (args: IStopPlayer) => AudioWaveform.stopPlayer(args);

  const seekToPlayer = (args: ISeekPlayer) => AudioWaveform.seekToPlayer(args);

  const setVolume = (args: ISetVolume) => AudioWaveform.setVolume(args);

  const stopAllPlayers = () => AudioWaveform.stopAllPlayers();

  const stopAllWaveFormExtractors = () =>
    AudioWaveform.stopAllWaveFormExtractors();

  const stopPlayersAndExtractors = () =>
    Promise.all([stopAllPlayers(), stopAllWaveFormExtractors()]);

  const getDuration = (args: IGetDuration) => AudioWaveform.getDuration(args);

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
    AudioWaveform.setPlaybackSpeed(args);

  const markPlayerAsUnmounted = () => {
    AudioWaveform.markPlayerAsUnmounted();
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
    setPlaybackSpeed,
    markPlayerAsUnmounted,
    stopAllWaveFormExtractors,
    stopPlayersAndExtractors,
  };
};
