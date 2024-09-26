package com.audiowaveform

import android.net.Uri
import android.os.CountDownTimer
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.JavascriptException
import com.facebook.react.modules.core.DeviceEventManagerModule
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.common.MediaItem
import androidx.media3.common.Player

class AudioPlayer(
    context: ReactApplicationContext,
    playerKey: String,
) {
    private val appContext = context
    private lateinit var player: ExoPlayer
    private var playerListener: Player.Listener? = null
    private var isPlayerPrepared: Boolean = false
    private var finishMode = FinishMode.Stop
    private val key = playerKey
    private var updateFrequency = UpdateFrequency.Low
    private lateinit var audioPlaybackListener: CountDownTimer
    private var isComponentMounted = true // Flag to track mounting status

    fun markPlayerAsUnmounted() {
        isComponentMounted = false
    }

    fun preparePlayer(
        path: String?,
        volume: Int?,
        frequency: UpdateFrequency,
        progress: Long,
        promise: Promise
    ) {
        if (path != null) {
            isPlayerPrepared = false
            isComponentMounted = true
            updateFrequency = frequency
            val uri = Uri.parse(path)
            val mediaItem = MediaItem.fromUri(uri)
            player = ExoPlayer.Builder(appContext).build()
            player.addMediaItem(mediaItem)

            player.prepare()
            playerListener = object : Player.Listener {

                @Deprecated("Deprecated in Java")
                override fun onPlayerStateChanged(isReady: Boolean, state: Int) {
                    if (!isPlayerPrepared) {
                        if (state == Player.STATE_READY) {
                            player.volume = (volume ?: 1).toFloat()
                            player.seekTo(progress)
                            isPlayerPrepared = true
                            val duration = player.duration
                            promise.resolve(duration.toString())
                        }
                    }
                    if (state == Player.STATE_ENDED) {
                        val args: WritableMap = Arguments.createMap()
                        when (finishMode) {
                            FinishMode.Loop -> {
                                player.seekTo(0)
                                player.play()
                                args.putInt(Constants.finishType, 0)
                            }
                            FinishMode.Pause -> {
                                player.seekTo(0)
                                player.playWhenReady = false
                                stopListening()
                                args.putInt(Constants.finishType, 1)
                            }
                            else -> {
                                player.stop()
                                player.release()
                                stopListening()
                                args.putInt(Constants.finishType, 2)
                            }
                        }
                        args.putString(Constants.playerKey, key)
                        if (isComponentMounted) {
                            appContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)?.emit("onDidFinishPlayingAudio", args)
                        }
                    }
                }
            }
            player.addListener(playerListener!!)
        } else {
            promise.reject("preparePlayer Error", "path to audio file or unique key can't be null")
        }
    }

    fun seekToPosition(progress: Long?, promise: Promise) {
        if (progress != null) {
            player.seekTo(progress)
            promise.resolve(true)
        } else {
            promise.resolve(false)
        }
    }

    fun getDuration(durationType: DurationType, promise: Promise) {
        if (durationType == DurationType.Current) {
            val duration = player.currentPosition
            promise.resolve(duration.toString())
        } else {
            val duration = player.duration
            promise.resolve(duration.toString())
        }
    }

    private fun validateAndSetPlaybackSpeed(player: Player, speed: Float?): Boolean {
        // Validate the speed: if null or less than or equal to 0, set to 1f
        val validSpeed = if (speed == null || speed <= 0f) 1f else speed

        // Set the playback speed on the player
        val playbackParameters = player.playbackParameters.withSpeed(validSpeed)
        player.playbackParameters = playbackParameters

        return true  // Indicate success
    }

    fun start(finishMode: Int?, speed: Float?, promise: Promise) {
        try {
            if (finishMode != null && finishMode == 0) {
                this.finishMode = FinishMode.Loop
            } else if (finishMode != null && finishMode == 1) {
                this.finishMode = FinishMode.Pause
            } else {
                this.finishMode = FinishMode.Stop
            }

           validateAndSetPlaybackSpeed(player, speed)

            player.playWhenReady = true
            player.play()
            promise.resolve(true)
            startListening(promise)
        } catch (e: Exception) {
            promise.reject("Can not start the player", e.toString())
        }
    }

    fun stop(promise: Promise) {
        stopListening()
        if (playerListener != null) {
            player.removeListener(playerListener!!)
        }
        isPlayerPrepared = false
        player.stop()
        player.release()
        promise.resolve(true)
    }

    fun pause(promise: Promise) {
        try {
            stopListening()
            player.pause()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("Failed to pause the player", e.toString())
        }

    }

    fun setVolume(volume: Float?, promise: Promise) {
        try {
            if (volume != null) {
                player.volume = volume
                promise.resolve(true)
            } else {
                promise.resolve(false)
            }
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    fun setPlaybackSpeed(speed: Float?, promise: Promise) {
        try {
            // Call the custom function to validate and set the playback speed
            val success = validateAndSetPlaybackSpeed(player, speed)
            promise.resolve(success)  // Resolve the promise with success

        } catch (e: Exception) {
            // Handle any exceptions and reject the promise
            promise.reject("setPlaybackSpeed Error", e.toString())
        }
    }

    private fun startListening(promise: Promise) {
        try {
            audioPlaybackListener = object : CountDownTimer(player.duration, UpdateFrequency.Low.value) {
                override fun onTick(millisUntilFinished: Long) {
                    val currentPosition = player.currentPosition.toString()
                    val args: WritableMap = Arguments.createMap()
                    args.putString(Constants.currentDuration, currentPosition)
                    args.putString(Constants.playerKey, key)
                    if (isComponentMounted) {
                        appContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)?.emit("onCurrentDuration", args)
                    }
                }
                override fun onFinish() {}
            }.start()
        } catch(err: JavascriptException) {
            promise.reject("startListening Error", err)
        }
    }

    private fun stopListening() {
        if (::audioPlaybackListener.isInitialized) {
            audioPlaybackListener.cancel()
        }
    }

    fun isHoldingAudioTrack(): Boolean {
        return ::audioPlaybackListener.isInitialized
    }
}