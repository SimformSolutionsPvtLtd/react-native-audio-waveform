//
//  AudioPlayer.swift
//  Waveforms
//
//  Created by Viraj Patel on 12/09/23.
//

import Foundation
import AVKit

class AudioPlayer: NSObject, AVAudioPlayerDelegate {
  
  private var seekToStart = true
  private var stopWhenCompleted = false
  private var timer: Timer?
  private var player: AVAudioPlayer?
  private var finishMode: FinishMode = FinishMode.stop
    private var updateFrequency = UpdateFrequency.medium
  var plugin: AudioWaveform
  var playerKey: String
  var rnChannel: AnyObject
  private var isComponentMounted: Bool = true // Add flag to track mounted state
  
  init(plugin: AudioWaveform, playerKey: String, channel: AnyObject) {
    self.plugin = plugin
    self.playerKey = playerKey
    self.rnChannel = channel
    super.init()
  }
  
  func preparePlayer(_ path: String?, volume: Double?, updateFrequency: UpdateFrequency, time: Double, resolver resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    if(!(path ?? "").isEmpty) {
      self.updateFrequency = updateFrequency
      isComponentMounted = true
      let audioUrl = URL.init(string: path!)
      if(audioUrl == nil){
        reject(Constants.audioWaveforms, "Failed to initialise Url from provided audio file & If path contains `file://` try removing it", NSError(domain: Constants.audioWaveforms, code: 1))
        return
      }
     
      do {
        player = try AVAudioPlayer(contentsOf: audioUrl!)
        player?.prepareToPlay()
        player?.volume = Float(volume ?? 100.0)
        player?.currentTime = Double(time / 1000)
        player?.enableRate = true
        resolve(true)
      } catch let error as NSError {
        reject(Constants.audioWaveforms, error.localizedDescription, error)
        return
      }
    } else {
      reject(Constants.audioWaveforms, "Audio file path can't be empty or null", NSError(domain: Constants.audioWaveforms, code: 1))
    }
  }

  func markPlayerAsUnmounted() {
    isComponentMounted = false
  }
  
  func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer,
                                   successfully flag: Bool) {
    var finishType = FinishMode.stop.rawValue
    switch self.finishMode {
    case .loop:
      self.player?.currentTime = 0
      self.player?.play()
      finishType = FinishMode.loop.rawValue
    case .pause:
      self.player?.pause()
      stopListening()
      finishType = FinishMode.pause.rawValue
    case .stop:
      self.player?.stop()
      stopListening()
      self.player = nil
      finishType = FinishMode.stop.rawValue
    }
    self.sendEvent(withName: Constants.onDidFinishPlayingAudio, body:  [Constants.finishType: finishType, Constants.playerKey: playerKey])
  }
  
  
  public func sendEvent(withName: String, body: Any?) {
    guard isComponentMounted else {
      return
    }
    EventEmitter.sharedInstance.dispatch(name: withName, body: body)
  }
  
    func startPlayer(_ finishMode: Int?, speed: Float, result: RCTPromiseResolveBlock) {
      if(finishMode != nil && finishMode == 0) {
        self.finishMode = FinishMode.loop
      } else if(finishMode != nil && finishMode == 1) {
        self.finishMode = FinishMode.pause
      } else {
        self.finishMode = FinishMode.stop
      }
      player?.play()
      player?.delegate = self
      player?.rate = Float(speed)
      timerUpdate()
      startListening()
      result(player?.isPlaying)
  }
  
  func pausePlayer(result: @escaping RCTPromiseResolveBlock) {
    stopListening()
    player?.pause()
    timerUpdate()
    result(true)
  }
  
  func stopPlayer() {
    stopListening()
    player?.stop()
    timerUpdate()
    player = nil
    timer = nil
  }
  
  func getDuration(_ type: DurationType, _ result: @escaping RCTPromiseResolveBlock) {
    if type == .Current {
      let ms = (player?.currentTime ?? 0) * 1000
      result(Int(ms))
    } else {
      let ms = (player?.duration ?? 0) * 1000
      result(Int(ms))
    }
  }
  
  func setVolume(_ volume: Double?, _ result: @escaping RCTPromiseResolveBlock) {
    player?.volume = Float(volume ?? 1.0)
    result(true)
  }
  
  func seekTo(_ time: Double?, _ result: @escaping RCTPromiseResolveBlock) {
    if(time != 0 && time != nil) {
      player?.currentTime = Double(time! / 1000)
      result(true)
    } else {
      result(false)
    }
  }
  
    @objc func timerUpdate() {
        let ms = (self.player?.currentTime ?? 0) * 1000
        self.sendEvent(withName: Constants.onCurrentDuration, body: [ Constants.currentDuration: Int(ms), Constants.playerKey: self.playerKey] as [String : Any])
    }
    
    func startListening() {
      stopListening()
        DispatchQueue.main.async { [weak self] in
          guard let strongSelf = self else {return }
            strongSelf.timer = Timer.scheduledTimer(timeInterval: TimeInterval((Float(strongSelf.updateFrequency.rawValue) / 1000)), target: strongSelf, selector: #selector(strongSelf.timerUpdate), userInfo: nil, repeats: true)
        }
    }
    
    func setPlaybackSpeed(_ speed: Float) -> Bool {
        if let player = player {
            player.enableRate = true
            player.rate = Float(speed)
            return true
        } else {
            return false
        }
    }
  
  func stopListening() {
    timer?.invalidate()
    timer = nil
  }
}
