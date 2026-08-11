/**
 * Play In-App Update es solo Android (ver app-update.ts) y su librería
 * nativa no tiene build para web — Metro no puede resolverla al armar el
 * bundle web aunque el chequeo de Platform sea en runtime. Override .web
 * no-op para que expo export --platform web no la incluya.
 */
export function useAppUpdateCheck(): void {}
