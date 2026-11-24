package com.abook.tts

import android.speech.tts.TextToSpeech
import android.speech.tts.Voice
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import java.util.Locale

/** The engine's voices, in the shape of the Codegen spec's `NativeVoice`. */
object TtsVoices {
  /** Engines report `ron` and `ROU` (ISO 639-2, ISO 3166 alpha-3) as often as `ro` and `RO`. */
  private val languages: Map<String, String> by lazy {
    Locale.getISOLanguages().associateBy { iso3Language(Locale.forLanguageTag(it)) }
  }
  private val countries: Map<String, String> by lazy {
    Locale.getISOCountries().associateBy { iso3Country(it) }
  }

  fun toArray(voices: Collection<Voice>): WritableArray =
      Arguments.createArray().apply { voices.forEach { pushMap(toMap(it)) } }

  /** `ro_RO`, `ron-ROU` → `ro-RO`. */
  fun languageTag(locale: Locale): String {
    val language = locale.language.lowercase(Locale.ROOT)
    val country = locale.country.uppercase(Locale.ROOT)
    val shortLanguage = languages[language] ?: language
    val shortCountry = countries[country] ?: country
    return if (shortCountry.isEmpty()) shortLanguage else "$shortLanguage-$shortCountry"
  }

  private fun toMap(voice: Voice): WritableMap =
      Arguments.createMap().apply {
        putString("id", voice.name)
        putString("name", voice.name)
        putString("language", languageTag(voice.locale))
        putDouble("quality", voice.quality.toDouble())
        putBoolean("network", voice.isNetworkConnectionRequired)
        putBoolean("installed", !isMissing(voice))
      }

  private fun isMissing(voice: Voice): Boolean =
      voice.features?.contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED) ?: false

  private fun iso3Language(locale: Locale): String =
      runCatching { locale.isO3Language }.getOrDefault(locale.language)

  private fun iso3Country(country: String): String =
      runCatching { Locale.Builder().setRegion(country).build().isO3Country }.getOrDefault(country)
}
