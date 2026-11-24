package com.abook.tts

import android.content.Context
import android.media.AudioAttributes
import android.os.Bundle
import android.os.Handler
import android.os.HandlerThread
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.speech.tts.Voice
import java.util.Locale

/** One sentence, as it comes from JS. */
data class Utterance(
    val id: String,
    val text: String,
    val voiceId: String?,
    val language: String,
    val rate: Float,
    val pitch: Float,
)

/** Why an utterance failed; the codes cross the bridge. */
enum class SpeechError(val code: String) {
  ENGINE("engine"),
  LANGUAGE("language"),
  SYNTHESIS("synthesis"),
}

/**
 * `TextToSpeech`, created on first use, with what is asked of it meanwhile queued until it is ready.
 * Everything runs on its own thread, because the calls cross processes. An engine that stops
 * answering (updated, killed, disabled) is dropped, so the next call starts a new one.
 */
class SpeechEngine(private val context: Context, private val listener: Listener) {
  interface Listener {
    fun onStart(id: String)

    fun onDone(id: String)

    fun onError(id: String, error: SpeechError)
  }

  private val thread = HandlerThread("AbookTts").apply { start() }
  private val handler = Handler(thread.looper)
  private var tts: TextToSpeech? = null
  private var ready = false
  private val waiting = mutableListOf<(TextToSpeech?) -> Unit>()
  /** Raised by `stop`: what was asked to be spoken before it, and still waits, is dropped. */
  private var stops = 0

  fun speak(utterance: Utterance) {
    handler.post {
      val asked = stops
      withEngine { engine ->
        when {
          asked != stops -> Unit
          engine == null -> listener.onError(utterance.id, SpeechError.ENGINE)
          !configure(engine, utterance) -> listener.onError(utterance.id, SpeechError.LANGUAGE)
          else -> start(engine, utterance)
        }
      }
    }
  }

  fun stop(done: () -> Unit) {
    handler.post {
      stops += 1
      if (ready) tts?.stop()
      done()
    }
  }

  /** `null`: there is no engine. */
  fun voices(result: (Collection<Voice>?) -> Unit) {
    handler.post { withEngine { engine -> result(engine?.let(::voicesOf)) } }
  }

  fun isSpeaking(result: (Boolean) -> Unit) {
    handler.post { result(ready && tts?.isSpeaking == true) }
  }

  fun shutdown() {
    handler.post {
      drop()
      thread.quitSafely()
    }
  }

  private fun start(engine: TextToSpeech, utterance: Utterance) {
    val queued = engine.speak(utterance.text, TextToSpeech.QUEUE_FLUSH, Bundle(), utterance.id)
    if (queued != TextToSpeech.SUCCESS) {
      drop()
      listener.onError(utterance.id, SpeechError.ENGINE)
    }
  }

  private fun configure(engine: TextToSpeech, utterance: Utterance): Boolean {
    engine.setSpeechRate(utterance.rate)
    engine.setPitch(utterance.pitch)
    val wanted = utterance.voiceId
    val current = runCatching { engine.voice?.name }.getOrNull()
    if (wanted != null && wanted == current) return true
    val voice = wanted?.let { id -> voicesOf(engine).firstOrNull { it.name == id } }
    if (voice != null && engine.setVoice(voice) == TextToSpeech.SUCCESS) return true
    val available = engine.setLanguage(Locale.forLanguageTag(utterance.language))
    return available >= TextToSpeech.LANG_AVAILABLE
  }

  /** Some engines throw, or return null, instead of an empty set. */
  private fun voicesOf(engine: TextToSpeech): Collection<Voice> =
      runCatching { engine.voices }.getOrNull() ?: emptySet()

  private fun withEngine(block: (TextToSpeech?) -> Unit) {
    val engine = tts
    if (engine != null && ready) {
      block(engine)
      return
    }
    waiting.add(block)
    if (engine == null) create()
  }

  private fun create() {
    // The listener can be called on any thread, even before the constructor returns
    tts = TextToSpeech(context) { status -> handler.post { onInit(status) } }
  }

  private fun onInit(status: Int) {
    val engine = tts ?: return
    if (status == TextToSpeech.SUCCESS) {
      ready = true
      engine.setAudioAttributes(SPEECH_AUDIO)
      engine.setOnUtteranceProgressListener(Progress(listener))
    } else {
      drop()
    }
    val blocks = waiting.toList()
    waiting.clear()
    blocks.forEach { it(tts) }
  }

  private fun drop() {
    tts?.shutdown()
    tts = null
    ready = false
  }

  private class Progress(private val listener: Listener) : UtteranceProgressListener() {
    override fun onStart(id: String) = listener.onStart(id)

    override fun onDone(id: String) = listener.onDone(id)

    @Deprecated("Replaced by the one with a code; still abstract")
    override fun onError(id: String) = listener.onError(id, SpeechError.SYNTHESIS)

    override fun onError(id: String, code: Int) =
        listener.onError(
            id,
            when (code) {
              TextToSpeech.ERROR_NOT_INSTALLED_YET -> SpeechError.LANGUAGE
              TextToSpeech.ERROR_SERVICE -> SpeechError.ENGINE
              else -> SpeechError.SYNTHESIS
            })
  }

  companion object {
    val SPEECH_AUDIO: AudioAttributes =
        AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_MEDIA)
            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
            .build()
  }
}
