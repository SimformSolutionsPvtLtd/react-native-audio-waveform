import type { NativeModule } from 'react-native';
import type {
  DurationType,
  FinishMode,
  PermissionStatus,
  UpdateFrequency,
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
  progress?: number;
}

export interface IStartPlayer extends IPlayerKey {
  finishMode?: FinishMode;
  speed?: number;
  path?: string;
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

export interface ISetPlaybackSpeed extends IPlayerKey {
  speed: number;
}

/**
 * Represents the interface for the AudioWaveforms module.
 */
export interface IAudioWaveforms extends NativeModule {
  // Permissions

  /**
   * Checks if the app has audio read permission.
   * @returns A promise that resolves to the permission status.
   */
  checkHasAudioReadPermission(): Promise<PermissionStatus>;

  /**
   * Requests audio read permission for the app.
   * @returns A promise that resolves to the permission status.
   */
  getAudioReadPermission(): Promise<PermissionStatus>;

  /**
   * Checks if the app has audio recorder permission.
   * @returns A promise that resolves to the permission status.
   */
  checkHasAudioRecorderPermission(): Promise<PermissionStatus>;

  /**
   * Requests audio recorder permission for the app.
   * @returns A promise that resolves to the permission status.
   */
  getAudioRecorderPermission(): Promise<PermissionStatus>;

  // Recorder

  /**
   * Starts recording audio.
   * @param args - Optional arguments for starting the recording.
   * @returns A promise that resolves to a boolean indicating if the recording started successfully.
   */
  startRecording(args?: Partial<IStartRecording>): Promise<boolean>;

  /**
   * Stops the current recording.
   * @returns A promise that resolves to an array of strings representing the recorded audio files.
   */
  stopRecording(): Promise<Array<string>>;

  /**
   * Pauses the current recording.
   * @returns A promise that resolves to a boolean indicating if the recording was paused successfully.
   */
  pauseRecording(): Promise<boolean>;

  /**
   * Resumes the paused recording.
   * @returns A promise that resolves to a boolean indicating if the recording was resumed successfully.
   */
  resumeRecording(): Promise<boolean>;

  /**
   * Extracts waveform data from the recorded audio.
   * @param args - Arguments for extracting waveform data.
   * @returns A promise that resolves to an array of arrays representing the waveform data.
   */
  extractWaveformData(args: IExtractWaveform): Promise<Array<Array<number>>>;

  /**
   * Gets the decibel level of the recorded audio.
   * @returns A promise that resolves to the decibel level.
   */
  getDecibel(): Promise<number>;

  // Player

  /**
   * Prepares the player for playback.
   * @param args - Arguments for preparing the player.
   * @returns A promise that resolves to a boolean indicating if the player was prepared successfully.
   */
  preparePlayer(args: IPreparePlayer): Promise<boolean>;

  /**
   * Starts playing the audio.
   * @param args - Arguments for starting the player.
   * @returns A promise that resolves to a boolean indicating if the playback started successfully.
   */
  startPlayer(args: IStartPlayer): Promise<boolean>;

  /**
   * Pauses the audio playback.
   * @param args - Arguments for pausing the player.
   * @returns A promise that resolves to a boolean indicating if the playback was paused successfully.
   */
  pausePlayer(args: IPausePlayer): Promise<boolean>;

  /**
   * Stops the audio playback.
   * @param args - Arguments for stopping the player.
   * @returns A promise that resolves to a boolean indicating if the playback was stopped successfully.
   */
  stopPlayer(args: IStopPlayer): Promise<boolean>;

  /**
   * Seeks to a specific position in the audio playback.
   * @param args - Arguments for seeking the player.
   * @returns A promise that resolves to a boolean indicating if the seek operation was successful.
   */
  seekToPlayer(args: ISeekPlayer): Promise<boolean>;

  /**
   * Sets the volume of the audio playback.
   * @param args - Arguments for setting the volume.
   * @returns A promise that resolves to a boolean indicating if the volume was set successfully.
   */
  setVolume(args: ISetVolume): Promise<boolean>;

  /**
   * Gets the duration of the audio playback.
   * @param args - Arguments for getting the duration.
   * @returns A promise that resolves to the duration in milliseconds.
   */
  getDuration(args: IGetDuration): Promise<number>;

  /**
   * Stops all active audio players.
   * @returns A promise that resolves to a boolean indicating if all players were stopped successfully.
   */
  stopAllPlayers(): Promise<boolean>;

  /**
   * Stops all active waveform extractors.
   * @returns A promise that resolves to a boolean indicating if all extractors were stopped successfully.
   */
  stopAllWaveFormExtractors(): Promise<boolean>;

  /**
   * Sets the playback speed of the audio.
   * @param args - The playback speed to set, where 1.0 is normal speed.
   * @returns A promise that resolves to a boolean indicating if the playback speed was set successfully.
   */
  setPlaybackSpeed(args: ISetPlaybackSpeed): Promise<boolean>;

  /**
   * Marks the player as unmounted.
   * @returns void.
   */
  markPlayerAsUnmounted(): void;
}
