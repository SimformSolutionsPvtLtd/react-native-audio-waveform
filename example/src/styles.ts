import { StyleSheet } from 'react-native';

/**
 * A StyleSheet object that contains all of the application's styles.
 * @param {ThemeMode} theme - The theme of the application.
 * @returns {StyleSheet} - A StyleSheet object containing all of the application's styles.
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonContainer: { flexDirection: 'row' },
});

export default styles;
