package com.audiowaveform

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.os.CountDownTimer
import android.os.Handler
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
    private var audioManager: AudioManager = appContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    private var audioFocusRequest: AudioFocusRequest? = null
    private var playerListener: Player.Listener? = null
    private var isPlayerPrepared: Boolean = false
    private var finishMode = FinishMode.Stop
    private val key = playerKey
    private var updateFrequency = UpdateFrequency.Low
    private lateinit var audioPlaybackListener: CountDownTimer
    private var isComponentMounted = true // Flag to track mounting status
    private var isAudioFocusGranted=false

    init {
        // Set up the audio focus request
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            audioFocusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .build()
                ).setAcceptsDelayedFocusGain(true)
                .setOnAudioFocusChangeListener { focusChange ->
                    handleAudioFocusChange(focusChange)
                }
                .build()
        }
    }

    private fun handleAudioFocusChange(focusChange: Int) {
        when (focusChange) {
            AudioManager.AUDIOFOCUS_GAIN -> {
                player.applicationLooper.let { looper -> Handler(looper).post {
                    // Audio focus granted; resume playback if necessary
                    if (!player.isPlaying) {
                        player.play()
                    }
                    player.volume = 1.0f // Restore full volume
                }}
            }
            AudioManager.AUDIOFOCUS_LOSS -> {
                player.applicationLooper.let { looper -> Handler(looper).post {
                    // Permanent loss of audio focus; pause playback
                    if (player.isPlaying) {
                        val args: WritableMap = Arguments.createMap()
                        stopListening()
                        player.pause()
                        abandonAudioFocus()
                        args.putInt(Constants.finishType, 1)
                        args.putString(Constants.playerKey, key)
                        appContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)?.emit("onDidFinishPlayingAudio", args)
                    }
                }}
            }
            AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> {
                player.applicationLooper.let { looper -> Handler(looper).post {
                    // Temporary loss of audio focus; pause playback
                    if (player.isPlaying) {
                        player.pause()
                    }
                }}
            }
            AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
                player.applicationLooper.let { looper -> Handler(looper).post {
                    // Temporarily loss of audio focus; but can continue playing at a lower volume.
                    player.volume = 0.2f
                }}
            }
        }
    }

    private fun requestAudioFocus(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            audioFocusRequest?.let {
                val result = audioManager.requestAudioFocus(it)
                isAudioFocusGranted = result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
                return isAudioFocusGranted
            } ?: false
        } else {
            val result = audioManager.requestAudioFocus(
                { focusChange -> handleAudioFocusChange(focusChange) },
                AudioManager.STREAM_MUSIC,
                AudioManager.AUDIOFOCUS_GAIN
            )
            isAudioFocusGranted = result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
            return isAudioFocusGranted
        }
    }

    private fun abandonAudioFocus() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            audioManager.abandonAudioFocusRequest(audioFocusRequest!!)
        }
        isAudioFocusGranted = false
    }


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
            if (requestAudioFocus()) {
                player.playWhenReady = true
                player.play()
                emitCurrentDuration()
                promise.resolve(true)
                startListening(promise)}
            else {
                promise.reject("AudioFocusError", "Failed to gain audio focus")
            }
        } catch (e: Exception) {
            promise.reject("Can not start the player", e.toString())
        }
    }

    fun stop() {
        stopListening()
        emitCurrentDuration()
        if (playerListener != null) {
            player.removeListener(playerListener!!)
        }
        isPlayerPrepared = false
        player.stop()
        player.release()
        abandonAudioFocus()
    }

    fun pause(promise: Promise?) {
        try {
            stopListening()
            player.pause()
            emitCurrentDuration()
            abandonAudioFocus()
            promise?.resolve(true)
        } catch (e: Exception) {
            promise?.reject("Failed to pause the player", e.toString())
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

    fun setPlaybackSpeed(speed: Float?): Boolean {
        return validateAndSetPlaybackSpeed(player, speed)
    }


    fun emitCurrentDuration() {
        val currentPosition = player.currentPosition.toString()
        val args: WritableMap = Arguments.createMap()
        args.putString(Constants.currentDuration, currentPosition)
        args.putString(Constants.playerKey, key)
        if (isComponentMounted) {
            appContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)?.emit("onCurrentDuration", args)
        }
    }

    private fun startListening(promise: Promise) {
        try {
            audioPlaybackListener = object : CountDownTimer(player.duration, UpdateFrequency.Low.value) {
                override fun onTick(millisUntilFinished: Long) {
                    emitCurrentDuration()
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