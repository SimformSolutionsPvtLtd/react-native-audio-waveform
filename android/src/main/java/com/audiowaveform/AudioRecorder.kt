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

    private fun isPermissionGranted(activity: Activity?): Int {
        Log.d(Constants.LOG_TAG, "isPermissionGranted: ${ActivityCompat.checkSelfPermission(activity!!, permissions[0])}")
        return ActivityCompat.checkSelfPermission(activity, permissions[0])
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
            val db = 20 * log10((recorder?.maxAmplitude?.toDouble() ?: (0.0 / 32768.0)))
            if (db == Double.NEGATIVE_INFINITY) {
                Log.d(Constants.LOG_TAG, "Microphone might be turned off")
            } else {
                // promise.resolve(db)
                Log.d(Constants.LOG_TAG, "Promise Rejected useLegacyNormalization")
            }
            return db;
        } else {
            // promise.resolve(recorder?.maxAmplitude?.toDouble() ?: 0.0)
            Log.d(Constants.LOG_TAG, "Promise Rejected Get Decibel")
            return null
        }
    }

    fun initRecorder(
        path: String,
        recorder: MediaRecorder?,
        encoder: Int,
        outputFormat: Int,
        sampleRate: Int,
        bitRate: Int?,
        promise: Promise
    ) {
        recorder?.apply {
            setAudioSource(MediaRecorder.AudioSource.MIC)
            setOutputFormat(getOutputFormat(outputFormat))
            setAudioEncoder(getEncoder(encoder))
            setAudioSamplingRate(sampleRate)
            if (bitRate != null) {
                setAudioEncodingBitRate(bitRate)
            }
            setOutputFile(path)
            try {
                prepare()
                promise.resolve(true)
            } catch (e: IOException) {
                Log.e(Constants.LOG_TAG, "Failed to stop initialize recorder")
            }
        }
    }

    fun stopRecording(recorder: MediaRecorder?, path: String, promise: Promise) {
        Log.d(Constants.LOG_TAG, "inside stop Recording function")
        try {
            recorder?.apply {
                stop()
                reset()
                release()
            }
            // TODO: WORK HERE
            // val audioInfoArrayList = ArrayList<String>()
            val tempArrayForCommunication : MutableList<String> = mutableListOf()
            val duration = getDuration(path)
            tempArrayForCommunication.add(path)
            tempArrayForCommunication.add(duration)
            Log.d(Constants.LOG_TAG, "tempArrayForCommunication: $tempArrayForCommunication")
            promise.resolve(Arguments.fromList(tempArrayForCommunication))
        } catch (e: IllegalStateException) {
            Log.e(Constants.LOG_TAG, "Failed to stop recording")
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
        Log.d(Constants.LOG_TAG, "recording started with useLegacyNormalization: $useLegacy")
        try {
            useLegacyNormalization = useLegacy
            recorder?.start()
            promise.resolve(true)
        } catch (e: IllegalStateException) {
            Log.e(Constants.LOG_TAG, "Failed to start recording")
        }
    }

    @RequiresApi(Build.VERSION_CODES.N)
    fun pauseRecording(recorder: MediaRecorder?, promise: Promise) {
        try {
            recorder?.pause()
            promise.resolve(false)
        } catch (e: IllegalStateException) {
            Log.e(Constants.LOG_TAG, "Failed to pause recording")
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