import type { StyleProp, ViewStyle } from 'react-native';
import type { FinishMode, PlayerState, RecorderState } from '../../constants';
import type { IStartRecording } from '../../types';

type StaticOrLive = 'static' | 'live';

export type PlaybackSpeedType = 1.0 | 1.5 | 2.0;

interface BaseWaveform {
  candleSpace?: number;
  candleWidth?: number;
  containerStyle?: StyleProp<ViewStyle>;
  waveColor?: string;
  mode: StaticOrLive;
  candleHeightScale?: number;
}

export interface StaticWaveform extends BaseWaveform {
  mode: 'static';
  path: string;
  volume?: number;
  scrubColor?: string;
  onPlayerStateChange?: (playerState: PlayerState) => void;
  onPanStateChange?: (panMoving: boolean) => void;
  onError?: (error: Error) => void;
  onCurrentProgressChange?: (
    currentProgress: number,
    songDuration: number
  ) => void;
  onChangeWaveformLoadState?: (state: boolean) => void;
  playbackSpeed?: PlaybackSpeedType;
}

export interface LiveWaveform extends BaseWaveform {
  mode: 'live';
  showsHorizontalScrollIndicator?: boolean;
  maxCandlesToRender?: number;
  onRecorderStateChange?: (recorderState: RecorderState) => void;
}

export type IWaveform = StaticWaveform | LiveWaveform;

export interface IStartPlayerRef {
  finishMode?: FinishMode;
}
export interface IWaveformRef {
  startPlayer: (args?: IStartPlayerRef) => Promise<boolean>;
  stopPlayer: () => Promise<boolean>;
  pausePlayer: () => Promise<boolean>;
  resumePlayer: (args?: IStartPlayerRef) => Promise<boolean>;
  startRecord: (args?: Partial<IStartRecording>) => Promise<boolean>;
  stopRecord: () => Promise<string>;
  pauseRecord: () => Promise<boolean>;
  resumeRecord: () => Promise<boolean>;
  currentState: PlayerState | RecorderState;
  playerKey: string;
}
