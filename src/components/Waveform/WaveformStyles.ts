import { StyleSheet } from 'react-native';
import { Colors } from '../../theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: { flexDirection: 'row' },
  scrollContainer: {
    height: '100%',
  },
  waveformContainer: {
    backgroundColor: Colors.transparent,
    height: 60,
    paddingVertical: 2,
  },
  waveformInnerContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    height: '100%',
  },
});

export default styles;
