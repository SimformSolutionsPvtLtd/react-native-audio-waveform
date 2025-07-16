package com.audiowaveform

import android.media.MediaRecorder
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@ReactModule(name = AudioWaveformModule.NAME)
class AudioWaveformModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    private var extractors = mutableMapOf<String, WaveformExtractor?>()
    private var audioPlayers = mutableMapOf<String, AudioPlayer?>()
    private var audioRecorder: AudioRecorder = AudioRecorder()
    private var recorder: MediaRecorder? = null
    private var encoder: Int = 0
    private var path: String? = null
    private var outputFormat: Int = 0
    private var sampleRate: Int = 44100
    private var bitRate: Int = 128000
    private val handler = Handler(Looper.getMainLooper())
    private var startTime: Long = 0

    companion object {
        const val NAME = "AudioWaveform"
        const val MAX_NUMBER_OF_AUDIO_PLAYER = 30
    }

    override fun getName(): String = NAME

    @ReactMethod
    fun markPlayerAsUnmounted() {
        audioPlayers.values.forEach { it?.markPlayerAsUnmounted() }
    }

    @ReactMethod
    fun checkHasAudioRecorderPermission(promise: Promise) {
        audioRecorder.checkPermission(currentActivity, promise)
    }

    @ReactMethod
    fun getAudioRecorderPermission(promise: Promise) {
        audioRecorder.getPermission(currentActivity, promise)
    }

    @ReactMethod
    fun initRecorder(obj: ReadableMap?, promise: Promise) {
        checkPathAndInitialiseRecorder(encoder, outputFormat, sampleRate, bitRate, promise, obj)
    }

    @ReactMethod
    fun getDecibel(promise: Promise) {
        val decibel = audioRecorder.getDecibel(recorder) ?: 0.0
        promise.resolve(decibel)
    }

    @ReactMethod
    fun startRecording(obj: ReadableMap?, promise: Promise) {
        initRecorder(obj, promise)
        val useLegacyNormalization = true
        audioRecorder.startRecorder(recorder, useLegacyNormalization, promise)
        startTime = System.currentTimeMillis()
        startEmittingRecorderValue()
    }

    @RequiresApi(Build.VERSION_CODES.N)
    @ReactMethod
    fun pauseRecording(promise: Promise) {
        audioRecorder.pauseRecording(recorder, promise)
        stopEmittingRecorderValue()
    }

    @RequiresApi(Build.VERSION_CODES.N)
    @ReactMethod
    fun resumeRecording(promise: Promise) {
        audioRecorder.resumeRecording(recorder, promise)
        startEmittingRecorderValue()
    }

    @ReactMethod
    fun stopRecording(promise: Promise) {
        if (audioRecorder == null || recorder == null || path == null) {
            promise.reject("STOP_RECORDING_ERROR", "Recording resources not properly initialized")
            return
        }

        try {
            val currentTime = System.currentTimeMillis()
            if (currentTime - startTime < 500) {
                promise.reject("SHORT_RECORDING", "Recording is too short")
                return
            }

            stopEmittingRecorderValue()
            audioRecorder.stopRecording(recorder, path!!, promise)
            recorder = null
            path = null
        } catch (e: Exception) {
            Log.e(Constants.LOG_TAG, "Failed to stop recording", e)
            promise.reject("Error", "Failed to stop recording: ${e.message}")
        }
    }

    @ReactMethod
    fun preparePlayer(obj: ReadableMap, promise: Promise) {
        if (audioPlayers.filter { it.value?.isHoldingAudioTrack() == true }.count() >= MAX_NUMBER_OF_AUDIO_PLAYER) {
            promise.reject(Constants.LOG_TAG, "Too many players initialized.")
            return
        }

        val path = obj.getString(Constants.path)
        val key = obj.getString(Constants.playerKey)
        val frequency = obj.getInt(Constants.updateFrequency)
        val volume = obj.getInt(Constants.volume)
        val progress = if (!obj.hasKey(Constants.progress) || obj.isNull(Constants.progress)) 0 else obj.getInt(Constants.progress).toLong()

        if (key != null) {
            initPlayer(key)
            audioPlayers[key]?.preparePlayer(path, volume, getUpdateFrequency(frequency), progress, promise)
        } else {
            promise.reject(Constants.LOG_TAG, "Player key can't be null")
        }
    }

    @ReactMethod
    fun startPlayer(obj: ReadableMap, promise: Promise) {
        val finishMode = obj.getInt(Constants.finishMode)
        val speed = obj.getDouble(Constants.speed)
        getPlayerOrReject(obj, promise, "startPlayer Error")?.start(finishMode, speed.toFloat(), promise)
    }

    @ReactMethod
    fun stopPlayer(obj: ReadableMap, promise: Promise) {
        val key = obj.getString(Constants.playerKey)
        if (key != null) {
            audioPlayers[key]?.stop()
            audioPlayers[key] = null
            promise.resolve(true)
        } else {
            promise.reject("stopPlayer Error", "Player key can't be null")
        }
    }

    @ReactMethod
    fun pausePlayer(obj: ReadableMap, promise: Promise) {
        getPlayerOrReject(obj, promise, "pausePlayer Error")?.pause(promise)
    }

    @ReactMethod
    fun seekToPlayer(obj: ReadableMap, promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val progress = obj.getInt(Constants.progress)
                getPlayerOrReject(obj, promise, "seekTo Error")?.seekToPosition(progress.toLong(), promise)
            } else {
                Log.e(Constants.LOG_TAG, "Minimum Android O required for seekTo")
                promise.resolve(false)
            }
        } catch (e: Exception) {
            promise.reject("seekTo Error", e.toString())
        }
    }

    @ReactMethod
    fun setVolume(obj: ReadableMap, promise: Promise) {
        val volume = obj.getInt(Constants.volume)
        getPlayerOrReject(obj, promise, "setVolume Error")?.setVolume(volume.toFloat(), promise)
    }

    @ReactMethod
    fun getDuration(obj: ReadableMap, promise: Promise) {
        val duration = obj.getInt(Constants.durationType)
        val type = if (duration == 0) DurationType.Current else DurationType.Max
        getPlayerOrReject(obj, promise, "getDuration Error")?.getDuration(type, promise)
    }

    @ReactMethod
    fun extractWaveformData(obj: ReadableMap, promise: Promise) {
        val key = obj.getString(Constants.playerKey)
        val path = obj.getString(Constants.path)
        val noOfSamples = obj.getInt(Constants.noOfSamples)

        if (key != null) {
            createOrUpdateExtractor(key, noOfSamples, path, promise)
        } else {
            Log.e(Constants.LOG_TAG, "Cannot get waveform data. Player key is null.")
        }
    }

    @ReactMethod
    fun stopAllPlayers(promise: Promise) {
        try {
            audioPlayers.values.forEach { it?.stop() }
            audioPlayers.clear()
            promise.resolve(true)
        } catch (err: Exception) {
            promise.reject("stopAllPlayers Error", "Error while stopping all players")
        }
    }

    @ReactMethod
    fun stopAllWaveFormExtractors(promise: Promise) {
        try {
            extractors.values.forEach { it?.forceStop() }
            extractors.clear()
            promise.resolve(true)
        } catch (err: Exception) {
            promise.reject("stopAllExtractors Error", "Error while stopping all extractors")
        }
    }

    @ReactMethod
    fun setPlaybackSpeed(obj: ReadableMap, promise: Promise) {
        try {
            val speed = if (!obj.hasKey(Constants.speed) || obj.isNull(Constants.speed)) 1.0f else obj.getDouble(Constants.speed).toFloat()
            val key = obj.getString(Constants.playerKey)
            if (key != null) {
                val status = audioPlayers[key]?.setPlaybackSpeed(speed)
                promise.resolve(status ?: false)
            } else {
                promise.reject("setPlaybackSpeed Error", "Player key can't be null")
            }
        } catch (e: Exception) {
            promise.reject("setPlaybackSpeed Error", e.toString())
        }
    }

    private fun initPlayer(playerKey: String) {
        if (audioPlayers[playerKey] == null) {
            val newPlayer = AudioPlayer(reactApplicationContext, playerKey)
            audioPlayers[playerKey] = newPlayer
        }
    }

    private fun createOrUpdateExtractor(playerKey: String, noOfSamples: Int, path: String?, promise: Promise) {
        if (path == null) {
            promise.reject("createOrUpdateExtractor Error", "No path provided")
            return
        }

        extractors[playerKey] = WaveformExtractor(
            context = reactApplicationContext,
            path = path,
            expectedPoints = noOfSamples,
            key = playerKey,
            extractorCallBack = object : ExtractorCallBack {
                override fun onProgress(value: Float) {
                    if (value == 1.0F) {
                        extractors[playerKey]?.sampleData?.let { data ->
                            val normalizedData = normalizeWaveformData(data, 0.12f)
                            val output: MutableList<MutableList<Float>> = mutableListOf(normalizedData)
                            promise.resolve(Arguments.fromList(output))
                        }
                    }
                }

                override fun onReject(error: String?, message: String?) {
                    promise.reject(error ?: "Error", message ?: "Waveform decoding error")
                }

                override fun onResolve(value: MutableList<MutableList<Float>>) {
                    promise.resolve(Arguments.fromList(value))
                }

                override fun onForceStop() {
                    promise.resolve(Arguments.fromList(mutableListOf(emptyList<Float>())))
                }
            }
        )
        extractors[playerKey]?.startDecode()
    }

    private fun normalizeWaveformData(data: MutableList<Float>, scale: Float = 0.25f, threshold: Float = 0.01f): MutableList<Float> {
        val filtered = data.filter { kotlin.math.abs(it) >= threshold }
        val maxAmp = filtered.maxOrNull() ?: 1.0f
        return if (maxAmp > 0) {
            data.map { if (kotlin.math.abs(it) < threshold) 0.0f else (it / maxAmp) * scale }.toMutableList()
        } else {
            data
        }
    }

    private fun getUpdateFrequency(freq: Int?): UpdateFrequency {
        return when (freq) {
            2 -> UpdateFrequency.High
            1 -> UpdateFrequency.Medium
            else -> UpdateFrequency.Low
        }
    }

    private fun checkPathAndInitialiseRecorder(
        encoder: Int,
        outputFormat: Int,
        sampleRate: Int,
        bitRate: Int,
        promise: Promise,
        obj: ReadableMap?
    ) {
        var sampleRateVal = sampleRate
        var bitRateVal = bitRate

        obj?.let {
            if (it.hasKey(Constants.bitRate)) bitRateVal = it.getInt(Constants.bitRate)
            if (it.hasKey(Constants.sampleRate)) sampleRateVal = it.getInt(Constants.sampleRate)
        }

        try {
            recorder = MediaRecorder()
        } catch (e: Exception) {
            Log.e(Constants.LOG_TAG, "Failed to initialize recorder")
        }

        if (path == null) {
            val outputDir = currentActivity?.cacheDir
            val date = SimpleDateFormat(Constants.fileNameFormat, Locale.US).format(Date())
            try {
                val file = File.createTempFile(date, ".m4a", outputDir)
                path = file.path
            } catch (e: IOException) {
                Log.e(Constants.LOG_TAG, "Failed to create file")
            }
        }

        path?.let {
            audioRecorder.initRecorder(it, recorder, encoder, outputFormat, sampleRateVal, bitRateVal, promise)
        }
    }

    private val emitLiveRecordValue = object : Runnable {
        override fun run() {
            val decibel = audioRecorder.getDecibel(recorder) ?: 0.0
            val args: WritableMap = Arguments.createMap()
            args.putDouble(Constants.currentDecibel, if (decibel == Double.NEGATIVE_INFINITY) 0.0 else decibel / 1000)
            handler.postDelayed(this, UpdateFrequency.Low.value)
            reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit(Constants.onCurrentRecordingWaveformData, args)
        }
    }

    private fun startEmittingRecorderValue() {
        handler.postDelayed(emitLiveRecordValue, UpdateFrequency.Low.value)
    }

    private fun stopEmittingRecorderValue() {
        handler.removeCallbacks(emitLiveRecordValue)
    }

    private fun getPlayerOrReject(obj: ReadableMap, promise: Promise, errorCode: String): AudioPlayer? {
        return obj.getString(Constants.playerKey)?.let {
            audioPlayers[it] ?: run {
                promise.reject(errorCode, "$errorCode: Player not found")
                null
            }
        } ?: run {
            promise.reject(errorCode, "$errorCode: Player key is null")
            null
        }
    }
}
