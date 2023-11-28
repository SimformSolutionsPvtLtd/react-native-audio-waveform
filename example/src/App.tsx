import { useRef, useState } from 'react';
import { Button, Linking, SafeAreaView, ScrollView, View } from 'react-native';
import {
  FinishMode,
  IPlayWaveformRef,
  IRecordWaveformRef,
  PermissionStatus,
  PlayerState,
  RecorderState,
  UpdateFrequency,
  Waveform,
  useRecorderPermission,
} from 'react-native-audio-waveform';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RNFetchBlob from 'rn-fetch-blob';
import { Strings } from './constants';
import styles from './styles';

const ListItem = ({
  item,
  index,
  onPanStateChange,
}: {
  item: string;
  index: number;
  onPanStateChange: (value: boolean) => void;
}) => {
  const newRef = useRef<IPlayWaveformRef>(null);
  const [playerState, setPlayerState] = useState(PlayerState.stopped);
  return (
    <View key={`${item}${index}`}>
      <View style={styles.buttonContainer}>
        <Button
          title={Strings.start}
          disabled={playerState !== PlayerState.stopped}
          onPress={() =>
            newRef.current?.startPlayer({ finishMode: FinishMode.stop })
          }
        />
        <Button
          title={Strings.stop}
          disabled={playerState !== PlayerState.playing}
          onPress={() => newRef.current?.stopPlayer()}
        />
        <Button
          title={Strings.pause}
          disabled={playerState !== PlayerState.playing}
          onPress={() => newRef.current?.pausePlayer()}
        />
        <Button
          title={Strings.resume}
          disabled={playerState !== PlayerState.paused}
          onPress={() => newRef.current?.resumePlayer()}
        />
      </View>
      <Waveform<'static'>
        mode="static"
        key={`${item}${index}`}
        ref={newRef}
        path={item}
        candleSpace={2}
        candleWidth={4}
        scrubColor="white"
        onPlayerStateChange={setPlayerState}
        onPanStateChange={onPanStateChange}
      />
    </View>
  );
};

const LivePlayerComponent = () => {
  const newRef = useRef<IRecordWaveformRef>(null);
  const [recorderState, setRecorderState] = useState(RecorderState.stopped);
  const { checkHasRecorderPermission, getAudioRecorderPermission } =
    useRecorderPermission();

  const startRecording = () => {
    newRef.current
      ?.startRecord({
        updateFrequency: UpdateFrequency.high,
      })
      .then(() => {})
      .catch(err => console.log(err));
  };
  return (
    <>
      <View style={styles.buttonContainer}>
        <Button
          title={Strings.start}
          disabled={recorderState !== RecorderState.stopped}
          onPress={async () => {
            let hasPermission = await checkHasRecorderPermission();

            if (hasPermission === PermissionStatus.granted) {
              startRecording();
            } else if (hasPermission === PermissionStatus.undetermined) {
              const permissionStatus = await getAudioRecorderPermission();
              if (permissionStatus === PermissionStatus.granted) {
                startRecording();
              }
            } else {
              Linking.openSettings();
            }
          }}
        />
        <Button
          title={Strings.stop}
          disabled={recorderState !== RecorderState.recording}
          onPress={() =>
            newRef.current?.stopRecord().then(path => {
              console.log({ path });
            })
          }
        />
        <Button
          title={Strings.pause}
          disabled={recorderState !== RecorderState.recording}
          onPress={() => newRef.current?.pauseRecord()}
        />
        <Button
          title={Strings.resume}
          disabled={recorderState !== RecorderState.paused}
          onPress={() => newRef.current?.resumeRecord()}
        />
      </View>
      <Waveform<'live'>
        mode="live"
        ref={newRef}
        candleSpace={2}
        candleWidth={4}
        onRecorderStateChange={setRecorderState}
      />
    </>
  );
};

const App = () => {
  const [shouldScroll, setShouldScroll] = useState(true);
  const { fs } = RNFetchBlob;
  const filePath = `${fs.dirs.MainBundleDir}`;
  const list = [
    `${filePath}/file_example_MP3_1MG.mp3`,
    `${filePath}/file_example_MP3_700KB.mp3`,
  ];
  return (
    <SafeAreaView style={styles.container}>
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.container}>
          <LivePlayerComponent />
          <ScrollView scrollEnabled={shouldScroll}>
            {list.map((item, index) => (
              <ListItem
                key={`${item}${index}`}
                index={index}
                item={item}
                onPanStateChange={value => setShouldScroll(!value)}
              />
            ))}
          </ScrollView>
        </View>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
};
export default App;
