package com.audiowaveform

import android.net.Uri
import android.os.CountDownTimer
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.JavascriptException
import com.facebook.react.modules.core.DeviceEventManagerModule

class AudioPlayer(
    context: ReactApplicationContext,
    playerKey: String,
) {
    private val appContext = context
    private lateinit var player: ExoPlayer
    private lateinit var playerListener: Player.Listener
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

                override fun onPlaybackStateChanged(state: Int) {
                    if (!isPlayerPrepared) {
                        if (state == Player.STATE_READY) {
                            player.volume = (volume ?: 1).toFloat()
                            player.seekTo(progress)
                            isPlayerPrepared = true
                            val duration = player.duration
                            promise.resolve(duration.toString())
                        }
                        else if (state == Player.STATE_IDLE) {
                            // Fix leaking promise when path is incorrect
                            promise.reject("preparePlayer-onPlayerStateChanged-error-idle", "Player stayed in idle state, unable to load $path")
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
                override fun onPlayerError(error: PlaybackException) {
                    promise.reject("preparePlayer-onPlayerError", error.message)
                }
            }

            player.addListener(playerListener)
        } else {
            promise.reject("preparePlayer-error", "path to audio file or unique key can't be null")
        }
    }

    fun seekToPosition(progress: Long?): Boolean {
        if (progress != null) {
            player.seekTo(progress)
            return true;
        }
        return false;
    }

    fun getDuration(durationType: DurationType): Long {
        return if (durationType == DurationType.Current) player.currentPosition else player.duration
    }

    private fun validateAndSetPlaybackSpeed(player: Player, speed: Float?): Boolean {
        // Validate the speed: if null or less than or equal to 0, set to 1f
        val validSpeed = if (speed == null || speed <= 0f) 1f else speed

        // Set the playback speed on the player
        val playbackParameters = player.playbackParameters.withSpeed(validSpeed)
        player.playbackParameters = playbackParameters

        return true  // Indicate success
    }

    fun start(finishMode: Int, speed: Float): Boolean {
        this.finishMode = when (finishMode) {
            0 -> FinishMode.Loop
            1 -> FinishMode.Pause
            else -> FinishMode.Stop
        }

       validateAndSetPlaybackSpeed(player, speed)

        player.playWhenReady = true
        player.play()
        startListening()
        return true
    }

    fun stop() {
        stopListening()
        player.removeListener(playerListener)
        isPlayerPrepared = false
        if(player.isPlaying) player.stop()
        player.release()
    }

    fun pause(): Boolean {
        stopListening()
        player.pause()
        return true
    }

    fun setVolume(volume: Float): Boolean {
        try {
            player.volume = volume
            return true;
        } catch (_: Exception) {
            // Noop
        }
        return false
    }

    fun setPlaybackSpeed(speed: Float?) = validateAndSetPlaybackSpeed(player, speed)

    private fun startListening() {
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
            throw Exception("startListening-error", err)
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