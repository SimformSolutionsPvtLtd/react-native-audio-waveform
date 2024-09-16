import React from 'react';
import { ScrollView, View } from 'react-native';
import styles from './WaveformWrapperStyles';
import type { WaveformWrapperProps } from './WaveformWrapperTypes';

/**
 * A wrapper component that renders a ScrollView or a static View based on the provided `waveformMode` prop.
 *
 * @param {Object} props - The component props.
 * @param {StaticOrLive} props.waveformMode - The mode of the waveform, either 'static' or 'live'.
 * @param {React.ReactNode} props.children - The content to be rendered inside the wrapper.
 * @returns {JSX.Element} - The rendered wrapper component.
 */
const WaveformWrapper = ({
  waveformMode,
  children,
  scrollRef,
}: WaveformWrapperProps): JSX.Element => {
  return waveformMode === 'live' ? (
    <ScrollView horizontal ref={scrollRef} style={styles.container}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.container, styles.row]}>{children}</View>
  );
};

export default WaveformWrapper;
