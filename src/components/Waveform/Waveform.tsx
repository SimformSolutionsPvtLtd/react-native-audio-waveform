import { clamp, floor, head, isEmpty, isNil } from 'lodash';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  PanResponder,
  ScrollView,
  View,
  type LayoutRectangle,
  type NativeTouchEvent,
} from 'react-native';
import {
  DurationType,
  FinishMode,
  PermissionStatus,
  PlayerState,
  RecorderState,
  UpdateFrequency,
} from '../../constants';
import {
  useAudioPermission,
  useAudioPlayer,
  useAudioRecorder,
} from '../../hooks';
import type { IStartRecording } from '../../types';
import { WaveformCandle } from '../WaveformCandle';
import styles from './WaveformStyles';
import {
  type IStartPlayerRef,
  type IWaveform,
  type IWaveformRef,
  type LiveWaveform,
  type StaticWaveform,
} from './WaveformTypes';

export const Waveform = forwardRef<IWaveformRef, IWaveform>((props, ref) => {
  const {
    mode,
    path,
    candleSpace = 2,
    candleWidth = 5,
    containerStyle = {},
    waveColor,
    scrubColor,
    onPlayerStateChange,
    onRecorderStateChange,
    onPanStateChange,
    onError,
  } = props as StaticWaveform & LiveWaveform;
  const viewRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [viewLayout, setViewLayout] = useState<LayoutRectangle | null>(null);
  const [seekPosition, setSeekPosition] = useState<NativeTouchEvent | null>(
    null
  );
  const [songDuration, setSongDuration] = useState<number>(0);
  const [noOfSamples, setNoOfSamples] = useState<number>(0);
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const [panMoving, setPanMoving] = useState(false);
  const [playerState, setPlayerState] = useState(PlayerState.stopped);
  const [recorderState, setRecorderState] = useState(RecorderState.stopped);

  const {
    extractWaveformData,
    preparePlayer,
    getDuration,
    seekToPlayer,
    playPlayer,
    stopPlayer,
    pausePlayer,
    onCurrentDuration,
    onDidFinishPlayingAudio,
    onCurrentRecordingWaveformData,
  } = useAudioPlayer();

  const { startRecording, stopRecording, pauseRecording, resumeRecording } =
    useAudioRecorder();

  const { checkHasAudioRecorderPermission } = useAudioPermission();

  const preparePlayerForPath = async () => {
    if (!isNil(path) && !isEmpty(path)) {
      try {
        const prepare = await preparePlayer({
          path,
          playerKey: `PlayerFor${path}`,
          updateFrequency: UpdateFrequency.medium,
          volume: 10,
        });
        return Promise.resolve(prepare);
      } catch (err) {
        return Promise.reject(err);
      }
    } else {
      return Promise.reject(
        new Error(`Can not start player for path: ${path}`)
      );
    }
  };

  const getAudioDuration = async () => {
    try {
      const duration = await getDuration({
        playerKey: `PlayerFor${path}`,
        durationType: DurationType.max,
      });
      if (!isNil(duration)) {
        setSongDuration(duration);
      } else {
        return Promise.reject(
          new Error(`Could not get duration for path: ${path}`)
        );
      }
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const preparePlayerAndGetDuration = async () => {
    try {
      const prepare = await preparePlayerForPath();
      if (prepare) {
        await getAudioDuration();
      }
    } catch (err) {
      console.error(err);
      (onError as Function)(err);
    }
  };

  const getAudioWaveFormForPath = async (noOfSample: number) => {
    if (!isNil(path) && !isEmpty(path)) {
      try {
        const result = await extractWaveformData({
          path: path,
          playerKey: `PlayerFor${path}`,
          noOfSamples: noOfSample,
        });

        if (!isNil(result) && !isEmpty(result)) {
          const waveforms = head(result);
          if (!isNil(waveforms) && !isEmpty(waveforms)) {
            setWaveform(waveforms);
            await preparePlayerAndGetDuration();
          }
        }
      } catch (err) {
        (onError as Function)(err);
        console.error(err);
      }
    } else {
      (onError as Function)(
        `Can not find waveform for mode ${mode} path: ${path}`
      );
      console.error(`Can not find waveform for mode ${mode} path: ${path}`);
    }
  };

  const stopPlayerAction = async () => {
    if (mode === 'static') {
      try {
        const result = await stopPlayer({
          playerKey: `PlayerFor${path}`,
        });
        await preparePlayerForPath();
        if (!isNil(result) && result) {
          setCurrentProgress(0);
          setPlayerState(PlayerState.stopped);
          return Promise.resolve(result);
        } else {
          return Promise.reject(
            new Error(`error in stopping player for path: ${path}`)
          );
        }
      } catch (err) {
        return Promise.reject(err);
      }
    } else {
      return Promise.reject(
        new Error('error in stopping player: mode is not static')
      );
    }
  };

  const startPlayerAction = async (args?: IStartPlayerRef) => {
    if (mode === 'static') {
      try {
        const play = await playPlayer({
          finishMode: FinishMode.stop,
          playerKey: `PlayerFor${path}`,
          path: path,
          ...args,
        });

        if (play) {
          setPlayerState(PlayerState.playing);
          return Promise.resolve(true);
        } else {
          return Promise.reject(
            new Error(`error in starting player for path: ${path}`)
          );
        }
      } catch (error) {
        return Promise.reject(error);
      }
    } else {
      return Promise.reject(
        new Error('error in starting player: mode is not static')
      );
    }
  };

  const pausePlayerAction = async () => {
    if (mode === 'static') {
      try {
        const pause = await pausePlayer({
          playerKey: `PlayerFor${path}`,
        });
        if (pause) {
          setPlayerState(PlayerState.paused);
          return Promise.resolve(true);
        } else {
          return Promise.reject(
            new Error(`error in pause player for path: ${path}`)
          );
        }
      } catch (error) {
        return Promise.reject(error);
      }
    } else {
      return Promise.reject(
        new Error('error in pausing player: mode is not static')
      );
    }
  };

  const startRecordingAction = async (args?: Partial<IStartRecording>) => {
    if (mode === 'live') {
      try {
        const hasPermission = await checkHasAudioRecorderPermission();

        if (hasPermission === PermissionStatus.granted) {
          const start = await startRecording(args);
          if (!isNil(start) && start) {
            setRecorderState(RecorderState.recording);
            return Promise.resolve(true);
          } else {
            return Promise.reject(new Error('error in start recording action'));
          }
        } else {
          return Promise.reject(
            new Error(
              'error in start recording: audio recording permission is not granted'
            )
          );
        }
      } catch (err) {
        return Promise.reject(err);
      }
    } else {
      return Promise.reject(
        new Error('error in start recording: mode is not live')
      );
    }
  };

  const stopRecordingAction = async () => {
    if (mode === 'live') {
      try {
        const data = await stopRecording();
        if (!isNil(data) && !isEmpty(data)) {
          setWaveform([]);
          const pathData = head(data);
          if (!isNil(pathData)) {
            setRecorderState(RecorderState.stopped);
            return Promise.resolve(pathData);
          } else {
            return Promise.reject(
              new Error(
                'error in stopping recording. can not get path of recording'
              )
            );
          }
        } else {
          return Promise.reject(
            new Error(
              'error in stopping recording. can not get path of recording'
            )
          );
        }
      } catch (err) {
        return Promise.reject(err);
      }
    } else {
      return Promise.reject(
        new Error('error in stop recording: mode is not live')
      );
    }
  };

  const pauseRecordingAction = async () => {
    if (mode === 'live') {
      try {
        const pause = await pauseRecording();
        if (!isNil(pause) && pause) {
          setRecorderState(RecorderState.paused);
          return Promise.resolve(pause);
        } else {
          return Promise.reject(new Error('Error in pausing recording audio'));
        }
      } catch (err) {
        return Promise.reject(err);
      }
    } else {
      return Promise.reject(
        new Error('error in pause recording: mode is not live')
      );
    }
  };

  const resumeRecordingAction = async () => {
    if (mode === 'live') {
      try {
        const hasPermission = await checkHasAudioRecorderPermission();
        if (hasPermission === PermissionStatus.granted) {
          const resume = await resumeRecording();
          if (!isNil(resume)) {
            setRecorderState(RecorderState.recording);
            return Promise.resolve(resume);
          } else {
            return Promise.reject(new Error('Error in resume recording'));
          }
        } else {
          return Promise.reject(
            new Error(
              'error in resume recording: audio recording permission is not granted'
            )
          );
        }
      } catch (err) {
        return Promise.reject(err);
      }
    } else {
      return Promise.reject(
        new Error('error in resume recording: mode is not live')
      );
    }
  };

  useEffect(() => {
    if (!isNil(viewLayout?.width)) {
      const getNumberOfSamples = floor(
        (viewLayout?.width ?? 0) / (candleWidth + candleSpace)
      );
      setNoOfSamples(getNumberOfSamples);
      if (mode === 'static') {
        getAudioWaveFormForPath(getNumberOfSamples);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewLayout, mode, candleWidth, candleSpace]);

  useEffect(() => {
    if (!isNil(seekPosition)) {
      if (mode === 'static') {
        const seekAmount =
          (seekPosition?.pageX - (viewLayout?.x ?? 0)) /
          (viewLayout?.width ?? 1);
        const clampedSeekAmount = clamp(seekAmount, 0, 1);

        if (!panMoving) {
          seekToPlayer({
            playerKey: `PlayerFor${path}`,
            progress: clampedSeekAmount * songDuration,
          });
          if (playerState === PlayerState.playing) {
            startPlayerAction();
          }
        }

        setCurrentProgress(clampedSeekAmount * songDuration);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seekPosition, panMoving, mode, songDuration]);

  useEffect(() => {
    const tracePlayerState = onDidFinishPlayingAudio(async data => {
      if (data.playerKey === `PlayerFor${path}`) {
        if (data.finishType === FinishMode.stop) {
          setPlayerState(PlayerState.stopped);
          setCurrentProgress(0);
          await preparePlayerForPath();
        }
      }
    });

    const tracePlaybackValue = onCurrentDuration(data => {
      if (data.playerKey === `PlayerFor${path}`) {
        setCurrentProgress(data.currentDuration);
      }
    });

    const traceRecorderWaveformValue = onCurrentRecordingWaveformData(
      result => {
        if (mode === 'live') {
          if (!isNil(result.currentDecibel)) {
            setWaveform(prev => [...prev, result.currentDecibel]);
            if (scrollRef.current) {
              scrollRef.current.scrollToEnd({ animated: true });
            }
          }
        }
      }
    );
    return () => {
      tracePlayerState.remove();
      tracePlaybackValue.remove();
      traceRecorderWaveformValue.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isNil(onPlayerStateChange)) {
      (onPlayerStateChange as Function)(playerState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerState]);

  useEffect(() => {
    if (!isNil(onRecorderStateChange)) {
      (onRecorderStateChange as Function)(recorderState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorderState]);

  useEffect(() => {
    if (panMoving) {
      if (playerState === PlayerState.playing) {
        pausePlayerAction();
      }
    } else {
      if (playerState === PlayerState.paused) {
        startPlayerAction();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panMoving]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setPanMoving(true);
        (onPanStateChange as Function)(true);
      },
      onPanResponderStart: () => {},
      onPanResponderMove: event => {
        setSeekPosition(event.nativeEvent);
      },
      onPanResponderEnd: () => {
        (onPanStateChange as Function)(false);
        setPanMoving(false);
      },
    })
  ).current;

  useImperativeHandle(ref, () => ({
    startPlayer: startPlayerAction,
    stopPlayer: stopPlayerAction,
    pausePlayer: pausePlayerAction,
    resumePlayer: startPlayerAction,
    startRecord: startRecordingAction,
    pauseRecord: pauseRecordingAction,
    stopRecord: stopRecordingAction,
    resumeRecord: resumeRecordingAction,
  }));

  return (
    <View style={[styles.waveformContainer, containerStyle]}>
      <View
        ref={viewRef}
        style={styles.waveformInnerContainer}
        onLayout={() => {
          viewRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
            setViewLayout({ height, width, x: pageX, y: pageY });
          });
        }}
        {...(mode === 'static' ? panResponder.panHandlers : {})}>
        <ScrollView
          horizontal
          ref={scrollRef}
          style={styles.scrollContainer}
          scrollEnabled={mode === 'live'}>
          {waveform.map((amplitude, indexCandle) => (
            <WaveformCandle
              key={indexCandle}
              index={indexCandle}
              amplitude={amplitude}
              parentViewLayout={viewLayout}
              {...{
                candleWidth,
                candleSpace,
                noOfSamples,
                songDuration,
                currentProgress,
                waveColor,
                scrubColor,
              }}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
});
