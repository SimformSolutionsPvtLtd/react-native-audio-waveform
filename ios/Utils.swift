//
//  Utils.swift
//  Waveforms
//
//  Created by Viraj Patel on 12/09/23.
//

import Foundation

enum DurationType {
  case Current
  case Max
}

struct Constants {
  static let methodChannelName = "simform_audio_waveforms_plugin/methods"
  static let audioWaveforms = "AudioWaveforms"
  static let startRecording = "startRecording"
  static let pauseRecording = "pauseRecording"
  static let stopRecording = "stopRecording"
  static let getDecibel = "getDecibel"
  static let checkPermission = "checkPermission"
  static let getPermission = "getPermission"
  static let path = "path"
  static let encoder = "encoder"
  static let sampleRate = "sampleRate"
  static let bitRate = "bitRate"
  static let fileNameFormat = "fileNameFormat"
  static let resumeRecording = "resumeRecording"
  
  static let kAudioFormatMPEG4AAC = 1
  static let kAudioFormatMPEGLayer1 = 2
  static let kAudioFormatMPEGLayer2 = 3
  static let kAudioFormatMPEGLayer3 = 4
  static let kAudioFormatMPEG4AAC_ELD = 5
  static let kAudioFormatMPEG4AAC_HE = 6
  static let kAudioFormatOpus = 7
  static let kAudioFormatAMR = 8
  static let kAudioFormatAMR_WB = 9
  static let kAudioFormatLinearPCM = 10
  static let kAudioFormatAppleLossless = 11
  static let kAudioFormatMPEG4AAC_HE_V2 = 12
  
  static let readAudioFile = "readAudioFile"
  static let durationEventChannel = "durationEventChannel"
  static let startPlayer = "startPlayer"
  static let stopPlayer = "stopPlayer"
  static let pausePlayer = "pausePlayer"
  static let seekTo = "seekTo"
  static let progress = "progress"
  static let setVolume = "setVolume"
  static let volume = "volume"
  static let getDuration = "getDuration"
  static let durationType = "durationType"
  static let preparePlayer = "preparePlayer"
  static let onCurrentDuration = "onCurrentDuration"
  static let currentDuration = "currentDuration"
    static let currentDecibel = "currentDecibel"
  static let playerKey = "playerKey"
  static let stopAllPlayers = "stopAllPlayers"
  static let stopAllWaveFormExtractors = "stopAllWaveFormExtractors"
  static let onDidFinishPlayingAudio = "onDidFinishPlayingAudio"
  static let finishMode = "finishMode"
  static let speed = "speed"
  static let finishType = "finishType"
  static let extractWaveformData = "extractWaveformData"
  static let noOfSamples = "noOfSamples"
  static let onCurrentExtractedWaveformData = "onCurrentExtractedWaveformData"
    static let onCurrentRecordingWaveformData = "onCurrentRecordingWaveformData"
  static let waveformData = "waveformData"
  static let onExtractionProgressUpdate = "onExtractionProgressUpdate"
  static let useLegacyNormalization = "useLegacyNormalization"
  static let updateFrequency = "updateFrequency"
  static let onGetAudioBuffers = "onGetAudioBuffers"
}

enum FinishMode : Int{
  case loop = 0
  case pause = 1
  case stop = 2
}

//Note: If you are making change here, please make sure to make change in Android and React Native side as well other wise there will be mismatch in value
//Use same values in Android and React native side as well
enum UpdateFrequency : Double {
    case high = 250.0
  case medium = 500.0
  case low = 1000.0
}
/// Creates an 2D array of floats
public typealias FloatChannelData = [[Float]]

/// Extension to fill array with zeros
public extension RangeReplaceableCollection where Iterator.Element: ExpressibleByIntegerLiteral {
  init(zeros count: Int) {
    self.init(repeating: 0, count: count)
  }
}
