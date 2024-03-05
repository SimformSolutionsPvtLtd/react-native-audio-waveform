![Audio Waveform - Simform](./assets/react_native_audiowave.gif)

# react-native-audio-waveform

[![react-native-audio-waveform on npm](https://img.shields.io/npm/v/react-native-audio-waveform.svg?&logo=npm&logoColor=white&color=red&labelColor=grey&cacheSeconds=3600&maxAge=86400)](https://www.npmjs.com/package/react-native-audio-waveform) [![react-native-audio-waveform downloads](https://img.shields.io/npm/dm/react-native-audio-waveform?&logo=npm&logoColor=white&color=blue&labelColor=grey&cacheSeconds=3600&maxAge=86400)](https://www.npmtrends.com/react-native-audio-waveform) [![react-native-audio-waveform install size](https://packagephobia.com/badge?p=react-native-audio-waveform?&icon=disk&logoColor=white&color=yellow&labelColor=grey&cacheSeconds=3600&maxAge=86400)](https://packagephobia.com/result?p=react-native-audio-waveform) [![Android](https://img.shields.io/badge/Platform-Android-green?logo=android&logoColor=white&labelColor=grey)](https://www.android.com) [![iOS](https://img.shields.io/badge/Platform-iOS-green?logo=apple&logoColor=white&labelColor=grey)](https://developer.apple.com/ios) [![MIT](https://img.shields.io/badge/License-MIT-green&labelColor=grey)](https://opensource.org/licenses/MIT)

---

A React Native package featuring native modules for generating and rendering audio waveforms. Designed to efficiently produce visual representations for pre-recorded audio files and dynamically draw waveforms in real-time during audio recording within React Native applications.

---

## 🎬 Preview

| Audio Playback Waveform                                                                                                                                                                  | Audio Record Waveform                                                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| <a href="https://github.com/SimformSolutionsPvtLtd/react-native-audio-waveform"><img width="352px;"  height="640px;" alt="AudioPlaybackWaveform" src="./assets/audio_playback.gif"> </a> | <a href="https://github.com/SimformSolutionsPvtLtd/react-native-audio-waveform"><img width="352px;"  height="640px;" alt="AudioRecordWaveform" src="./assets/audio_record.gif"> </a> |

## Quick Access

- [Installation](#installation)
- [Usage and Examples](#usage)
- [Properties](#properties)
- [Example Code](#example)
- [License](#license)

## Getting Started 🔧

Here's how to get started with react-native-audio-waveform in your React Native project:

### Installation

##### 1. Install the package

```sh
npm install react-native-audio-waveform react-native-gesture-handler
```

###### --- or ---

```sh
yarn add react-native-audio-waveform react-native-gesture-handler
```

##### 2. Install cocoapods in the ios project

```bash
npx pod-install
```

##### Know more about [react-native-gesture-handler](https://www.npmjs.com/package/react-native-gesture-handler)

##### 3. Add Audio Recording Permissions

##### iOS

If you want to use recorder features in iOS, you have to add **NSMicrophoneUsageDescription** permission in info.plist and add description based on your use-case.

Here is a sample for info.plist permission and description

```
<key>NSMicrophoneUsageDescription</key>
<string>Needed permission to record audio</string>
```

##### Android

If you want to use recorder features in Android, you have to add **RECORD_AUDIO** permission in AndroidManifest.xml

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

### Usage

#### 1. Static waveform

When you want to show a waveform for pre-existing audio file you need to use `static` mode for the waveform. We have provided type safety for forward ref so that if you pass the `static` mode then you can only assign ref type of `IPlayWaveformRef` to the waveform.

Check below example for more information.

```tsx
import { Waveform, type IPlayWaveformRef } from 'react-native-audio-waveform';

const path = ''; // path to the audio file for which you want to show waveform
const ref = useRef<IPlayWaveformRef>(null);
<Waveform<'static'>
  mode="static"
  ref={ref}
  path={item}
  candleSpace={2}
  candleWidth={4}
  scrubColor="white"
  onPlayerStateChange={playerState => console.log(playerState)}
  onPanStateChange={isMoving => console.log(isMoving)}
/>;
```

#### 2. Live recording waveform

When you want to record a audio and show waveform for that recording, you need to create waveform with `live` mode. Same as `static` mode we have type safety for ref. You can only provide `IRecordWaveformRef` to `live` mode waveform.

Check below example for more information.

```tsx
import { Waveform, type IRecordWaveformRef } from 'react-native-audio-waveform';

const ref = useRef<IRecordWaveformRef>(null);
<Waveform<'live'>
  mode="live"
  ref={ref}
  candleSpace={2}
  candleWidth={4}
  onRecorderStateChange={recorderState => console.log(recorderState)}
/>;
```

you can check full example at [Example](./example/src/App.tsx).

---

## Properties

| **Props**             | **defult** | **Available for** | **type**                                  | **description**                                                                                                                                                                                                                                                                                                                                              |
| --------------------- | ---------- | ----------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| mode\*                | -          | both              | 'live' or 'static'                        | Type of waveform. It can be either `static` for resources file or `live` if you want to record audio                                                                                                                                                                                                                                                         |
| ref\*                 | -          | both              | IPlayWaveformRef or IRecordWaveformRef    | Type of ref provided to waveform component. If waveform mode is `static`, ref type must be `IPlayWaveformRef` and if waveform mode is `live`, ref type must be `IRecordWaveformRef`.<br> Check [IPlayWaveformRef](#iplaywaveformref-methods) and [IRecordWaveformRef](#irecordwaveformref-methods) for more details about which methods these refs provides. |
| path\*                | -          | static            | string                                    | Used for `static` type. It is resource path of audio source file.                                                                                                                                                                                                                                                                                            |
| candleSpace           | 2          | both              | number                                    | Space between two candlestick of waveform                                                                                                                                                                                                                                                                                                                    |
| candleWidth           | 5          | both              | number                                    | Width of single candlestick of waveform                                                                                                                                                                                                                                                                                                                      |
| containerStyle        | -          | both              | `StyleProp<ViewStyle>`                    | style of the container                                                                                                                                                                                                                                                                                                                                       |
| waveColor             | #545454    | both              | string                                    | colour of candlestick of waveform                                                                                                                                                                                                                                                                                                                            |
| scrubColor            | #7b7b7b    | static            | string                                    | colour of candlestick of waveform which has played                                                                                                                                                                                                                                                                                                           |
| onPlayerStateChange   | -          | static            | ( playerState : PlayerState ) => void     | callback function which returns player state whenever player state changes.                                                                                                                                                                                                                                                                                  |
| onPanStateChange      | -          | static            | ( panMoving : boolean ) => void           | callback function which returns boolean indicating whether pan gesture is active or not.                                                                                                                                                                                                                                                                     |
| onRecorderStateChange | -          | live              | ( recorderState : RecorderState ) => void | callback function which returns the recorder state whenever the recorder state changes. Check RecorderState for more details                                                                                                                                                                                                                                 |

##### Know more about [ViewStyle](https://reactnative.dev/docs/view-style-props), [PlayerState](#playerstate), and [RecorderState](#recorderstate)

---

### Methods

#### IPlayWaveformRef methods

#### startPlayer()

```ts
startPlayer({
  finishMode?: FinishMode;
}): Promise<boolean>
```

starts playing the audio with the specified finish mode. If finish mode is not specified it will defaults to `FinishMode.stop`.

It returns boolean indicating whether playback is started.

#### stopPlayer()

```ts
stopPlayer(): Promise<boolean>
```

It returns boolean indicating whether playback is stopped.

#### pausePlayer()

```ts
pausePlayer(): Promise<boolean>
```

It returns boolean indicating whether playback is paused.

#### resumePlayer()

```ts
resumePlayer(): Promise<boolean>
```

It returns boolean indicating whether playback is resumed again.

#### IRecordWaveformRef methods

#### startRecord()

```ts
startRecord({
  encoder: number;
  sampleRate: number;
  bitRate: number;
  fileNameFormat: string;
  useLegacy: boolean;
  updateFrequency?: UpdateFrequency;
}): Promise<boolean>;
```

Start a new audio recording with given parameters. It will return the if recording was started or not.

Check [UpdateFrequency](#updatefrequency) to know more.

> Note: Before starting the recording, User must have to allow **NSMicrophoneUsageDescription** for iOS. You can check the permissions by using **_checkHasAudioRecorderPermission_** from **_useAudioPermission_**. Check [useAudioPermission](#useaudiopermission-hook) to know more about various methods.

#### stopRecord()

```ts
stopRecord(): Promise<string>
```

It returns string representing the current recorded audio file path.

#### pauseRecord()

```ts
pauseRecord(): Promise<boolean>
```

It returns boolean indicating whether recording is paused.

#### resumeRecord()

```ts
resumeRecord(): Promise<boolean>
```

It returns boolean indicating whether recording is resumed again.

### useAudioPermission hook

By using this hook you can check and ask for permission from user for **NSMicrophoneUsageDescription** permission.

#### checkHasAudioRecorderPermission()

This method checks whether user has permission to use Microphone for recording new audio. It will return [PermissionStatus](#permissionstatus).

you can use this method as shown below:

```ts
const hasPermission: PermissionStatus = await checkHasAudioRecorderPermission();
```

#### getAudioRecorderPermission()

This method lets you ask for **NSMicrophoneUsageDescription** permission from user. It will return PermissionStatus.

By combining this and checkHasAudioRecorderPermission you can ask for permission and start recording if permission is granted.

Check the following example for example:

```ts
let hasPermission: PermissionStatus = await checkHasAudioRecorderPermission();

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
```

---

#### PlayerState

```ts
enum PlayerState {
  playing = 'playing',
  paused = 'paused',
  stopped = 'stopped',
}
```

#### RecorderState

```ts
enum RecorderState {
  recording = 'recording',
  paused = 'paused',
  stopped = 'stopped',
}
```

#### UpdateFrequency

```ts
// Update frequency in milliseconds
enum UpdateFrequency {
  high = 250.0,
  medium = 500.0,
  low = 1000.0,
}
```

#### PermissionStatus

```ts
enum PermissionStatus {
  denied = 'denied',
  undetermined = 'undetermined',
  granted = 'granted',
}
```

---

## Example

you check out the example app for react-native-audio-waveform in [Example](./example/src/App.tsx)

To use example app you need to first run below

```bash
cd example && npx react-native-asset
```

This command will our example audio sample files to iOS bundle so that we can access them inside iOS app.

```sh
yarn
yarn example ios   // For iOS
yarn example android   // For Android
```

## Find this library useful? ❤️

Support it by joining [stargazers](https://github.com/SimformSolutionsPvtLtd/react-native-audio-waveform/stargazers) for this repository.⭐

## Bugs / Feature requests / Feedbacks

For bugs, feature requests, and discussion please use [GitHub Issues](https://github.com/SimformSolutionsPvtLtd/react-native-audio-waveform/issues/new?labels=bug&late=BUG_REPORT.md&title=%5BBUG%5D%3A), [GitHub New Feature](https://github.com/SimformSolutionsPvtLtd/react-native-audio-waveform/issues/new?labels=enhancement&late=FEATURE_REQUEST.md&title=%5BFEATURE%5D%3A), [GitHub Feedback](https://github.com/SimformSolutionsPvtLtd/react-native-audio-waveform/issues/new?labels=enhancement&late=FEATURE_REQUEST.md&title=%5BFEEDBACK%5D%3A)

## 🤝 How to Contribute

We'd love to have you improve this library or fix a problem 💪
Check out our [Contributing Guide](CONTRIBUTING.md) for ideas on contributing.

## Awesome Mobile Libraries

- Check out our other [available awesome mobile libraries](https://github.com/SimformSolutionsPvtLtd/Awesome-Mobile-Libraries)

## License

- [MIT License](./LICENSE)
