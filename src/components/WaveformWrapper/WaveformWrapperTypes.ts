import type { ScrollView } from 'react-native';
import type { StaticOrLive } from '../Waveform';

export interface WaveformWrapperProps {
  waveformMode: StaticOrLive;
  children: React.ReactNode;
  scrollRef: React.RefObject<ScrollView>;
}
