import type { NativeModule } from 'react-native';
import type {
  FinishMode,
  PermissionStatus,
  UpdateFrequency,
  DurationType,
} from '../constants';

interface IPlayerKey {
  playerKey: string;
}
interface IPlayerPath {
  path: string;
}

export interface IStartRecording extends IPlayerPath {
  encoder: number;
  sampleRate: number;
  bitRate: number;
  fileNameFormat: string;
  useLegacy: boolean;
  updateFrequency?: UpdateFrequency;
}

export interface IExtractWaveform extends IPlayerKey, IPlayerPath {
  noOfSamples?: number;
}

export interface IPreparePlayer extends IPlayerKey, IPlayerPath {
  updateFrequency?: UpdateFrequency;
  volume?: number;
}

export interface IStartPlayer extends IPlayerKey {
  finishMode?: FinishMode;
}

export interface IStopPlayer extends IPlayerKey {}

export interface IPausePlayer extends IPlayerKey {}

export interface ISeekPlayer extends IPlayerKey {
  progress: number;
}

export interface ISetVolume extends IPlayerKey {
  volume: number;
}

export interface IGetDuration extends IPlayerKey {
  durationType: DurationType;
}

export interface IDidFinishPlayings extends IPlayerKey {
  finishType: FinishMode;
}

export interface IOnCurrentDurationChange extends IPlayerKey {
  currentDuration: number;
}

export interface IOnCurrentExtractedWaveForm extends IPlayerKey {
  waveformData: Array<number>;
  progress: number;
}

export interface IOnCurrentRecordingWaveForm {
  currentDecibel: number;
}

export interface IAudioWaveforms extends NativeModule {
  //Permissions
  checkHasAudioReadPermission(): Promise<PermissionStatus>;
  getAudioReadPermission(): Promise<PermissionStatus>;
  checkHasAudioRecorderPermission(): Promise<PermissionStatus>;
  getAudioRecorderPermission(): Promise<PermissionStatus>;

  //Recorder
  startRecording(args?: Partial<IStartRecording>): Promise<boolean>;
  stopRecording(): Promise<Array<string>>;
  pauseRecording(): Promise<boolean>;
  resumeRecording(): Promise<boolean>;
  extractWaveformData(args: IExtractWaveform): Promise<Array<Array<number>>>;
  getDecibel(): Promise<number>;

  // Player
  preparePlayer(args: IPreparePlayer): Promise<boolean>;
  startPlayer(args: IStartPlayer): Promise<boolean>;
  pausePlayer(args: IPausePlayer): Promise<boolean>;
  stopPlayer(args: IStopPlayer): Promise<boolean>;
  seekToPlayer(args: ISeekPlayer): Promise<boolean>;
  setVolume(args: ISetVolume): Promise<boolean>;
  getDuration(args: IGetDuration): Promise<number>;
  stopAllPlayers(): Promise<boolean>;
}
