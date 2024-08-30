import React from 'react';
import { View } from 'react-native';
import { Colors } from '../../theme';
import styles from './WaveformCandleStyles';
import type { IWaveformCandle } from './WaveformCandleTypes';

export const WaveformCandle: React.FC<IWaveformCandle> = ({
  index,
  amplitude,
  parentViewLayout,
  candleWidth,
  candleSpace,
  noOfSamples = 0,
  songDuration = 1,
  currentProgress = 0,
  waveColor,
  scrubColor,
  candleHeightScale,
}) => {
  const maxHeight = (parentViewLayout?.height ?? 0) - 10;
  const completedIndex = (currentProgress / songDuration) * noOfSamples;

  const getWaveColor = () => {
    return {
      backgroundColor: waveColor ? waveColor : Colors.waveStickBackground,
    };
  };

  const getScrubColor = () => {
    return {
      backgroundColor: scrubColor
        ? scrubColor
        : Colors.waveStickCompleteBackground,
    };
  };

  return (
    <View key={index} style={styles.candleContainer}>
      <View
        style={[
          completedIndex > index ? getScrubColor() : getWaveColor(),
          {
            width: candleWidth,
            marginRight: candleSpace,
            maxHeight,
            height:
              (isNaN(amplitude) ? 0 : amplitude) *
              maxHeight *
              candleHeightScale, // Adjust the height scale as needed
            minHeight: candleWidth,
            borderRadius: candleWidth,
          },
        ]}
      />
    </View>
  );
};
