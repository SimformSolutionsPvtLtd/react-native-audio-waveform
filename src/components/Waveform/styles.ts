import { Dimensions, StyleSheet, type ScaledSize } from 'react-native';
import { Colors } from '../../theme';

const { width }: ScaledSize = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: { flexDirection: 'row' },
  scrollContainer: {
    height: '100%',
  },
  waveformContainer: {
    backgroundColor: Colors.waveContainerBackground,
    borderRadius: 10,
    height: 60,
    marginHorizontal: 10,
    maxWidth: width * 0.8,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  waveformInnerContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    height: '100%',
  },
});

export default styles;
