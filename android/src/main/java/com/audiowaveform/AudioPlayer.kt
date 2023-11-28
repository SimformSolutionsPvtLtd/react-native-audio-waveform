package com.audiowaveform

import android.net.Uri
import android.os.CountDownTimer
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.JavascriptException
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.android.exoplayer2.ExoPlayer
import com.google.android.exoplayer2.MediaItem
import com.google.android.exoplayer2.Player

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

    fun preparePlayer(path: String?, volume: Int?, frequency: UpdateFrequency, promise: Promise) {
        if (path != null) {
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
                            isPlayerPrepared = true
                            val duration = player.duration
                            promise.resolve(duration.toString())
                        }
                    }
                    if (state == Player.STATE_ENDED) {
                        val args: MutableMap<String, Any?> = HashMap()
                        when (finishMode) {
                            FinishMode.Loop -> {
                                player.seekTo(0)
                                player.play()
                                args[Constants.finishType] = 0
                            }
                            FinishMode.Pause -> {
                                player.seekTo(0)
                                player.playWhenReady = false
                                stopListening()
                                args[Constants.finishType] = 1
                            }
                            else -> {
                                player.stop()
                                player.release()
//                                player = null
                                stopListening()
                                args[Constants.finishType] = 2
                            }
                        }
                        args[Constants.playerKey] = key
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
        Log.d(Constants.LOG_TAG, "getDuration : invoked from AudioPlayer Class")
        Log.d(Constants.LOG_TAG, "durationType : $durationType")
        if (durationType == DurationType.Current) {
            val duration = player.currentPosition
            Log.d(Constants.LOG_TAG, "currentPosition : $duration")
            promise.resolve(duration.toString())
        } else {
            val duration = player.duration
            Log.d(Constants.LOG_TAG, "Max duration : $duration")
            promise.resolve(duration.toString())
        }
    }

    fun start(finishMode: Int?, promise: Promise) {
        Log.d(Constants.LOG_TAG, "Invoke Start Method")
        Log.d(Constants.LOG_TAG, "FinishMode: $finishMode")
        try {
            if (finishMode != null && finishMode == 0) {
                this.finishMode = FinishMode.Loop
                Log.d(Constants.LOG_TAG, "FinishMode Loop: $finishMode")
            } else if (finishMode != null && finishMode == 1) {
                this.finishMode = FinishMode.Pause
                Log.d(Constants.LOG_TAG, "FinishMode Pause: $finishMode")
            } else {
                this.finishMode = FinishMode.Stop
                Log.d(Constants.LOG_TAG, "FinishMode Stop: $finishMode")
            }
            player.playWhenReady = true
            player.play()
            promise.resolve(true)
            Log.d(Constants.LOG_TAG, "Playing Audio. Set Flag to true")
            startListening(promise)
        } catch (e: Exception) {
            Log.d( Constants.LOG_TAG, "Can not start the player $e")
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

    private fun startListening(promise: Promise) {
        try {
            audioPlaybackListener = object : CountDownTimer(player.duration, 10) {
                override fun onTick(millisUntilFinished: Long) {
                    val currentPosition = player.currentPosition.toString()
                    val args: WritableMap = Arguments.createMap()
                    args.putString(Constants.currentDuration, currentPosition)
                    args.putString(Constants.playerKey, key)
                    appContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)?.emit("onCurrentDuration", args)
                }
                override fun onFinish() {}
            }.start()
        } catch(err: JavascriptException) {
            promise.reject("startListening Error", err)
        }
    }

    private fun stopListening() {
        audioPlaybackListener.cancel()
    }
}
