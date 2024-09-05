package com.audiowaveform

enum class DurationType { Current, Max }

object Constants {

    const val path = "path"
    const val LOG_TAG = "AudioWaveforms"
    const val fileNameFormat = "dd-MM-yy-hh-mm-ss"
    const val currentDuration = "currentDuration"


    /** encoder */
    const val acc = 1
    const val aac_eld = 2
    const val he_aac = 3
    const val opus = 6
    const val vorbis = 7

    /** output format */
    const val mpeg4 = 1
    const val three_gpp = 2
    const val ogg = 3
    const val webm = 6
    const val mpeg_2_ts = 7
    const val aac_adts = 8

    /** common */
    const val amr_nb = 4
    const val amr_wb = 5

    const val progress = "progress"
    const val volume = "volume"
    const val durationType = "durationType"
    const val playerKey = "playerKey"
    const val finishMode = "finishMode"
    const val finishType = "finishType"
    const val noOfSamples = "noOfSamples"
    const val onCurrentRecordingWaveformData = "onCurrentRecordingWaveformData"
    const val onCurrentExtractedWaveformData = "onCurrentExtractedWaveformData"
    const val waveformData = "waveformData"
    const val updateFrequency = "updateFrequency"
    const val currentDecibel = "currentDecibel"
    const val bitRate = "bitRate"
    const val sampleRate = "sampleRate"
    const val speed = "speed"
}

enum class FinishMode(val value:Int) {
    Loop(0),
    Pause(1),
    Stop(2)
}

enum class UpdateFrequency(val value:Long) {
    High(50),
    Medium(100),
    Low(200),
}