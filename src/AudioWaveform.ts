import { NativeModules, Platform } from 'react-native';
import type { IAudioWaveforms } from './types';

const LINKING_ERROR =
  "The package 'react-native-audio-waveform' doesn't seem to be linked. Make sure: \n\n" +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

export const AudioWaveform: IAudioWaveforms = NativeModules.AudioWaveform
  ? NativeModules.AudioWaveform
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );
