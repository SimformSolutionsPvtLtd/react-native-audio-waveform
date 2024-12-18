package com.audiowaveform

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import android.media.MediaMetadataRetriever
import android.media.MediaRecorder
import android.os.Build
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.core.app.ActivityCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import java.io.IOException
import java.lang.IllegalStateException
import kotlin.math.log10

private const val RECORD_AUDIO_REQUEST_CODE = 1001

class AudioRecorder {
    private var permissions = arrayOf(Manifest.permission.RECORD_AUDIO)
    private var useLegacyNormalization = false
    private var isRecording = false

    private fun isPermissionGranted(activity: Activity?): Int? {
        return activity?.let { ActivityCompat.checkSelfPermission(it, permissions[0]) }
    }

    fun checkPermission(activity: Activity?, promise: Promise): String {
        val permissionResponse = isPermissionGranted(activity)
        if (permissionResponse === PackageManager.PERMISSION_GRANTED) {
            promise.resolve("granted")
            return "granted"
        } else {
            promise.resolve("denied")
            return "denied"
        }
    }

    fun getPermission(activity: Activity?, promise: Promise): String {
        val permissionResponse = isPermissionGranted(activity)
        if (permissionResponse === PackageManager.PERMISSION_GRANTED) {
            promise.resolve("granted");
            return "granted"
        } else {
            activity?.let {
                ActivityCompat.requestPermissions(
                    it, permissions,
                    RECORD_AUDIO_REQUEST_CODE
                )
            }
            return "denied"
        }
    }

    fun getDecibel(recorder: MediaRecorder?): Double? {
        if (useLegacyNormalization) {
            if (recorder != null) {
                try {
                    val db = 20 * log10((recorder?.maxAmplitude?.toDouble() ?: (0.0 / 32768.0)))
                    if (db == Double.NEGATIVE_INFINITY) {
                        Log.e(Constants.LOG_TAG, "Microphone might be turned off")
                    } else {
                        return db
                    }
                    return db;
                } catch (e: IllegalStateException) {
                    e.printStackTrace()
                    return null
                }
            }
            else {
                return null
            }
        } else {
            if (recorder != null) {
                try {
                    return recorder?.maxAmplitude?.toDouble() ?: 0.0
                } catch (e: IllegalStateException) {
                    e.printStackTrace()
                    return null
                }
            } else {
                return null
            }
        }
    }

    fun initRecorder(
        path: String,
        recorder: MediaRecorder?,
        encoder: Int,
        outputFormat: Int,
        sampleRate: Int,
        bitRate: Int,
        promise: Promise
    ) {
        if (recorder == null) {
            promise.reject("RECORDER_NULL", "MediaRecorder instance is null")
            return
        }

        recorder?.apply {
            try {
                setAudioSource(MediaRecorder.AudioSource.MIC)
                setOutputFormat(getOutputFormat(outputFormat))
                setAudioEncoder(getEncoder(encoder))
                setAudioSamplingRate(sampleRate)
                if (bitRate != null) {
                    setAudioEncodingBitRate(bitRate)
                }
                setOutputFile(path)
                prepare()
                promise.resolve(true)
            } catch (e: IllegalArgumentException) {
                Log.e(Constants.LOG_TAG, "Invalid MediaRecorder configuration", e)
                promise.reject("CONFIGURATION_ERROR", "Invalid MediaRecorder configuration: ${e.message}")
            } catch (e: IOException) {
                Log.e(Constants.LOG_TAG, "Failed to stop initialize recorder")
            }
        }
    }

    fun stopRecording(recorder: MediaRecorder?, path: String, promise: Promise) {
        try {
            if (isRecording) {
                recorder?.apply {
                    stop()
                    reset()
                    release()
                }
                isRecording = false
                val tempArrayForCommunication : MutableList<String> = mutableListOf()
                val duration = getDuration(path)
                tempArrayForCommunication.add(path)
                tempArrayForCommunication.add(duration.toString())
                promise.resolve(Arguments.fromList(tempArrayForCommunication))
            } else {
                promise.reject("Error", "Recorder is not recording or has already been stopped")
            }
        } catch (e: IllegalStateException) {
            Log.e(Constants.LOG_TAG, "Failed to stop recording",e)
        } catch (e: RuntimeException) {
            Log.e(Constants.LOG_TAG, "Runtime exception when stopping recording", e)
            promise.reject("Error", "Runtime exception: ${e.message}")
        }
    }

    private fun getDuration(path: String): String {
        val mediaMetadataRetriever = MediaMetadataRetriever()
        try {
            mediaMetadataRetriever.setDataSource(path)
            val duration = mediaMetadataRetriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)
            return duration ?: "-1"
        } catch (e: Exception) {
            Log.e(Constants.LOG_TAG, "Failed to get recording duration")
        } finally {
            mediaMetadataRetriever.release()
        }
        return "-1"
    }

    fun startRecorder(recorder: MediaRecorder?, useLegacy: Boolean, promise: Promise) {
        try {
            useLegacyNormalization = useLegacy
            recorder?.apply {
                start()
                isRecording = true
            }
            promise.resolve(true)
        } catch (e: IllegalStateException) {
            Log.e(Constants.LOG_TAG, "Failed to start recording")
            isRecording = false
        }
    }

    @RequiresApi(Build.VERSION_CODES.N)
    fun pauseRecording(recorder: MediaRecorder?, promise: Promise) {
        try {
            recorder?.pause()
            promise.resolve(true)
        } catch (e: IllegalStateException) {
            Log.e(Constants.LOG_TAG, "Failed to pause recording")
            promise.resolve(false)
        }
    }

    @RequiresApi(Build.VERSION_CODES.N)
    fun resumeRecording(recorder: MediaRecorder?, promise: Promise) {
        try {
            recorder?.resume()
            promise.resolve(true)
        } catch (e: IllegalStateException) {
            Log.e(Constants.LOG_TAG, "Failed to resume recording")
        }
    }

    private fun getEncoder(encoder: Int): Int {
        return when (encoder) {
            Constants.acc -> MediaRecorder.AudioEncoder.AAC
            Constants.aac_eld -> MediaRecorder.AudioEncoder.AAC_ELD
            Constants.he_aac -> MediaRecorder.AudioEncoder.HE_AAC
            Constants.amr_nb -> MediaRecorder.AudioEncoder.AMR_NB
            Constants.amr_wb -> MediaRecorder.AudioEncoder.AMR_WB
            Constants.opus -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    MediaRecorder.AudioEncoder.OPUS
                } else {
                    Log.e(Constants.LOG_TAG, "Minimum android Q is required, Setting Acc encoder.")
                    MediaRecorder.AudioEncoder.AAC
                }
            }
            Constants.vorbis -> MediaRecorder.AudioEncoder.VORBIS
            else -> MediaRecorder.AudioEncoder.AAC
        }
    }

    private fun getOutputFormat(format: Int): Int {
        return when (format) {
            Constants.mpeg4 -> MediaRecorder.OutputFormat.MPEG_4
            Constants.three_gpp -> MediaRecorder.OutputFormat.THREE_GPP
            Constants.ogg -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    MediaRecorder.OutputFormat.OGG
                } else {
                    Log.e(Constants.LOG_TAG, "Minimum android Q is required, Setting Acc encoder.")
                    MediaRecorder.OutputFormat.MPEG_4
                }
            }
            Constants.amr_wb -> MediaRecorder.OutputFormat.AMR_WB
            Constants.amr_nb -> MediaRecorder.OutputFormat.AMR_NB
            Constants.webm -> MediaRecorder.OutputFormat.WEBM
            Constants.mpeg_2_ts -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    MediaRecorder.OutputFormat.MPEG_2_TS
                } else {
                    Log.e(Constants.LOG_TAG, "Minimum android Q is required, Setting MPEG_4 output format.")
                    MediaRecorder.OutputFormat.MPEG_4
                }
            }
            Constants.aac_adts -> MediaRecorder.OutputFormat.AAC_ADTS
            else -> MediaRecorder.OutputFormat.MPEG_4
        }
    }
}