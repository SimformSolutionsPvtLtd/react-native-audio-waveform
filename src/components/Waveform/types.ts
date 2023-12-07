import type { Ref } from 'react';
import type { ViewStyle } from 'react-native';
import type { FinishMode, PlayerState, RecorderState } from '../../constants';
import type { IStartRecording } from '../../types';

export type StaticOrLive = 'static' | 'live';

interface BaseWaveform {
  candleSpace?: number;
  candleWidth?: number;
  containerStyle?: ViewStyle;
  waveColor?: string;
  mode: StaticOrLive;
}

export interface StaticWaveform extends BaseWaveform {
  mode: 'static';
  path: string;
  scrubColor?: string;
  onPlayerStateChange?: (playerState: PlayerState) => void;
  onPanStateChange?: (panMoving: boolean) => void;
}

export interface LiveWaveform extends BaseWaveform {
  mode: 'live';
  onRecorderStateChange?: (recorderState: RecorderState) => void;
}

export type IWaveform<T extends StaticOrLive> = T extends 'static'
  ? StaticWaveform
  : LiveWaveform;

export interface IStartPlayerRef {
  finishMode?: FinishMode;
}
export interface IPlayWaveformRef {
  startPlayer: (args?: IStartPlayerRef) => Promise<boolean>;
  stopPlayer: () => Promise<boolean>;
  pausePlayer: () => Promise<boolean>;
  resumePlayer: (args?: IStartPlayerRef) => Promise<boolean>;
}

export interface IRecordWaveformRef {
  startRecord: (args?: Partial<IStartRecording>) => Promise<boolean>;
  stopRecord: () => Promise<string>;
  pauseRecord: () => Promise<boolean>;
  resumeRecord: () => Promise<boolean>;
}

export type WaveformRefProps<T extends StaticOrLive> = T extends 'static'
  ? IPlayWaveformRef
  : IRecordWaveformRef;

export type WaveformWithStandardRef<T extends StaticOrLive> = IWaveform<T> & {
  ref: Ref<WaveformRefProps<T>>;
};
