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
  useAudioPlayer,
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
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import fs from 'react-native-fs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Icons } from './assets';
import {
  generateAudioList,
  getRecordedAudios,
  playbackSpeedSequence,
  type ListItem,
} from './constants';
import stylesheet from './styles';
import { Colors } from './theme';

let currentPlayingRef: React.RefObject<IWaveformRef> | undefined;
const RenderListItem = React.memo(
  ({
    item,
    onPanStateChange,
    currentPlaybackSpeed,
    changeSpeed,
  }: {
    item: ListItem;
    onPanStateChange: (value: boolean) => void;
    currentPlaybackSpeed: PlaybackSpeedType;
    changeSpeed: () => void;
  }) => {
    const ref = useRef<IWaveformRef>(null);
    const [playerState, setPlayerState] = useState(PlayerState.stopped);
    const styles = stylesheet({ currentUser: item.fromCurrentUser });
    const [isLoading, setIsLoading] = useState(true);

    const handlePlayPauseAction = async () => {
      // If we are recording do nothing
      if (
        currentPlayingRef?.current?.currentState === RecorderState.recording
      ) {
        return;
      }

      const startNewPlayer = async () => {
        currentPlayingRef = ref;
        if (ref.current?.currentState === PlayerState.paused) {
          await ref.current?.resumePlayer();
        } else {
          await ref.current?.startPlayer({
            finishMode: FinishMode.stop,
          });

          // If the player took too much time to initialize and another player started instead we pause the former one!
          if (
            currentPlayingRef?.current?.playerKey !== ref?.current?.playerKey
          ) {
            await ref?.current?.pausePlayer();
          }
        }
      };

      // If no player or if current player is stopped just start the new player!
      if (
        currentPlayingRef == null ||
        [PlayerState.stopped, PlayerState.paused].includes(
          currentPlayingRef?.current?.currentState as PlayerState
        )
      ) {
        await startNewPlayer();
      } else {
        // Pause current player if it was playing
        if (currentPlayingRef?.current?.currentState === PlayerState.playing) {
          await currentPlayingRef?.current?.pausePlayer();
        }

        // Start player when it is a different one!
        if (currentPlayingRef?.current?.playerKey !== ref?.current?.playerKey) {
          await startNewPlayer();
        }
      }
    };

    const handleStopAction = async () => {
      ref.current?.stopPlayer();
    };

    return (
      <View key={item.path} style={[styles.listItemContainer]}>
        <View style={styles.listItemWidth}>
          <View style={[styles.buttonContainer]}>
            <Pressable
              disabled={isLoading}
              onPress={handlePlayPauseAction}
              style={styles.playBackControlPressable}>
              {isLoading ? (
                <ActivityIndicator color={'#FFFFFF'} />
              ) : (
                <Image
                  source={
                    playerState !== PlayerState.playing
                      ? Icons.play
                      : Icons.pause
                  }
                  style={styles.buttonImage}
                  resizeMode="contain"
                />
              )}
            </Pressable>
            <Pressable
              disabled={PlayerState.stopped == playerState}
              onPress={handleStopAction}
              style={styles.playBackControlPressable}>
              <Image
                source={Icons.stop}
                style={[
                  styles.stopButton,
                  {
                    opacity: playerState === PlayerState.stopped ? 0.5 : 1,
                  },
                ]}
                resizeMode="contain"
              />
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
              onPlayerStateChange={setPlayerState}
              onPanStateChange={onPanStateChange}
              onError={error => {
                console.log('Error in static player:', error);
              }}
              onCurrentProgressChange={(_currentProgress, _songDuration) => {
                // console.log(
                //   `currentProgress ${currentProgress}, songDuration ${songDuration}`
                // );
              }}
              onChangeWaveformLoadState={state => {
                setIsLoading(state);
              }}
            />
            {playerState === PlayerState.playing ? (
              <Pressable
                onPress={changeSpeed}
                style={[styles.speedBox, styles.whiteBackground]}>
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
      // Stopping other player before starting recording
      if (currentPlayingRef?.current?.currentState === PlayerState.playing) {
        currentPlayingRef?.current?.stopPlayer();
      }

      const hasPermission = await checkHasAudioRecorderPermission();

      if (hasPermission === PermissionStatus.granted) {
        currentPlayingRef = ref;
        startRecording();
      } else if (hasPermission === PermissionStatus.undetermined) {
        const permissionStatus = await getAudioRecorderPermission();
        if (permissionStatus === PermissionStatus.granted) {
          currentPlayingRef = ref;
          startRecording();
        }
      } else {
        Linking.openSettings();
      }
    } else {
      ref.current?.stopRecord().then(path => {
        setList(prev => [...prev, { fromCurrentUser: true, path }]);
      });
      currentPlayingRef = undefined;
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
  const [list, setList] = useState<ListItem[]>([]);
  const [nbOfRecording, setNumberOfRecording] = useState<number>(0);
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

  useEffect(() => {
    getRecordedAudios().then(recordedAudios =>
      setNumberOfRecording(recordedAudios.length)
    );
  }, [list]);

  const changeSpeed = () => {
    setCurrentPlaybackSpeed(
      prev =>
        playbackSpeedSequence[
          (playbackSpeedSequence.indexOf(prev) + 1) %
            playbackSpeedSequence.length
        ] ?? 1.0
    );
  };

  const handleDeleteRecordings = async () => {
    const recordings = await getRecordedAudios();

    const deleteRecordings = async () => {
      await Promise.all(recordings.map(async recording => fs.unlink(recording)))
        .then(() => {
          generateAudioList().then(audioListArray => {
            setList(audioListArray);
          });
        })
        .catch(error => {
          Alert.alert(
            'Error deleting recordings',
            'Below error happened while deleting recordings:\n' + error,
            [{ text: 'Dismiss' }]
          );
        });
    };

    Alert.alert(
      'Delete all recording',
      `Continue to delete all ${recordings.length} recordings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK', onPress: deleteRecordings },
      ]
    );
  };

  const handleStopPlayersAndExtractors = async () => {
    await currentPlayingRef?.current?.stopPlayer();

    const { stopPlayersAndExtractors } = useAudioPlayer();
    const hasStoppedAll: boolean[] = await stopPlayersAndExtractors();

    if (hasStoppedAll.every(Boolean)) {
      Alert.alert(
        'Everything stopped',
        'All players and extractors have been stopped!',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Error stopping everything',
        'An error occurred when trying to stop players or extractors',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.appContainer}>
      <StatusBar
        barStyle={'dark-content'}
        backgroundColor={'transparent'}
        animated
        translucent
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

            <View style={styles.advancedOptionsContainer}>
              <Pressable
                style={[
                  styles.advancedOptionItem,
                  { opacity: nbOfRecording ? 1 : 0.5 },
                ]}
                onPress={handleDeleteRecordings}
                disabled={!nbOfRecording}>
                <Image
                  source={Icons.delete}
                  style={styles.pinkButtonImage}
                  resizeMode="contain"
                />
                <Text style={styles.advancedOptionItemTitle}>
                  {'Delete recorded audio files'}
                </Text>
              </Pressable>
              <Pressable
                style={styles.advancedOptionItem}
                onPress={handleStopPlayersAndExtractors}>
                <Image
                  source={Icons.stop}
                  style={[styles.pinkButtonImage]}
                  resizeMode="contain"
                />
                <Text style={styles.advancedOptionItemTitle}>
                  {'Stop all players and extractors'}
                </Text>
              </Pressable>
            </View>

            <ScrollView scrollEnabled={shouldScroll}>
              {list.map(item => (
                <RenderListItem
                  key={item.path}
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
