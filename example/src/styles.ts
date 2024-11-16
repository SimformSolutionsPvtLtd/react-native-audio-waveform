import { StyleSheet } from 'react-native';
import { Colors, scale } from './theme';
import { useColorScheme } from 'react-native';


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
      backgroundColor: useColorScheme() === "dark" ? Colors.gray : Colors.white,
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
      columnGap: scale(8),
      paddingHorizontal: scale(8),
      backgroundColor: params.currentUser ? Colors.darkGray : Colors.pink,
    },
    listItemContainer: {
      marginTop: scale(16),
      alignItems: params.currentUser ? 'flex-end' : 'flex-start',
    },
    listItemWidth: {
      width: '90%',
    },
    buttonImage: {
      height: scale(22),
      width: scale(22),
      tintColor: Colors.white,
      alignSelf: 'flex-end',
    },
    stopButton: {
      height: scale(22),
      width: scale(22),
      alignSelf: 'center',
    },
    pinkButtonImage: {
      height: scale(22),
      width: scale(22),
      tintColor: Colors.pink,
      alignSelf: 'flex-end',
    },
    staticWaveformView: {
      flex: 1,
      height: scale(75),
    },
    playBackControlPressable: {
      height: scale(30),
      width: scale(30),
      justifyContent: 'center',
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
    },
    advancedOptionsContainer: {
      gap: scale(8),
    },
    advancedOptionItem: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    advancedOptionItemTitle: {
      fontSize: scale(20),
      fontWeight: 'bold',
      color: Colors.pink,
      paddingLeft: scale(8),
    },
    speedBox: {
      height: scale(28),
      width: scale(28),
      borderRadius: scale(14),
      justifyContent: 'center',
      tintColor: Colors.white,
      marginRight: scale(5),
    },
    whiteBackground: {
      backgroundColor: Colors.white,
    },
    speed: {
      color: Colors.black,
      fontSize: scale(10),
      textAlign: 'center',
      fontWeight: '600',
    },
  });

export default styles;
