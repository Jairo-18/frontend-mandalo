package expo.modules.notifysound

import android.app.NotificationManager
import android.content.Context
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.Ringtone
import android.media.RingtoneManager
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Sonidos de aviso con la app en primer plano.
 *
 * - `play`: el sonido de notificación PREDETERMINADO del teléfono (el que el
 *   usuario eligió en Ajustes). Existe porque Android 16+ trae activado el
 *   "enfriamiento de notificaciones": varias notificaciones seguidas de la
 *   misma app pierden el sonido, y los avisos de un pedido llegan justo así.
 * - `playMessage`: un "pop" corto de mensaje recibido (res/raw/message_pop),
 *   para cuando el usuario ya está mirando ese chat (como WhatsApp/Messenger).
 *
 * Respeta la privacidad del usuario: NO suena en vibración, silencio ni con
 * "No molestar". Usa el volumen de NOTIFICACIONES, no el de multimedia.
 *
 * ⚠️ Lo que está sonando se guarda en un campo: si fuera una variable local,
 * Android la recolecta al salir de la función y corta el audio antes de que
 * se oiga (pasó en la primera versión: "reset at state 4" en el log).
 */
class NotifySoundModule : Module() {
  /** Evita que dos avisos casi simultáneos suenen encimados. */
  private var lastPlayedAt = 0L
  private var ringtone: Ringtone? = null
  private var messagePlayer: MediaPlayer? = null
  private val mainHandler = Handler(Looper.getMainLooper())

  private val attributes: AudioAttributes = AudioAttributes.Builder()
    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
    .build()

  override fun definition() = ModuleDefinition {
    Name("NotifySound")

    AsyncFunction("play") {
      play()
    }

    AsyncFunction("playMessage") {
      playMessage()
    }

    OnDestroy {
      mainHandler.removeCallbacksAndMessages(null)
      ringtone?.stop()
      ringtone = null
      messagePlayer?.release()
      messagePlayer = null
    }
  }

  /** `true` si el teléfono está en modo sonido y sin "No molestar". */
  private fun canSound(context: Context): Boolean {
    val audio = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    if (audio.ringerMode != AudioManager.RINGER_MODE_NORMAL) return false
    val notifications =
      context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    return notifications.currentInterruptionFilter == NotificationManager.INTERRUPTION_FILTER_ALL
  }

  private fun throttled(): Boolean {
    val now = SystemClock.elapsedRealtime()
    if (now - lastPlayedAt < 1000) return true
    lastPlayedAt = now
    return false
  }

  private fun play(): Boolean {
    val context = appContext.reactContext ?: return false
    if (!canSound(context) || throttled()) return false

    val next = RingtoneManager.getRingtone(context, Settings.System.DEFAULT_NOTIFICATION_URI)
      ?: return false
    next.audioAttributes = attributes
    ringtone?.stop()
    ringtone = next
    next.play()
    return true
  }

  private fun playMessage(): Boolean {
    val context = appContext.reactContext ?: return false
    if (!canSound(context) || throttled()) return false

    val audio = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    val player = MediaPlayer.create(
      context,
      R.raw.message_pop,
      attributes,
      audio.generateAudioSessionId(),
    ) ?: return false
    messagePlayer?.release()
    messagePlayer = player
    // "Completado" llega cuando el audio se ENTREGÓ al buffer, no cuando se
    // terminó de oír: liberar ahí mismo cortaba el sonido a los 60-200 ms
    // (según el teléfono) y parecía que solo sonaba "de un lado". Se libera
    // con margen.
    player.setOnCompletionListener {
      mainHandler.postDelayed({
        it.release()
        if (messagePlayer === it) messagePlayer = null
      }, 2000)
    }
    player.start()
    return true
  }
}
