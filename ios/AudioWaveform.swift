//
//  AudioWaveforms.swift
//  Waveforms
//
//  Created by Viraj Patel on 12/09/23.
//

import UIKit

@objc(AudioWaveform)
class AudioWaveform: RCTEventEmitter {
  final var audioRecorder = AudioRecorder()
  var audioPlayers = [String: AudioPlayer]()
  var extractors = [String: WaveformExtractor]()
  
  override init() {
    super.init()
    NotificationCenter.default.addObserver(self, selector: #selector(didReceiveMeteringLevelUpdate),
                                           name: .audioRecorderManagerMeteringLevelDidUpdateNotification, object: nil)
  }
  
  deinit {
    audioPlayers.removeAll()
    extractors.removeAll()
    NotificationCenter.default.removeObserver(self)
  }
  
  @objc private func didReceiveMeteringLevelUpdate(_ notification: Notification) {
    let percentage = notification.userInfo?[Constants.waveformData] as? Float
    DispatchQueue.main.async {
       print("current power: \(String(describing: notification.userInfo)) dB \(percentage)")
    }
  }
  
    @objc
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
  // we need to override this method and
  // return an array of event names that we can listen to
  override func supportedEvents() -> [String]! {
    return ["AudioPlayerEvent"]
  }
  
  @objc func checkHasAudioRecorderPermission(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
    audioRecorder.checkHasAudioRecorderPermission(resolve)
  }
    
    @objc func checkHasAudioReadPermission(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
        // iOS does not need to ask for permission to read files so this will resolve "granted" every time
        resolve("granted")
    }

    @objc func getAudioReadPermission(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
        // iOS does not need to ask for permission to read files so this will resolve "granted" every time
        resolve("granted")
    }
  
  @objc func getAudioRecorderPermission(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
    audioRecorder.getAudioRecorderPermission(resolve)
  }

  @objc func markPlayerAsUnmounted() {    
    if audioPlayers.isEmpty {
      return
    }
    
    for (_, player) in audioPlayers {
      player.markPlayerAsUnmounted()
    }
  }
  
  @objc func startRecording(_ args: NSDictionary?, resolver resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
    audioRecorder.startRecording(args?[Constants.path] as? String,
                                 encoder: args?[Constants.encoder] as? Int,
                                 updateFrequency: UpdateFrequency(rawValue: (args?[Constants.updateFrequency]) as? Double ?? 0) ?? UpdateFrequency.medium,
                                 sampleRate: args?[Constants.sampleRate] as? Int,
                                 bitRate: args?[Constants.bitRate] as? Int,
                                 fileNameFormat: args?[Constants.fileNameFormat] as? String,
                                 useLegacy: args?[Constants.useLegacyNormalization] as? Bool,
                                 resolver: resolve,
                                 rejecter: reject)
  }
  
  @objc func stopRecording(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
    audioRecorder.stopRecording(resolve, rejecter: reject)
  }
  
  @objc func pauseRecording(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
    audioRecorder.pauseRecording(resolve)
  }
  
  @objc func resumeRecording(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
    audioRecorder.resumeRecording(resolve)
  }
  
  @objc func getDecibel(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
    audioRecorder.getDecibel(resolve)
  }
  
  @objc func extractWaveformData(_ args: NSDictionary?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
    let key = args?[Constants.playerKey] as? String
    let path = args?[Constants.path] as? String
    let noOfSamples = args?[Constants.noOfSamples] as? Int
    if(key != nil) {
      createOrUpdateExtractor(playerKey: key!, path: path, noOfSamples: noOfSamples, resolve: resolve, rejecter: reject)
    } else {
      reject(Constants.audioWaveforms,"Can not get waveform data",nil)
    }
  }
  
  func createOrUpdateExtractor(playerKey: String, path: String?, noOfSamples: Int?, resolve: @escaping RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    if(!(path ?? "").isEmpty) {
      do {
        let audioUrl = URL.init(string: path!)
        if(audioUrl == nil){
          reject(Constants.audioWaveforms, "Failed to initialise Url from provided audio file If path contains `file://` try removing it", nil)
            return
        }
        let newExtractor = try WaveformExtractor(url: audioUrl!, channel: self, resolve: resolve, rejecter: reject)
        extractors[playerKey] = newExtractor
        let data = newExtractor.extractWaveform(samplesPerPixel: noOfSamples, playerKey: playerKey)
        newExtractor.cancel()
        if(newExtractor.progress == 1.0) {
          // Normalize the waveform data
          let normalizedData = normalizeWaveformData(data: data!, scale: 0.12)
          let waveformData = newExtractor.getChannelMean(data: normalizedData)
          resolve([waveformData])
        }
      } catch let e {
        reject(Constants.audioWaveforms, "Failed to decode audio file", e)
      }
    } else {
      reject(Constants.audioWaveforms, "Audio file path can't be empty or null", nil)
      
    }
  }

  func normalizeWaveformData(data: [[Float]], scale: Float = 0.25, threshold: Float = 0.01) -> [[Float]] {
    return data.map { channelData in
      let filteredData = channelData.filter { abs($0) >= threshold }
      let maxAmplitude = filteredData.max() ?? 1.0
      guard maxAmplitude > 0 else { return channelData }
      return channelData.map { (abs($0) < threshold ? 0 : ($0 / maxAmplitude) * scale) }
    }
  }
  
  // Plyer
  @objc func preparePlayer(_ args: NSDictionary?, resolver resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
    let key = args?[Constants.playerKey] as? String
    if(key != nil){
      initPlayer(playerKey: key!)
      audioPlayers[key!]?.preparePlayer(args?[Constants.path] as? String,
                                        volume: args?[Constants.volume] as? Double,
                                        updateFrequency: UpdateFrequency(rawValue: (args?[Constants.updateFrequency]) as? Double ?? 0) ?? UpdateFrequency.medium,
                                        time: args?[Constants.progress] as? Double ?? 0,
                                        resolver: resolve,
                                        rejecter: reject)
    } else {
      reject(Constants.audioWaveforms, "Can not prepare player", nil)
    }
  }
  
  @objc func startPlayer(_ args: NSDictionary?, resolver resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
    let key = args?[Constants.playerKey] as? String
    let finishMode = args?[Constants.finishMode] as? Int
    let speed = (args?[Constants.speed] as? NSNumber)?.floatValue ?? 1.0
      
    if(key != nil && audioPlayers[key!] != nil){
        audioPlayers[key!]?.startPlayer(finishMode, speed: speed, result:resolve)
    } else {
      reject(Constants.audioWaveforms, "Can not start player", nil)
    }
  }
  
  @objc func pausePlayer(_ args: NSDictionary?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
    let key = args?[Constants.playerKey] as? String
    if(key != nil && audioPlayers[key!] != nil){
      audioPlayers[key!]?.pausePlayer(result: resolve)
    } else {
      reject(Constants.audioWaveforms, "Can not pause player, Player key is null", nil)
    }
  }
  
  @objc func stopPlayer(_ args: NSDictionary?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
    let key = args?[Constants.playerKey] as? String
    if(key != nil){
      audioPlayers[key!]?.stopPlayer()
      audioPlayers[key!] = nil // Release the player after stopping it
      resolve(true)
    } else {
      reject(Constants.audioWaveforms, "Can not stop player, Player key is null", nil)
    }
  }
  
  @objc func seekToPlayer(_ args: NSDictionary?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
    let key = args?[Constants.playerKey] as? String
    if(key != nil && audioPlayers[key!] != nil){
      audioPlayers[key!]?.seekTo(args?[Constants.progress] as? Double,resolve)
    } else {
      reject(Constants.audioWaveforms, "Can not seek to postion, Player key is null", nil)
    }
  }
  
  @objc func setVolume(_ args: NSDictionary?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
    let key = args?[Constants.playerKey] as? String
    if(key != nil && audioPlayers[key!] != nil){
      audioPlayers[key!]?.setVolume(args?[Constants.volume] as? Double,resolve)
    } else {
      reject(Constants.audioWaveforms, "Can not set volume, Player key is null", nil)
    }
  }
  
  @objc func getDuration(_ args: NSDictionary?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
    let type = args?[Constants.durationType] as? Int
    let key = args?[Constants.playerKey] as? String
    if(key != nil && audioPlayers[key!] != nil){
      do{
        if(type == 0) {
          try audioPlayers[key!]?.getDuration(DurationType.Current,resolve)
        } else {
          try audioPlayers[key!]?.getDuration(DurationType.Max,resolve)
        }
      } catch let e {
        reject(Constants.audioWaveforms, "Failed to get duration", e)
      }
    } else {
      reject(Constants.audioWaveforms, "Can not get duration", nil)
    }
  }
  
  @objc func stopAllPlayers(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
    for (playerKey,_) in audioPlayers{
      audioPlayers[playerKey]?.stopPlayer()
    }
    audioPlayers.removeAll()
    resolve(true)
  }
  
  @objc func stopAllWaveFormExtractors(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
    for (extractorKey,_) in extractors{
      extractors[extractorKey]?.cancel()
    }
    extractors.removeAll()
    resolve(true)
  }
  
  
  func getUpdateFrequency(freq: Int?) -> Int{
    if(freq == 2){
      return 50
    } else if(freq == 1){
      return 100
    }
    return 200
  }
  
  func initPlayer(playerKey: String) {
    if audioPlayers[playerKey] == nil {
      let newPlayer = AudioPlayer(plugin: self,playerKey: playerKey, channel: "Waveforms" as AnyObject)
      audioPlayers[playerKey] = newPlayer
    }
  }
    
    @objc func setPlaybackSpeed(_ args: NSDictionary?,
                                resolver resolve: @escaping RCTPromiseResolveBlock,
                                rejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
        let key = args?[Constants.playerKey] as? String
        let speed = (args?[Constants.speed] as? NSNumber)?.floatValue ?? 1.0
        
        if(key != nil){
          let status =  audioPlayers[key!]?.setPlaybackSpeed(speed)
          resolve(status)
        } else {
          reject(Constants.audioWaveforms, "Can not pause player, Player key is null", nil)
        }
    }
}
