import { StyleSheet } from 'react-native';
import { Colors } from './theme';

/**
 * A StyleSheet object that contains all of the application's styles.
 * @param {ThemeMode} theme - The theme of the application.
 * @returns {StyleSheet} - A StyleSheet object containing all of the application's styles.
 */
const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    width: '90%',
    backgroundColor: Colors.waveContainerBackground,
    borderRadius: 8,
    alignItems: 'center',
  },
  listItemContainer: {
    marginTop: 16,
  },
  buttonImage: {
    height: 20,
    width: 20,
  },
  staticWaveformView: {
    flex: 1,
    paddingEnd: 10,
  },
  pressableButtonView: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  liveWaveformContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    borderRadius: 8,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  simformImage: {
    height: 50,
    width: 200,
  },
  liveWaveformView: {
    backgroundColor: Colors.waveContainerBackground,
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  buttonImageLive: {
    height: 28,
    width: 28,
    tintColor: Colors.simformPink,
  },
  simformImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default styles;
