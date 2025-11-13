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
  static let INTERRUPTION_STOP_SIGNAL: Float = -999.0
  
  var audioRecorder: AVAudioRecorder?
  var path: String?
  var useLegacyNormalization: Bool = false
  var audioUrl: URL?
  var recordedDuration: CMTime = CMTime.zero
  private var timer: Timer?
    var updateFrequency = UpdateFrequency.medium
  private let instanceId = UUID().uuidString.prefix(8)
  
  override init() {
    super.init()
    print("AudioRecorder: Instance created with ID: \(instanceId)")
    setupAudioSessionNotifications()
  }
  
  deinit {
    NotificationCenter.default.removeObserver(self)
  }
  
  private func setupAudioSessionNotifications() {
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleAudioSessionInterruption(_:)),
      name: AVAudioSession.interruptionNotification,
      object: AVAudioSession.sharedInstance()
    )
  }
  
  @objc private func handleAudioSessionInterruption(_ notification: Notification) {
    guard let typeValue = notification.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
          let type = AVAudioSession.InterruptionType(rawValue: typeValue) else {
      return
    }
    
    switch type {
    case .began:
      guard let recorder = audioRecorder, recorder.isRecording else {
        print("AudioRecorder: [\(instanceId)] Interruption began but not recording")
        return
      }
      
      print("AudioRecorder: [\(instanceId)] Interruption began, stopping recording due to call")
      
      // Stop recording immediately and notify React Native
      recorder.stop()
      stopListening()
      audioRecorder = nil
      
      DispatchQueue.main.async { [weak self] in
        guard let self = self else { return }
        
        if let currentUrl = self.audioUrl {
          EventEmitter.sharedInstance.dispatch(
            name: Constants.onCurrentRecordingWaveformData, 
            body: [
              Constants.currentDecibel: Self.INTERRUPTION_STOP_SIGNAL,
              Constants.filePath: currentUrl.absoluteString
            ]
          )
        } else {
          EventEmitter.sharedInstance.dispatch(
            name: Constants.onCurrentRecordingWaveformData, 
            body: [Constants.currentDecibel: Self.INTERRUPTION_STOP_SIGNAL]
          )
        }
      }
      
    case .ended:
      print("AudioRecorder: [\(instanceId)] Interruption ended")
      // No longer need to do anything here since we stopped recording
      
    @unknown default:
      break
    }
  }
  
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
    
    print("AudioRecorder: [\(instanceId)] Starting new recording")
    
    let settings = [
      AVFormatIDKey: getEncoder(encoder ?? 0),
      AVSampleRateKey: sampleRate ?? 44100,
      AVNumberOfChannelsKey: 1,
      AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue,
      AVEncoderBitRateKey: bitRate ?? 128000
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
    
    print("AudioRecorder: [\(instanceId)] Recording stopped")
    
    // Return the current recording file if it exists
    if let audioUrl = audioUrl {
      print("AudioRecorder: [\(instanceId)] Returning recorded file: \(audioUrl.lastPathComponent)")
      let asset = AVURLAsset(url: audioUrl)
      if #available(iOS 15.0, *) {
        Task {
          do {
            recordedDuration = try await asset.load(.duration)
            resolve([audioUrl.absoluteString, Int(recordedDuration.seconds * 1000).description])
          } catch let err {
            debugPrint(err.localizedDescription)
            reject(Constants.audioWaveforms, "Failed to stop recording", err)
          }
        }
      } else {
        recordedDuration = asset.duration
        resolve([audioUrl.absoluteString, Int(recordedDuration.seconds * 1000).description])
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

s