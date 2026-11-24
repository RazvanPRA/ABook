package com.abook.tts

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.AudioManager
import androidx.core.content.ContextCompat

/**
 * The right to be heard, held from the first sentence until `stop`. A call, another player or the
 * headphones being unplugged end it. Being asked to duck (a notification sound) doesn't: the voice
 * goes on.
 */
class SpeechFocus(private val context: Context, private val onLost: () -> Unit) {
  private val audio = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
  private var held = false

  private val focusListener =
      AudioManager.OnAudioFocusChangeListener { change ->
        if (change == AudioManager.AUDIOFOCUS_LOSS ||
            change == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
          onLost()
        }
      }

  private val noisyReceiver =
      object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) = onLost()
      }

  /** `false`: something that can't be interrupted (a call) is being heard. */
  @Suppress("DEPRECATION") // The replacement needs API 26; minSdk is 24
  @Synchronized
  fun request(): Boolean {
    if (held) return true
    val answer =
        audio.requestAudioFocus(
            focusListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN)
    held = answer == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
    if (held) {
      ContextCompat.registerReceiver(
          context,
          noisyReceiver,
          IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY),
          ContextCompat.RECEIVER_NOT_EXPORTED)
    }
    return held
  }

  @Suppress("DEPRECATION")
  @Synchronized
  fun abandon() {
    if (!held) return
    held = false
    audio.abandonAudioFocus(focusListener)
    context.unregisterReceiver(noisyReceiver)
  }
}
