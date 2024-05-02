import type { LayoutRectangle } from 'react-native';

export interface IWaveformCandle {
  index: number;
  amplitude: number;
  candleWidth: number;
  candleSpace: number;
  songDuration?: number;
  noOfSamples?: number;
  currentProgress?: number;
  parentViewLayout: LayoutRectangle | null;
  waveColor?: string;
  scrubColor?: string;
  candleHeightScale: number;
}
