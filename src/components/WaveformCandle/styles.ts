import { StyleSheet } from 'react-native';
import { Colors } from '../../theme';

const styles = StyleSheet.create({
  candleContainer: { justifyContent: 'center' },
  waveformCandle: { backgroundColor: Colors.waveStickBackground },
  waveformCandleCompleted: {
    backgroundColor: Colors.waveStickCompleteBackground,
  },
});

export default styles;
