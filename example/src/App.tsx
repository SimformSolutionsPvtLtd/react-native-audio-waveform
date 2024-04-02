import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Image,
  ImageBackground,
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  View,
} from 'react-native';
import {
  FinishMode,
  IWaveformRef,
  PermissionStatus,
  PlayerState,
  RecorderState,
  UpdateFrequency,
  Waveform,
  useAudioPermission,
} from '@simform_solutions/react-native-audio-waveform';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Gifs, Icons } from './assets';
import { audioListArray, type ListItem } from './constants';
import stylesheet from './styles';
import { Colors } from './theme';

const ListItem = React.memo(
  ({
    item,
    currentPlaying,
    setCurrentPlaying,
    onPanStateChange,
  }: {
    item: ListItem;
    currentPlaying: string;
    setCurrentPlaying: Dispatch<SetStateAction<string>>;
    onPanStateChange: (value: boolean) => void;
  }) => {
    const ref = useRef<IWaveformRef>(null);
    const [playerState, setPlayerState] = useState(PlayerState.stopped);
    const styles = stylesheet({ currentUser: item.fromCurrentUser });

    const handleButtonAction = () => {
      if (playerState === PlayerState.stopped) {
        setCurrentPlaying(item.path);
      } else {
        setCurrentPlaying('');
      }
    };

    useEffect(() => {
      if (currentPlaying !== item.path) {
        ref.current?.stopPlayer();
      } else {
        ref.current?.startPlayer({ finishMode: FinishMode.stop });
      }
    }, [currentPlaying]);

    return (
      <View key={item.path} style={[styles.listItemContainer]}>
        <View style={styles.listItemWidth}>
          <ImageBackground
            source={
              item.fromCurrentUser
                ? Gifs.audioBackground1
                : Gifs.audioBackground2
            }
            style={[styles.buttonContainer]}>
            <Pressable
              onPress={handleButtonAction}
              style={styles.playBackControlPressable}>
              <Image
                source={
                  playerState === PlayerState.stopped ? Icons.play : Icons.stop
                }
                style={styles.buttonImage}
                resizeMode="contain"
              />
            </Pressable>
            <Waveform
              containerStyle={styles.staticWaveformView}
              mode="static"
              key={item.path}
              ref={ref}
              path={item.path}
              candleSpace={2}
              candleWidth={4}
              scrubColor={Colors.white}
              waveColor={Colors.gray}
              onPlayerStateChange={setPlayerState}
              onPanStateChange={onPanStateChange}
              onError={error => {
                console.log(error, 'we are in example');
              }}
            />
          </ImageBackground>
        </View>
      </View>
    );
  }
);

const LivePlayerComponent = ({
  setList,
}: {
  setList: Dispatch<SetStateAction<ListItem[]>>;
}) => {
  const ref = useRef<IWaveformRef>(null);
  const [recorderState, setRecorderState] = useState(RecorderState.stopped);
  const styles = stylesheet();
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
    } else {
      ref.current?.stopRecord().then(path => {
        setList(prev => [...prev, { fromCurrentUser: true, path }]);
      });
    }
  };

  return (
    <View style={styles.liveWaveformContainer}>
      <Waveform
        mode="live"
        containerStyle={styles.liveWaveformView}
        ref={ref}
        candleSpace={2}
        candleWidth={2}
        waveColor={Colors.pink}
        onRecorderStateChange={setRecorderState}
      />
      <Pressable
        onPress={handleRecorderAction}
        style={styles.recordAudioPressable}>
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

const AppContainer = () => {
  const [shouldScroll, setShouldScroll] = useState<boolean>(true);
  const [currentPlaying, setCurrentPlaying] = useState<string>('');
  const [list, setList] = useState<ListItem[]>(audioListArray);

  const { top, bottom } = useSafeAreaInsets();
  const styles = stylesheet({ top, bottom });

  return (
    <View style={styles.appContainer}>
      <StatusBar
        barStyle={'dark-content'}
        backgroundColor={'transparent'}
        animated
        translucent
      />
      <GestureHandlerRootView style={styles.appContainer}>
        <ImageBackground
          source={Gifs.appBackground}
          style={styles.screenBackground}>
          <View style={styles.container}>
            <View style={styles.simformImageContainer}>
              <Image
                source={Icons.simform}
                style={styles.simformImage}
                resizeMode="contain"
              />
            </View>
            <ScrollView scrollEnabled={shouldScroll}>
              {list.map(item => (
                <ListItem
                  key={item.path}
                  currentPlaying={currentPlaying}
                  setCurrentPlaying={setCurrentPlaying}
                  item={item}
                  onPanStateChange={value => setShouldScroll(!value)}
                />
              ))}
            </ScrollView>
          </View>
          <LivePlayerComponent setList={setList} />
        </ImageBackground>
      </GestureHandlerRootView>
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContainer />
    </SafeAreaProvider>
  );
}
