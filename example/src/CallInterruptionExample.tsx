import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Example showing the new simplified call interruption handling
 * When a call interrupts recording, it automatically stops and returns the recorded file
 */
const CallInterruptionExample = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simplified Call Interruption Handling</Text>
      
      <Text style={styles.description}>
        New behavior when a phone call interrupts recording:
      </Text>
      
      <Text style={styles.feature}>
        ✅ Recording stops automatically during calls
      </Text>
      <Text style={styles.feature}>
        ✅ Whatever was recorded is saved and returned
      </Text>
      <Text style={styles.feature}>
        ✅ No complex pause/resume logic needed
      </Text>
      <Text style={styles.feature}>
        ✅ Clean and simple implementation
      </Text>
      
      <Text style={styles.codeExample}>
        {`// Usage Example:
const onRecorderStateChange = (state) => {
  if (state === 'stopped') {
    // Recording stopped - check if it was due to interruption
    // The recorded file is available through normal stop callback
  }
};

// When call interrupts:
// 1. Recording stops automatically
// 2. Existing audio file is saved
// 3. onRecorderStateChange fires with 'stopped'
// 4. App can handle the saved recording

<Waveform
  mode="live"
  onRecorderStateChange={onRecorderStateChange}
  // ... other props
/>`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F2F2F7',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1C1C1E',
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
    color: '#3A3A3C',
    textAlign: 'center',
  },
  feature: {
    fontSize: 16,
    marginBottom: 10,
    color: '#007AFF',
    paddingLeft: 10,
  },
  codeExample: {
    fontSize: 12,
    fontFamily: 'Courier New',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    color: '#1C1C1E',
  },
});

export default CallInterruptionExample;
