/* eslint-disable react-hooks/exhaustive-deps */
import { clamp, floor, head, isEmpty, isNil } from 'lodash';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactElement,
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
  useAudioPlayer,
  useAudioRecorder,
  useAudioPermission,
} from '../../hooks';
import type { IStartRecording } from '../../types';
import { WaveformCandle } from '../WaveformCandle';
import styles from './styles';
import {
  type IStartPlayerRef,
  type IWaveform,
  type LiveWaveform,
  type StaticOrLive,
  type StaticWaveform,
  type WaveformRefProps,
  type WaveformWithStandardRef,
} from './types';

export const Waveform: <T extends StaticOrLive>(
  props: WaveformWithStandardRef<T>
) => ReactElement | null = forwardRef<
  WaveformRefProps<StaticOrLive>,
  IWaveform<StaticOrLive>
>((props, ref) => {
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
    onCurrentExtractedWaveformData,
    onCurrentRecordingWaveformData,
  } = useAudioPlayer();

  const {
    // getDecibel,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  } = useAudioRecorder();

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
        console.error(err);
      }
    } else {
      console.error(`Can not find waveform for mode ${mode} path: ${path}`);
    }
  };

  const stopPlayerAction = async () => {
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
  };

  const startPlayerAction = async (args?: IStartPlayerRef) => {
    try {
      const play = await playPlayer({
        playerKey: `PlayerFor${path}`,
        finishMode: FinishMode.stop,
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
  };

  const pausePlayerAction = async () => {
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
  };

  const startRecordingAction = async (args?: Partial<IStartRecording>) => {
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
  };

  const stopRecordingAction = async () => {
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
  };

  const pauseRecordingAction = async () => {
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
  };

  const resumeRecordingAction = async () => {
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
  }, [seekPosition, panMoving, mode, songDuration]);

  // TODO: to use this we have to remove conditions from onCurrentRecordingWaveformData and remove that code from native side also
  // useEffect(() => {
  //   if (mode === 'live') {
  //     const timerInterval = setInterval(() => {
  //       if (isRecording) {
  //         getDecibel()
  //           .then((result: any) => {
  //             setWaveform(prev => [...prev, result]);
  //             if (scrollRef.current) {
  //               scrollRef.current.scrollToEnd({ animated: true });
  //             }
  //           })
  //           .catch((error: any) => {
  //             console.error(`Error: ${error}`);
  //           });
  //       } else {
  //         clearInterval(timerInterval);
  //       }
  //     }, updateTime);
  //     return () => clearInterval(timerInterval);
  //   } else {
  //     return;
  //   }
  // }, [getDecibel, isRecording, updateTime, mode]);

  useEffect(() => {
    const subscribeData = onDidFinishPlayingAudio(async data => {
      if (data.playerKey === `PlayerFor${path}`) {
        if (data.finishType === FinishMode.stop) {
          setPlayerState(PlayerState.stopped);
          setCurrentProgress(0);
          await preparePlayerForPath();
        }
      }
    });
    const subscribeData2 = onCurrentDuration(data => {
      if (data.playerKey === `PlayerFor${path}`) {
        setCurrentProgress(data.currentDuration);
      }
    });
    const subscribeData3 = onCurrentExtractedWaveformData(() => {
      // write logic for subscription
    });

    const subscribeData4 = onCurrentRecordingWaveformData(result => {
      if (mode === 'live') {
        if (!isNil(result.currentDecibel)) {
          setWaveform(prev => [...prev, result.currentDecibel]);
          if (scrollRef.current) {
            scrollRef.current.scrollToEnd({ animated: true });
          }
        }
      }
    });
    return () => {
      subscribeData.remove();
      subscribeData2.remove();
      subscribeData3.remove();
      subscribeData4.remove();
    };
  }, []);

  useEffect(() => {
    if (!isNil(onPlayerStateChange)) {
      (onPlayerStateChange as Function)(playerState);
    }
  }, [playerState]);

  useEffect(() => {
    if (!isNil(onRecorderStateChange)) {
      (onRecorderStateChange as Function)(recorderState);
    }
  }, [recorderState]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setPanMoving(true);
        (onPanStateChange as Function)(true);
        if (playerState === PlayerState.playing) {
          pausePlayerAction();
        }
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
}) as <T extends StaticOrLive>(
  props: WaveformWithStandardRef<T>
) => ReactElement | null;
