package com.abook.tts

import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat

/**
 * Keeps the process, and while playing the CPU, awake for the player. It owns no state: JS says
 * what to show, and the notification's button and the app being swiped away are only passed on.
 */
class PlaybackService : Service() {
  private var wakeLock: PowerManager.WakeLock? = null

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    running = this
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (val command = intent?.action) {
      PLAY,
      PAUSE -> listener?.invoke(command)
      else -> enterForeground()
    }
    // Without JS there is nothing to play, so the system must not start it again
    return START_NOT_STICKY
  }

  override fun onTaskRemoved(rootIntent: Intent?) {
    listener?.invoke(STOP)
    stopSelf()
  }

  override fun onDestroy() {
    if (running === this) running = null
    keepAwake(false)
    super.onDestroy()
  }

  private fun enterForeground() {
    // Asked to stop between the start and now: it must still enter the foreground once, or it crashes
    val info = current ?: EMPTY
    val type =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q)
            ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
        else 0
    runCatching {
          val notification = PlaybackNotification.build(this, info)
          ServiceCompat.startForeground(this, PlaybackNotification.ID, notification, type)
        }
        .onFailure { stopSelf() }
    if (current == null) stopSelf() else keepAwake(info.playing)
  }

  private fun update(info: PlaybackInfo) {
    PlaybackNotification.show(this, info)
    keepAwake(info.playing)
  }

  private fun keepAwake(awake: Boolean) {
    if (!awake) {
      wakeLock?.takeIf { it.isHeld }?.release()
      wakeLock = null
    } else if (wakeLock == null) {
      val power = getSystemService(Context.POWER_SERVICE) as PowerManager
      wakeLock =
          power.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "abook:playback").apply { acquire() }
    }
  }

  companion object {
    const val PLAY = "play"
    const val PAUSE = "pause"
    const val STOP = "stop"

    private val EMPTY = PlaybackInfo("", "", false, "", "ABook")
    private var running: PlaybackService? = null
    private var current: PlaybackInfo? = null

    /** Where the commands go; set by the module while JS is there. */
    var listener: ((String) -> Unit)? = null

    /**
     * Starts the service, or changes what it shows. Android 12+ refuses to start it from the
     * background: playback goes on without it.
     */
    fun show(context: Context, info: PlaybackInfo) {
      current = info
      val service = running
      if (service != null) {
        service.update(info)
      } else {
        val intent = Intent(context, PlaybackService::class.java)
        runCatching { ContextCompat.startForegroundService(context, intent) }
      }
    }

    fun hide() {
      current = null
      running?.stopSelf()
      // The next show starts a new one, even if this one is not destroyed yet
      running = null
    }
  }
}
