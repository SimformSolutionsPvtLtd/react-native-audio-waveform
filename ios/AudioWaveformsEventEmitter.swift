import Foundation

@objc(AudioWaveformsEventEmitter)
open class AudioWaveformsEventEmitter: RCTEventEmitter {
  
  override init() {
    super.init()
    EventEmitter.sharedInstance.registerEventEmitter(eventEmitter: self)
  }
  
    @objc
    public override static func requiresMainQueueSetup() -> Bool {
        return true
    }
  
  /// Base overide for RCTEventEmitter.
  ///
  /// - Returns: all supported events
  @objc open override func supportedEvents() -> [String] {
    return EventEmitter.sharedInstance.allEvents
  }
  
}
