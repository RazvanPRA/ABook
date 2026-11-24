package com.abook.tts

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import com.abook.MainActivity
import com.abook.R

/** What the notification shows; every text comes translated from JS. */
data class PlaybackInfo(
    val title: String,
    val text: String,
    val playing: Boolean,
    val actionLabel: String,
    val channelName: String,
)

/** The player's notification: the book, its chapter and Pause or Play. */
object PlaybackNotification {
  const val ID = 1
  private const val CHANNEL = "playback"

  fun show(context: Context, info: PlaybackInfo) =
      manager(context).notify(ID, build(context, info))

  fun build(context: Context, info: PlaybackInfo): Notification {
    createChannel(context, info.channelName)
    return NotificationCompat.Builder(context, CHANNEL)
        .setSmallIcon(R.drawable.ic_playback)
        .setContentTitle(info.title)
        .setContentText(info.text)
        .setContentIntent(openPlayer(context))
        .setCategory(NotificationCompat.CATEGORY_TRANSPORT)
        .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
        .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
        .setOngoing(info.playing)
        .setOnlyAlertOnce(true)
        .setSilent(true)
        .addAction(action(context, info))
        .build()
  }

  private fun action(context: Context, info: PlaybackInfo): NotificationCompat.Action {
    val icon =
        if (info.playing) android.R.drawable.ic_media_pause else android.R.drawable.ic_media_play
    val command = if (info.playing) PlaybackService.PAUSE else PlaybackService.PLAY
    val intent = Intent(context, PlaybackService::class.java).setAction(command)
    val pending = PendingIntent.getService(context, 0, intent, FLAGS)
    return NotificationCompat.Action.Builder(icon, info.actionLabel, pending).build()
  }

  private fun openPlayer(context: Context): PendingIntent {
    val intent =
        Intent(context, MainActivity::class.java)
            .setAction(Intent.ACTION_VIEW)
            .setData(Uri.parse("abook://player"))
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    return PendingIntent.getActivity(context, 0, intent, FLAGS)
  }

  private fun createChannel(context: Context, name: String) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    // Creating an existing channel only updates its name
    manager(context)
        .createNotificationChannel(
            NotificationChannel(CHANNEL, name, NotificationManager.IMPORTANCE_LOW))
  }

  private fun manager(context: Context) =
      context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

  private const val FLAGS = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
}
