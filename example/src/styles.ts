import { StyleSheet } from 'react-native';
import { Colors, scale } from './theme';

export type StyleSheetParams =
  | Partial<{
      currentUser: boolean;
      top: number;
      bottom: number;
    }>
  | undefined;

/**
 * A StyleSheet object that contains all of the application's styles.
 * @param {ThemeMode} theme - The theme of the application.
 * @returns {StyleSheet} - A StyleSheet object containing all of the application's styles.
 */
const styles = (params: StyleSheetParams = {}) =>
  StyleSheet.create({
    appContainer: {
      flex: 1,
    },
    screenBackground: {
      flex: 1,
      paddingBottom: params.bottom,
    },
    container: {
      flex: 1,
      paddingTop: params.top,
      paddingHorizontal: scale(16),
      marginBottom: scale(24),
    },
    buttonContainer: {
      flexDirection: 'row',
      borderRadius: scale(10),
      alignItems: 'center',
      overflow: 'hidden',
    },
    listItemContainer: {
      marginTop: scale(16),
      alignItems: params.currentUser ? 'flex-end' : 'flex-start',
    },
    listItemWidth: {
      width: '90%',
    },
    buttonImage: {
      height: '100%',
      width: '100%',
    },
    staticWaveformView: {
      flex: 1,
      height: scale(75),
      paddingEnd: scale(10),
    },
    playBackControlPressable: {
      height: scale(30),
      width: scale(30),
      padding: scale(5),
    },
    recordAudioPressable: {
      height: scale(40),
      width: scale(40),
      padding: scale(8),
    },
    liveWaveformContainer: {
      flexDirection: 'row',
      marginBottom: scale(8),
      borderRadius: scale(8),
      alignItems: 'center',
      paddingHorizontal: scale(16),
    },
    simformImage: {
      height: scale(50),
      width: scale(200),
    },
    liveWaveformView: {
      flex: 1,
      borderWidth: scale(0.5),
      borderRadius: scale(8),
      paddingHorizontal: scale(10),
    },
    buttonImageLive: {
      height: '100%',
      width: '100%',
      tintColor: Colors.pink,
    },
    simformImageContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default styles;
