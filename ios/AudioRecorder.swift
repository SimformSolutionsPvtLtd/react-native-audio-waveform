//
//  AudioRecorder.swift
//  Waveforms
//
//  Created by Viraj Patel on 12/09/23.
//

import AVFoundation
import Accelerate
import UIKit

public class AudioRecorder: NSObject, AVAudioRecorderDelegate{
  var audioRecorder: AVAudioRecorder?
  var path: String?
  var useLegacyNormalization: Bool = false
  var audioUrl: URL?
  var recordedDuration: CMTime = CMTime.zero
  private var timer: Timer?
    var updateFrequency = UpdateFrequency.medium
  
  private func createAudioRecordPath(fileNameFormat: String?) -> URL? {
    let format = DateFormatter()
    format.dateFormat = fileNameFormat ?? "yyyy-MM-dd-HH-mm-ss-SSS"
    let currentFileName = "\(format.string(from: Date()))" + ".m4a"
    let documentsDirectory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
    let url = documentsDirectory.appendingPathComponent(currentFileName)
    return url
  }
  
    func startRecording(_ path: String?, encoder : Int?, updateFrequency: UpdateFrequency, sampleRate : Int?, bitRate : Int?, fileNameFormat: String?, useLegacy: Bool?, resolver resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
    useLegacyNormalization = useLegacy ?? false
      self.updateFrequency = updateFrequency
    let settings = [
      AVFormatIDKey: getEncoder(encoder ?? 0),
      AVSampleRateKey: sampleRate ?? 44100,
      AVNumberOfChannelsKey: 1,
      AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue,
      AVEncoderBitRateKey: bitRate ?? 128000
    ]
    let settingsWithBitrate = [
      AVEncoderBitRateKey: bitRate ?? 128000,
      AVFormatIDKey: getEncoder(encoder ?? 0),
      AVSampleRateKey: sampleRate ?? 44100,
      AVNumberOfChannelsKey: 1,
      AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
    ]
    
    let options: AVAudioSession.CategoryOptions = [.defaultToSpeaker, .allowBluetooth, .mixWithOthers]

    if (path == nil) {
      guard let newPath = self.createAudioRecordPath(fileNameFormat: fileNameFormat) else {
        reject(Constants.audioWaveforms, "Failed to initialise file URL", nil)
        return
      }
      audioUrl = newPath
    } else {
      audioUrl = URL(fileURLWithPath: path!)
    }
    
    
    do {
      try AVAudioSession.sharedInstance().setCategory(AVAudioSession.Category.playAndRecord, options: options)
      try AVAudioSession.sharedInstance().setActive(true)
      guard let newPath = audioUrl else {
        reject(Constants.audioWaveforms, "Failed to initialise file URL", nil)
        return
      }
      audioRecorder = try AVAudioRecorder(url: newPath, settings: settings as [String : Any])
      audioRecorder?.delegate = self
      audioRecorder?.isMeteringEnabled = true
      audioRecorder?.record()
        startListening()
      resolve(true)
    } catch let error as NSError {
      print(error.localizedDescription)
      reject(Constants.audioWaveforms, "Failed to start recording", error)
    }
  }
    
    @objc func timerUpdate(_ sender:Timer) {
        if (audioRecorder?.isRecording ?? false) {
            EventEmitter.sharedInstance.dispatch(name: Constants.onCurrentRecordingWaveformData, body: [Constants.currentDecibel: getDecibelLevel()])
        }
    }
    
    func startListening() {
      stopListening()
        DispatchQueue.main.async { [weak self] in
          guard let strongSelf = self else {return }
            strongSelf.timer = Timer.scheduledTimer(timeInterval: TimeInterval((Float(strongSelf.updateFrequency.rawValue) / 1000)), target: strongSelf, selector: #selector(strongSelf.timerUpdate(_:)), userInfo: nil, repeats: true)
        }
    }
  
  func stopListening() {
    timer?.invalidate()
    timer = nil
  }
  
  public func stopRecording(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
      stopListening()
    audioRecorder?.stop()
    if(audioUrl != nil) {
      let asset = AVURLAsset(url:  audioUrl!)
      if #available(iOS 15.0, *) {
        Task {
          do {
            recordedDuration = try await asset.load(.duration)
            resolve([asset.url.absoluteString,Int(recordedDuration.seconds * 1000).description])
          } catch let err {
            debugPrint(err.localizedDescription)
            reject(Constants.audioWaveforms, "Failed to stop recording 3", err)
          }
        }
      } else {
        recordedDuration = asset.duration
        resolve([asset.url.absoluteString,Int(recordedDuration.seconds * 1000).description])
      }
    } else {
      reject(Constants.audioWaveforms, "Failed to stop recording", nil)
    }
    audioRecorder = nil
  }
  
  public func pauseRecording(_ resolve: RCTPromiseResolveBlock) -> Void {
    audioRecorder?.pause()
    resolve(true)
  }
  
  public func resumeRecording(_ resolve: RCTPromiseResolveBlock) -> Void {
    audioRecorder?.record()
    resolve(true)
  }
    
    func getDecibelLevel() -> Float {
        audioRecorder?.updateMeters()
        if(useLegacyNormalization){
          let amp = audioRecorder?.averagePower(forChannel: 0) ?? 0.0
            return amp
        } else {
          let amp = audioRecorder?.peakPower(forChannel: 0) ?? 0.0
          let linear = pow(10, amp / 20);
            return linear
        }
    }
  
  public func getDecibel(_ resolve: RCTPromiseResolveBlock) -> Void {
      resolve(getDecibelLevel())
  }
  
  public func checkHasAudioRecorderPermission(_ resolve: RCTPromiseResolveBlock) -> Void{
    var hasPermission = ""
    switch AVAudioSession.sharedInstance().recordPermission{
    case .granted:
      hasPermission = "granted"
      break
    case .undetermined:
      hasPermission = "undetermined"
    case .denied:
      hasPermission = "denied"
    @unknown default:
      hasPermission = "denied"
      break
    }
    resolve(hasPermission)
  }
  
  public func getAudioRecorderPermission(_ resolve: @escaping RCTPromiseResolveBlock) -> Void{
    AVAudioSession.sharedInstance().requestRecordPermission() { allowed in
      DispatchQueue.main.async {
        print("Permission \(allowed)")
        resolve(allowed ? "granted" : "denied")
      }
    }
  }
  
  public func getEncoder(_ enCoder: Int) -> Int {
    switch(enCoder) {
    case Constants.kAudioFormatMPEG4AAC:
      return Int(kAudioFormatMPEG4AAC)
    case Constants.kAudioFormatMPEGLayer1:
      return Int(kAudioFormatMPEGLayer1)
    case Constants.kAudioFormatMPEGLayer2:
      return Int(kAudioFormatMPEGLayer2)
    case Constants.kAudioFormatMPEGLayer3:
      return Int(kAudioFormatMPEGLayer3)
    case Constants.kAudioFormatMPEG4AAC_ELD:
      return Int(kAudioFormatMPEG4AAC_ELD)
    case Constants.kAudioFormatMPEG4AAC_HE:
      return Int(kAudioFormatMPEG4AAC_HE)
    case Constants.kAudioFormatOpus:
      return Int(kAudioFormatOpus)
    case Constants.kAudioFormatAMR:
      return Int(kAudioFormatAMR)
    case Constants.kAudioFormatAMR_WB:
      return Int(kAudioFormatAMR_WB)
    case Constants.kAudioFormatLinearPCM:
      return Int(kAudioFormatLinearPCM)
    case Constants.kAudioFormatAppleLossless:
      return Int(kAudioFormatAppleLossless)
    case Constants.kAudioFormatMPEG4AAC_HE_V2:
      return Int(kAudioFormatMPEG4AAC_HE_V2)
    default:
      return Int(kAudioFormatMPEG4AAC)
    }
  }
}

