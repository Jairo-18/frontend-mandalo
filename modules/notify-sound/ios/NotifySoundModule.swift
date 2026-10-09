import AudioToolbox
import ExpoModulesCore

/**
 * iOS: solo el sonido DENTRO del chat (`playMessage`). Usa el tono de mensaje
 * recibido del sistema, que respeta el interruptor de silencio. `play` devuelve
 * false a propósito: en iOS no existe el "enfriamiento" de Android y el sonido
 * de la notificación normal ya funciona (push.ts deja sonar la notificación).
 */
public class NotifySoundModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NotifySound")

    AsyncFunction("play") { () -> Bool in
      return false
    }

    AsyncFunction("playMessage") { () -> Bool in
      // 1003 = "ReceivedMessage" (sonido de sistema; mudo con el switch de silencio).
      AudioServicesPlaySystemSound(1003)
      return true
    }
    .runOnQueue(.main)
  }
}
