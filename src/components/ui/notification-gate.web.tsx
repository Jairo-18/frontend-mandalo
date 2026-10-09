/**
 * En web no hay push: los avisos del navegador se activan desde el perfil
 * (`<WebNotifyRow/>`), porque el navegador solo deja pedirlos tras un toque.
 */
export function NotificationGate() {
  return null;
}
