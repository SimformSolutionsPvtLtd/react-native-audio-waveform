export enum DurationType {
  current,
  max,
}

export enum NativeEvents {
  onDidFinishPlayingAudio = 'onDidFinishPlayingAudio',
  onCurrentDuration = 'onCurrentDuration',
  onCurrentExtractedWaveformData = 'onCurrentExtractedWaveformData',
  onCurrentRecordingWaveformData = 'onCurrentRecordingWaveformData',
}

export enum PermissionStatus {
  denied = 'denied',
  undetermined = 'undetermined',
  granted = 'granted',
}

export enum FinishMode {
  loop = 0,
  pause = 1,
  stop = 2,
}

export enum PlayerState {
  playing = 'playing',
  paused = 'paused',
  stopped = 'stopped',
}

export enum RecorderState {
  recording = 'recording',
  paused = 'paused',
  stopped = 'stopped',
}

//Note: If you are making change here, please make sure to make change in iOS and Android side as well other wise there will be mismatch in value
//Use same values in iOS and Android side as well
export enum UpdateFrequency {
  high = 250.0,
  medium = 500.0,
  low = 1000.0,
}

export const playbackSpeedThreshold = 2.0;
