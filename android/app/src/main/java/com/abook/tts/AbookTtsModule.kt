package com.abook.tts

import android.content.Intent
import com.abook.specs.NativeAbookTtsSpec
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap

/** The Codegen module: translates between JS and `SpeechEngine`. */
class AbookTtsModule(reactContext: ReactApplicationContext) : NativeAbookTtsSpec(reactContext) {
  private val engine = SpeechEngine(reactContext.applicationContext, Events())
  private val focus = SpeechFocus(reactContext.applicationContext) { emitCommand(INTERRUPTION) }

  init {
    PlaybackService.listener = ::emitCommand
  }

  override fun getName() = NAME

  override fun getVoices(promise: Promise) =
      engine.voices { voices ->
        if (voices == null) {
          promise.reject(SpeechError.ENGINE.code, "No speech engine")
        } else {
          promise.resolve(TtsVoices.toArray(voices))
        }
      }

  override fun speak(request: ReadableMap) {
    if (!focus.request()) {
      emitCommand(INTERRUPTION)
      return
    }
    engine.speak(
        Utterance(
            id = request.getString("id").orEmpty(),
            text = request.getString("text").orEmpty(),
            voiceId = if (request.isNull("voiceId")) null else request.getString("voiceId"),
            language = request.getString("language").orEmpty(),
            rate = request.getDouble("rate").toFloat(),
            pitch = request.getDouble("pitch").toFloat(),
        ))
  }

  override fun stop(promise: Promise) {
    focus.abandon()
    engine.stop { promise.resolve(null) }
  }

  override fun isSpeaking(promise: Promise) = engine.isSpeaking { promise.resolve(it) }

  override fun openSettings(promise: Promise) {
    val intent = Intent(ACTION_TTS_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    runCatching { reactApplicationContext.startActivity(intent) }
        .onSuccess { promise.resolve(null) }
        .onFailure { promise.reject("settings", it) }
  }

  override fun showPlayback(info: ReadableMap) =
      PlaybackService.show(
          reactApplicationContext.applicationContext,
          PlaybackInfo(
              title = info.getString("title").orEmpty(),
              text = info.getString("text").orEmpty(),
              playing = info.getBoolean("playing"),
              actionLabel = info.getString("actionLabel").orEmpty(),
              channelName = info.getString("channelName").orEmpty(),
          ))

  override fun hidePlayback() = PlaybackService.hide()

  override fun invalidate() {
    PlaybackService.listener = null
    PlaybackService.hide()
    focus.abandon()
    engine.shutdown()
    super.invalidate()
  }

  private fun emitCommand(type: String) {
    if (!reactApplicationContext.hasActiveReactInstance()) return
    emitOnPlaybackCommand(Arguments.createMap().apply { putString("type", type) })
  }

  private inner class Events : SpeechEngine.Listener {
    override fun onStart(id: String) = emit(id, "start")

    override fun onDone(id: String) = emit(id, "done")

    override fun onError(id: String, error: SpeechError) = emit(id, "error", error.code)

    private fun emit(id: String, type: String, code: String = "") {
      // Once JS is gone there is nobody to tell
      if (!reactApplicationContext.hasActiveReactInstance()) return
      emitOnUtterance(
          Arguments.createMap().apply {
            putString("id", id)
            putString("type", type)
            putString("code", code)
          })
    }
  }

  companion object {
    const val NAME = "AbookTts"
    private const val INTERRUPTION = "interruption"
    private const val ACTION_TTS_SETTINGS = "com.android.settings.TTS_SETTINGS"
  }
}
