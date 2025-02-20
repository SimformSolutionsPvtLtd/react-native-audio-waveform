import clamp from 'lodash/clamp';
import floor from 'lodash/floor';
import head from 'lodash/head';
import isEmpty from 'lodash/isEmpty';
import isNil from 'lodash/isNil';
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
  playbackSpeedThreshold,
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
    // The maximum number of candles set in the waveform. Once this limit is reached, the oldest candle will be removed as a new one is added to the waveform.
    maxCandlesToRender = 300,
    mode,
    path,
    volume = 3,
    // The playback speed of the audio player. A value of 1.0 represents normal playback speed.
    playbackSpeed = 1.0,
    candleSpace = 2,
    candleWidth = 5,
    containerStyle = {},
    waveColor,
    scrubColor,
    onPlayerStateChange,
    onRecorderStateChange,
    onPanStateChange = () => {},
    onError = (_error: Error) => {},
    onCurrentProgressChange = () => {},
    candleHeightScale = 3,
    onChangeWaveformLoadState = (_state: boolean) => {},
    showsHorizontalScrollIndicator = false,
  } = props as StaticWaveform & LiveWaveform;
  const viewRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);
  const isLayoutCalculated = useRef<boolean>(false);
  const isAutoPaused = useRef<boolean>(false);
  const isAudioPlaying = useRef<boolean>(false);
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
  const [isWaveformExtracted, setWaveformExtracted] = useState(false);
  const audioSpeed: number =
    playbackSpeed > playbackSpeedThreshold ? 1.0 : playbackSpeed;

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
    setPlaybackSpeed,
    markPlayerAsUnmounted,
  } = useAudioPlayer();

  const { startRecording, stopRecording, pauseRecording, resumeRecording } =
    useAudioRecorder();

  const { checkHasAudioRecorderPermission } = useAudioPermission();

  /**
   * Updates the playback speed of the audio player.
   *
   * @param speed - The new playback speed to set.
   * @returns A Promise that resolves when the playback speed has been updated.
   * @throws An error if there was a problem updating the playback speed.
   */
  const updatePlaybackSpeed = async (speed: number) => {
    try {
      await setPlaybackSpeed({ speed, playerKey: `PlayerFor${path}` });
    } catch (error) {
      console.error('Error updating playback speed', error);
    }
  };

  useEffect(() => {
    updatePlaybackSpeed(audioSpeed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioSpeed]);

  const preparePlayerForPath = async (progress?: number) => {
    if (!isNil(path) && !isEmpty(path)) {
      try {
        const prepare = await preparePlayer({
          path,
          playerKey: `PlayerFor${path}`,
          updateFrequency: UpdateFrequency.medium,
          volume: volume,
          progress,
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
        const audioDuration = Number(duration);
        setSongDuration(audioDuration > 0 ? audioDuration : 0);
        return Promise.resolve(audioDuration);
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
        const duration = await getAudioDuration();
        if (duration < 0) {
          await getAudioDuration();
        }
      }
    } catch (err) {
      onError(err as Error);
    }
  };

  const getAudioWaveFormForPath = async (noOfSample: number) => {
    if (!isNil(path) && !isEmpty(path)) {
      try {
        onChangeWaveformLoadState(true);
        const result = await extractWaveformData({
          path: path,
          playerKey: `PlayerFor${path}`,
          noOfSamples: Math.max(noOfSample, 1),
        });
        onChangeWaveformLoadState(false);

        if (!isNil(result) && !isEmpty(result)) {
          const waveforms = head(result);
          if (!isNil(waveforms) && !isEmpty(waveforms)) {
            setWaveform(waveforms);
            await preparePlayerAndGetDuration();
            setWaveformExtracted(true);
          }
        }
      } catch (err) {
        onChangeWaveformLoadState(false);
        onError(err as Error);
      }
    } else {
      onError(
        new Error(`Can not find waveform for mode ${mode} path: ${path}`)
      );
    }
  };

  const stopPlayerAction = async (resetProgress = true) => {
    if (mode === 'static') {
      try {
        const result = await stopPlayer({
          playerKey: `PlayerFor${path}`,
        });
        isAudioPlaying.current = false;
        if (!isNil(result) && result) {
          if (resetProgress) {
            setCurrentProgress(0);
          }

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
        isAudioPlaying.current = true;
        if (playerState === PlayerState.stopped) {
          if (isWaveformExtracted) {
            await preparePlayerForPath(currentProgress);
          } else {
            await getAudioWaveFormForPath(noOfSamples);
          }
        }

        const play = await playPlayer({
          finishMode: FinishMode.stop,
          playerKey: `PlayerFor${path}`,
          path: path,
          speed: audioSpeed,
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
        if (playerState === PlayerState.paused) {
          // If the player is not prepared, triggering the stop will reset the player for next click. Fix blocked paused player after a call to `stopAllPlayers`
          await stopPlayerAction();
        }

        return Promise.reject(error);
      }
    } else {
      return Promise.reject(
        new Error('error in starting player: mode is not static')
      );
    }
  };

  const pausePlayerAction = async (changePlayerState = true) => {
    if (mode === 'static') {
      try {
        isAudioPlaying.current = false;
        const pause = await pausePlayer({
          playerKey: `PlayerFor${path}`,
        });
        if (pause) {
          if (changePlayerState) {
            setPlayerState(PlayerState.paused);
          }

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

      // when orientation changes, the layout needs to be recalculated
      if (viewLayout?.x === 0 && viewLayout?.y === 0) {
        isLayoutCalculated.current = false;
      }

      setNoOfSamples(getNumberOfSamples);
      if (mode === 'static') {
        getAudioWaveFormForPath(getNumberOfSamples);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewLayout?.width, mode, candleWidth, candleSpace]);

  const seekToPlayerAction = async () => {
    if (!isNil(seekPosition)) {
      if (mode === 'static') {
        const seekAmount =
          (seekPosition?.pageX - (viewLayout?.x ?? 0)) /
          (viewLayout?.width ?? 1);
        const clampedSeekAmount = clamp(seekAmount, 0, 1);

        if (!panMoving) {
          try {
            await seekToPlayer({
              playerKey: `PlayerFor${path}`,
              progress: clampedSeekAmount * songDuration,
            });
          } catch (e) {
            if (playerState === PlayerState.paused) {
              // If the player is not prepared, triggering the stop will reset the player for next click. Fix blocked paused player after a call to `stopAllPlayers`
              await stopPlayerAction(false);
            }
          }

          if (playerState === PlayerState.playing) {
            startPlayerAction();
          }
        }

        setCurrentProgress(clampedSeekAmount * songDuration);
      }
    }
  };

  useEffect(() => {
    seekToPlayerAction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seekPosition, panMoving, mode, songDuration]);

  useEffect(() => {
    const tracePlayerState = onDidFinishPlayingAudio(async data => {
      if (data.playerKey === `PlayerFor${path}`) {
        if (data.finishType === FinishMode.stop) {
          stopPlayerAction();
        } else if (data.finishType === FinishMode.pause) {
          setPlayerState(PlayerState.paused);
        }
      }
    });

    const tracePlaybackValue = onCurrentDuration(data => {
      if (data.playerKey === `PlayerFor${path}`) {
        const currentAudioDuration = Number(data.currentDuration);

        if (!isNaN(currentAudioDuration)) {
          setCurrentProgress(currentAudioDuration);
        } else {
          setCurrentProgress(0);
        }
      }
    });

    const traceRecorderWaveformValue = onCurrentRecordingWaveformData(
      result => {
        if (mode === 'live') {
          if (!isNil(result.currentDecibel)) {
            setWaveform((previousWaveform: number[]) => {
              // Add the new decibel to the waveform
              const updatedWaveform: number[] = [
                ...previousWaveform,
                result.currentDecibel,
              ];

              // Limit the size of the waveform array to 'maxCandlesToRender'
              return updatedWaveform.length > maxCandlesToRender
                ? updatedWaveform.slice(1)
                : updatedWaveform;
            });
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
      markPlayerAsUnmounted();
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
        pausePlayerAction(false);
        isAutoPaused.current = true;
      }
    } else {
      if (playerState === PlayerState.paused && isAutoPaused.current) {
        startPlayerAction();
      }

      isAutoPaused.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panMoving]);

  const calculateLayout = (): void => {
    viewRef.current?.measureInWindow((x, y, width, height) => {
      setViewLayout({ x, y, width, height });
      if (x !== 0 || y !== 0) {
        // found the position of view in window
        isLayoutCalculated.current = true;
      }
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        if (!isLayoutCalculated.current) {
          calculateLayout();
        }

        return true;
      },
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
      onPanResponderRelease: e => {
        setSeekPosition(e.nativeEvent);
        (onPanStateChange as Function)(false);
        setPanMoving(false);
      },
    })
  ).current;

  useEffect(() => {
    if (!isNil(onCurrentProgressChange)) {
      (onCurrentProgressChange as Function)(currentProgress, songDuration);
    }
  }, [currentProgress, songDuration, onCurrentProgressChange]);

  /* Ensure that the audio player is released (or stopped) once the song's duration is determined, 
  especially if the audio is not playing immediately after loading */
  useEffect(() => {
    if (
      songDuration !== 0 &&
      mode === 'static' &&
      isAudioPlaying.current !== true
    ) {
      isAudioPlaying.current = false;
      stopPlayerAction(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songDuration]);

  useImperativeHandle(ref, () => ({
    startPlayer: startPlayerAction,
    stopPlayer: stopPlayerAction,
    pausePlayer: pausePlayerAction,
    resumePlayer: startPlayerAction,
    startRecord: startRecordingAction,
    pauseRecord: pauseRecordingAction,
    stopRecord: stopRecordingAction,
    resumeRecord: resumeRecordingAction,
    currentState: mode === 'static' ? playerState : recorderState,
    playerKey: path,
  }));

  return (
    <View style={[styles.waveformContainer, containerStyle]}>
      <View
        ref={viewRef}
        style={styles.waveformInnerContainer}
        onLayout={calculateLayout}
        {...(mode === 'static' ? panResponder.panHandlers : {})}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
          ref={scrollRef}
          style={styles.scrollContainer}
          scrollEnabled={mode === 'live'}>
          {waveform?.map?.((amplitude, indexCandle) => (
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
                candleHeightScale,
              }}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
});
