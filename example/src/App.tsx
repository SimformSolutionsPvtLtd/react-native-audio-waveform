import {
  FinishMode,
  IWaveformRef,
  PermissionStatus,
  PlaybackSpeedType,
  PlayerState,
  RecorderState,
  UpdateFrequency,
  Waveform,
  useAudioPermission,
} from '@simform_solutions/react-native-audio-waveform';
import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Icons } from './assets';
import {
  generateAudioList,
  playbackSpeedSequence,
  type ListItem,
} from './constants';
import stylesheet from './styles';
import { Colors } from './theme';

const RenderListItem = React.memo(
  ({
    item,
    currentPlaying,
    setCurrentPlaying,
    onPanStateChange,
    currentPlaybackSpeed,
    changeSpeed,
  }: {
    item: ListItem;
    currentPlaying: string;
    setCurrentPlaying: Dispatch<SetStateAction<string>>;
    onPanStateChange: (value: boolean) => void;
    currentPlaybackSpeed: PlaybackSpeedType;
    changeSpeed: () => void;
  }) => {
    const ref = useRef<IWaveformRef>(null);
    const [playerState, setPlayerState] = useState(PlayerState.stopped);
    const styles = stylesheet({ currentUser: item.fromCurrentUser });
    const [isLoading, setIsLoading] = useState(true);

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
    }, [currentPlaying, item.path]);

    return (
      <View key={item.path} style={[styles.listItemContainer]}>
        <View style={styles.listItemWidth}>
          <View style={[styles.buttonContainer]}>
            <Pressable
              disabled={isLoading}
              style={styles.playBackControlPressable}
              onPress={handleButtonAction}>
              {isLoading ? (
                <ActivityIndicator color={'#FF0000'} />
              ) : (
                <Image
                  source={
                    playerState === PlayerState.stopped
                      ? Icons.play
                      : Icons.stop
                  }
                  style={styles.buttonImage}
                  resizeMode="contain"
                />
              )}
            </Pressable>
            <Waveform
              containerStyle={styles.staticWaveformView}
              mode="static"
              key={item.path}
              playbackSpeed={currentPlaybackSpeed}
              ref={ref}
              path={item.path}
              candleSpace={2}
              candleWidth={4}
              scrubColor={Colors.white}
              waveColor={Colors.lightWhite}
              candleHeightScale={4}
              onPlayerStateChange={state => {
                setPlayerState(state);
                if (
                  state === PlayerState.stopped &&
                  currentPlaying === item.path
                ) {
                  setCurrentPlaying('');
                }
              }}
              onPanStateChange={onPanStateChange}
              onError={error => {
                console.log(error, 'we are in example');
              }}
              onCurrentProgressChange={(currentProgress, songDuration) => {
                console.log(
                  'currentProgress ',
                  currentProgress,
                  'songDuration ',
                  songDuration
                );
              }}
              onChangeWaveformLoadState={state => {
                setIsLoading(state);
              }}
            />
            {playerState === PlayerState.playing ? (
              <Pressable
                style={[styles.speedBox, styles.whiteBackground]}
                onPress={changeSpeed}>
                <Text style={styles.speed}>{`${currentPlaybackSpeed}x`}</Text>
              </Pressable>
            ) : (
              <Image style={styles.speedBox} source={Icons.logo} />
            )}
          </View>
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
      const hasPermission = await checkHasAudioRecorderPermission();

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
        candleWidth={4}
        waveColor={Colors.pink}
        onRecorderStateChange={setRecorderState}
      />
      <Pressable
        style={styles.recordAudioPressable}
        onPress={handleRecorderAction}>
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
  const [list, setList] = useState<ListItem[]>([]);
  const [currentPlaybackSpeed, setCurrentPlaybackSpeed] =
    useState<PlaybackSpeedType>(1.0);

  const { top, bottom } = useSafeAreaInsets();
  const styles = stylesheet({ top, bottom });

  useEffect(() => {
    generateAudioList().then(audioListArray => {
      if (audioListArray?.length > 0) {
        setList(audioListArray);
      }
    });
  }, []);

  const changeSpeed = () => {
    setCurrentPlaybackSpeed(
      prev =>
        playbackSpeedSequence[
          (playbackSpeedSequence.indexOf(prev) + 1) %
            playbackSpeedSequence.length
        ] ?? 1.0
    );
  };

  return (
    <View style={styles.appContainer}>
      <StatusBar
        animated
        translucent
        barStyle={'dark-content'}
        backgroundColor={'transparent'}
      />
      <GestureHandlerRootView style={styles.appContainer}>
        <View style={styles.screenBackground}>
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
                <RenderListItem
                  key={item.path}
                  currentPlaying={currentPlaying}
                  setCurrentPlaying={setCurrentPlaying}
                  item={item}
                  onPanStateChange={value => setShouldScroll(!value)}
                  {...{ currentPlaybackSpeed, changeSpeed }}
                />
              ))}
            </ScrollView>
          </View>
          <LivePlayerComponent setList={setList} />
        </View>
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
