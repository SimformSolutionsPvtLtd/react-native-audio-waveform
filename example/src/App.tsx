import { Dispatch, SetStateAction, useRef, useState } from 'react';
import {
  Image,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  View,
} from 'react-native';
import {
  FinishMode,
  IPlayWaveformRef,
  IRecordWaveformRef,
  PermissionStatus,
  PlayerState,
  RecorderState,
  UpdateFrequency,
  Waveform,
  useAudioPermission,
} from 'react-native-audio-waveform';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RNFetchBlob from 'rn-fetch-blob';
import Icons from './assets/icons';
import styles from './styles';
import { Colors } from './theme';

interface ListItem {
  fromCurrentUser: boolean;
  path: string;
}

const ListItem = ({
  item,
  index,
  onPanStateChange,
}: {
  item: ListItem;
  index: number;
  onPanStateChange: (value: boolean) => void;
}) => {
  const ref = useRef<IPlayWaveformRef>(null);
  const [playerState, setPlayerState] = useState(PlayerState.stopped);

  const handleButtonAction = () => {
    if (playerState === PlayerState.stopped) {
      ref.current?.startPlayer({ finishMode: FinishMode.stop });
    } else {
      ref.current?.stopPlayer();
    }
  };

  return (
    <View
      key={`${item}${index}`}
      style={[
        styles.listItemContainer,
        { alignItems: item.fromCurrentUser ? 'flex-end' : 'flex-start' },
      ]}>
      <View
        style={[
          styles.buttonContainer,
          {
            backgroundColor: item.fromCurrentUser
              ? Colors.fromMeBackground
              : Colors.fromOtherBackground,
          },
        ]}>
        <Pressable
          onPress={handleButtonAction}
          style={styles.pressableButtonView}>
          <Image
            source={
              playerState === PlayerState.stopped ? Icons.play : Icons.stop
            }
            style={styles.buttonImage}
            resizeMode="contain"
          />
        </Pressable>
        <Waveform<'static'>
          containerStyle={styles.staticWaveformView}
          mode="static"
          key={`${item}${index}`}
          ref={ref}
          path={item.path}
          candleSpace={2}
          candleWidth={4}
          scrubColor={Colors.white}
          waveColor={Colors.waveStickBackground}
          onPlayerStateChange={setPlayerState}
          onPanStateChange={onPanStateChange}
        />
      </View>
    </View>
  );
};

const LivePlayerComponent = ({
  setList,
}: {
  setList: Dispatch<SetStateAction<ListItem[]>>;
}) => {
  const ref = useRef<IRecordWaveformRef>(null);
  const [recorderState, setRecorderState] = useState(RecorderState.stopped);
  const { checkHasAudioRecorderPermission, getAudioRecorderPermission } =
    useAudioPermission();

  const startRecording = () => {
    ref.current
      ?.startRecord({
        updateFrequency: UpdateFrequency.high,
      })
      .then(() => {})
      .catch(() => {});
  };

  const handleRecorderAction = async () => {
    if (recorderState === RecorderState.stopped) {
      let hasPermission = await checkHasAudioRecorderPermission();
      if (Platform.OS === 'ios') {
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
      }
      if (Platform.OS === 'android') {
        if (hasPermission === PermissionStatus.granted) {
          startRecording();
        } else if (hasPermission === PermissionStatus.denied) {
          const permissionStatus = await getAudioRecorderPermission();
          if (permissionStatus === PermissionStatus.granted) {
            startRecording();
          }
        }
      }
    } else {
      ref.current?.stopRecord().then(path => {
        setList(prev => [...prev, { fromCurrentUser: true, path }]);
      });
    }
  };

  return (
    <View style={styles.liveWaveformContainer}>
      <Waveform<'live'>
        mode="live"
        containerStyle={styles.liveWaveformView}
        ref={ref}
        candleSpace={2}
        candleWidth={4}
        waveColor={Colors.simformPink}
        onRecorderStateChange={setRecorderState}
      />
      <Pressable
        onPress={handleRecorderAction}
        style={styles.pressableButtonView}>
        <Image
          source={
            recorderState === RecorderState.stopped ? Icons.mic : Icons.stop
          }
          style={styles.buttonImageLive}
          resizeMode="contain"
        />
      </Pressable>
    </View>
  );
};

const App = () => {
  const [shouldScroll, setShouldScroll] = useState(true);

  const { fs } = RNFetchBlob;
  const filePath =
    Platform.OS === 'ios'
      ? `${fs.dirs.MainBundleDir}`
      : `${fs.dirs.DownloadDir}`;

  const [list, setList] = useState<ListItem[]>([
    {
      fromCurrentUser: false,
      path: `${filePath}/file_example_mp3_1mg.mp3`,
    },
    {
      fromCurrentUser: true,
      path: `${filePath}/file_example_mp3_700kb.mp3`,
    },
    {
      fromCurrentUser: false,
      path: `${filePath}/file_example_mp3_12s.mp3`,
    },
    {
      fromCurrentUser: true,
      path: `${filePath}/file_example_mp3_15s.mp3`,
    },
  ]);

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <GestureHandlerRootView style={styles.safeAreaContainer}>
        <View style={styles.container}>
          <View>
            <View style={styles.simformImageContainer}>
              <Image
                source={Icons.simform}
                style={styles.simformImage}
                resizeMode="contain"
              />
            </View>
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
        </View>
        <LivePlayerComponent setList={setList} />
      </GestureHandlerRootView>
    </SafeAreaView>
  );
};
export default App;
