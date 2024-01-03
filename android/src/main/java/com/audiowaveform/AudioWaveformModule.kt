package com.audiowaveform

import android.media.MediaRecorder
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class AudioWaveformModule(context: ReactApplicationContext): ReactContextBaseJavaModule(context) {
    private var extractors = mutableMapOf<String, WaveformExtractor?>()
    private var audioPlayers = mutableMapOf<String, AudioPlayer?>()
    private var audioRecorder: AudioRecorder = AudioRecorder()
    private var recorder: MediaRecorder? = null
    private var encoder: Int = 0
    private var path: String? = null
    private var outputFormat: Int = 0
    private var sampleRate: Int = 44100
    private var bitRate: Int? = null
    private val handler = Handler(Looper.getMainLooper())

    companion object {
        const val NAME = "AudioWaveform"
    }

    override fun getName(): String {
        return NAME
    }

    @ReactMethod
    fun checkHasAudioRecorderPermission(promise: Promise) {
        Log.d(Constants.LOG_TAG, "inside checkHasAudioRecorderPermission")
        audioRecorder.checkPermission(currentActivity, promise)
    }

    @ReactMethod
    fun getAudioRecorderPermission(promise: Promise) {
        Log.d(Constants.LOG_TAG, "inside getAudioRecorderPermission")
        audioRecorder.getPermission(currentActivity, promise)
    }

    @ReactMethod
    fun initRecorder(promise: Promise) {
        Log.d(Constants.LOG_TAG, "inside initRecorder")
        checkPathAndInitialiseRecorder(encoder, outputFormat, sampleRate, bitRate, promise)
    }

    @ReactMethod
    fun getDecibel(): Double? {
        Log.d(Constants.LOG_TAG,"getDecibel from Native Side: $recorder")
        return audioRecorder.getDecibel(recorder)
    }

    @ReactMethod
    fun startRecording(obj: ReadableMap?, promise: Promise) {
        initRecorder(promise);
        val useLegacyNormalization = true
        startEmittingRecorderValue()
        audioRecorder.startRecorder(recorder, useLegacyNormalization, promise)
    }

    @RequiresApi(Build.VERSION_CODES.N)
    @ReactMethod
    fun pauseRecording(promise: Promise){
        audioRecorder.pauseRecording(recorder, promise)
        stopEmittingRecorderValue()
    }

    @RequiresApi(Build.VERSION_CODES.N)
    @ReactMethod
    fun resumeRecording(promise: Promise){
        audioRecorder.resumeRecording(recorder, promise)
        startEmittingRecorderValue()
    }

    @ReactMethod
    fun stopRecording(promise: Promise) {
        Log.d(Constants.LOG_TAG, "${Constants.path} : path, $recorder : recorder")
        audioRecorder.stopRecording(recorder, path!!, promise)
        recorder = null
        stopEmittingRecorderValue()
    }

    @ReactMethod
    fun preparePlayer(
        obj: ReadableMap,
        promise: Promise
    ) {
        val path = obj.getString(Constants.path)
        val key = obj.getString(Constants.playerKey)
        val frequency = obj.getInt(Constants.updateFrequency)
        val volume = obj.getInt(Constants.volume)
        if (key != null) {
            initPlayer(key)
            audioPlayers[key]?.preparePlayer(
                path,
                volume,
                getUpdateFrequency(frequency),
                promise
            )
        } else {
            promise.reject(Constants.LOG_TAG, "Player key can't be null")
        }
    }

    @ReactMethod
    fun startPlayer(obj: ReadableMap, promise: Promise) {
        val finishMode = obj.getInt(Constants.finishMode)
        val key = obj.getString(Constants.playerKey)
        if (key != null) {
            Log.d(Constants.LOG_TAG, "invoking startPlayer: $key")
            audioPlayers[key]?.start(finishMode, promise)
        } else {
            promise.reject("startPlayer Error", "Player key can't be null")
        }
    }

    @ReactMethod
    fun stopPlayer(obj: ReadableMap, promise: Promise) {
        val key = obj.getString(Constants.playerKey)
        if (key != null) {
            audioPlayers[key]?.stop(promise)
        } else {
            promise.reject("stopPlayer Error", "Player key can't be null")
        }
    }

    @ReactMethod
    fun pausePlayer(obj: ReadableMap, promise: Promise) {
        val key = obj.getString(Constants.playerKey)
        if (key != null) {
            audioPlayers[key]?.pause(promise)
        } else {
            promise.reject("pausePlayer Error", "Player key can't be null")
        }
    }

    @ReactMethod
    fun seekToPlayer(obj: ReadableMap, promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val progress = obj.getInt(Constants.progress)
            val key = obj.getString(Constants.playerKey)
            if (key != null) {
                audioPlayers[key]?.seekToPosition(progress.toLong(), promise)
            } else {
                promise.reject("seekTo Error", "Player key can't be null")
            }
        } else {
            Log.e(
                Constants.LOG_TAG,
                "Minimum android O is required for seekTo function to works"
            )
        }
    }

    @ReactMethod
    fun setVolume(obj: ReadableMap, promise: Promise) {
        val volume = obj.getInt(Constants.volume)
        val key = obj.getString(Constants.playerKey)
        if (key != null) {
            audioPlayers[key]?.setVolume(volume.toFloat(), promise)
        } else {
            promise.reject("setVolume error", "Player key can't be null")
        }
    }

    @ReactMethod
    fun getDuration(obj: ReadableMap, promise: Promise) {
        val key = obj.getString(Constants.playerKey)
        val duration = obj.getInt(Constants.durationType)
        val type = if (duration == 0) DurationType.Current else DurationType.Max
        if (key != null) {
            audioPlayers[key]?.getDuration(type, promise)
        } else {
            promise.reject("getDuration Error", "Player key can't be null")
        }
    }

    @ReactMethod
    fun extractWaveformData(obj: ReadableMap, promise: Promise) {
        val key = obj.getString(Constants.playerKey)
        val path = obj.getString(Constants.path)
        val noOfSamples = obj.getInt(Constants.noOfSamples)
        if(key != null) {
            Log.d(Constants.LOG_TAG, "Invoking createOrUpdateExtractor")
            createOrUpdateExtractor(key, noOfSamples, path, promise)
        } else {
            Log.d(Constants.LOG_TAG, "Can not get waveform data Player key is null")
        }
    }

    @ReactMethod
    fun stopAllPlayers(promise: Promise) {
        for ((key, _) in audioPlayers) {
            audioPlayers[key]?.stop(promise)
            audioPlayers[key] = null
        }
    }

    private fun initPlayer(playerKey: String) {
        if (audioPlayers[playerKey] == null) {
            val newPlayer = AudioPlayer(
                reactApplicationContext,
                playerKey = playerKey,
            )
            audioPlayers[playerKey] = newPlayer
        }
        return
    }

    private fun createOrUpdateExtractor(
        playerKey: String,
        noOfSamples: Int?,
        path: String?,
        promise: Promise,
    ) {
        if (path == null) {
            promise.reject("createOrUpdateExtractor Error" , "No Path Provided")
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
                        Log.d(Constants.LOG_TAG, "value in onProgress $value $path")
                        val tempArrayForCommunication : MutableList<MutableList<Float>> = mutableListOf()
                        extractors[playerKey]?.sampleData?.let { tempArrayForCommunication.add(it) }
                        promise.resolve(Arguments.fromList(tempArrayForCommunication))
                    }
                }
            },
            promise
        )
        Log.d(Constants.LOG_TAG, "initiating start decode")
        extractors[playerKey]?.startDecode()
        extractors[playerKey]?.stop()
    }

    private fun getUpdateFrequency(frequency: Int?): UpdateFrequency {
        if (frequency == 2) {
            return UpdateFrequency.High
        } else if (frequency == 1) {
            return UpdateFrequency.Medium
        }
        return UpdateFrequency.Low
    }

    private fun checkPathAndInitialiseRecorder(
        encoder: Int,
        outputFormat: Int,
        sampleRate: Int,
        bitRate: Int?,
        promise: Promise
    ) {
        Log.d(Constants.LOG_TAG, "initRecorder before TRY")
        try {
            recorder = MediaRecorder()
        } catch (e: Exception) {
            Log.e(Constants.LOG_TAG, "Failed to initialise Recorder")
        }
        if (path == null) {
            val outputDir = currentActivity?.cacheDir
            val outputFile: File?
            val dateTimeInstance = SimpleDateFormat(Constants.fileNameFormat, Locale.US)
            val currentDate = dateTimeInstance.format(Date())
            try {
                outputFile = File.createTempFile(currentDate, ".m4a", outputDir)
                Log.d(Constants.LOG_TAG, "Inside TRY of Null Path: ${outputFile.path}")
                path = outputFile.path
                audioRecorder.initRecorder(
                    path!!,
                    recorder,
                    encoder,
                    outputFormat,
                    sampleRate,
                    bitRate,
                    promise,
                )
            } catch (e: IOException) {
                Log.e(Constants.LOG_TAG, "Failed to create file")
            }
        } else {
            Log.d(Constants.LOG_TAG, "initRecorder inside ELSE")
            audioRecorder.initRecorder(
                path!!,
                recorder,
                encoder,
                outputFormat,
                sampleRate,
                bitRate,
                promise,
            )
        }
    }

    private val emitLiveRecordValue = object : Runnable {
        override fun run() {
            val currentDecibel = getDecibel()
            val args: WritableMap = Arguments.createMap()
            if (currentDecibel == Double.NEGATIVE_INFINITY) {
                args.putDouble(Constants.currentDecibel, 0.0)
                Log.d(Constants.LOG_TAG, "NO AUDIO INPUT FOUND")
            } else {
                if (currentDecibel != null) {
                    args.putDouble(Constants.currentDecibel, currentDecibel/1000)
                }
            }
            handler.postDelayed(this, 500)
            Log.d(Constants.LOG_TAG, args.toString())
            reactApplicationContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)?.emit(Constants.onCurrentRecordingWaveformData, args)
        }
    }

    private fun startEmittingRecorderValue() {
        handler.postDelayed(emitLiveRecordValue, 500)
    }

    private fun stopEmittingRecorderValue() {
        handler.removeCallbacks(emitLiveRecordValue)
    }

}
