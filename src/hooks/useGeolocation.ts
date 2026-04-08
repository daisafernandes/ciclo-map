import { useCallback, useState } from "react";
import type { LatLngTuple } from "leaflet";

export type GeolocationErrorKind =
  | "unsupported"
  | "denied"
  | "unavailable"
  | "timeout"
  | "unknown";

export function useGeolocation() {
  const [position, setPosition] = useState<LatLngTuple | null>(null);
  const [error, setError] = useState<{ kind: GeolocationErrorKind; message: string } | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const requestPosition = useCallback(() => {
    setError(null);
    if (typeof window === "undefined" || !navigator.geolocation) {
      setError({
        kind: "unsupported",
        message: "Geolocalização não é suportada neste navegador.",
      });
      return;
    }
    if (window.isSecureContext === false) {
      setError({
        kind: "unavailable",
        message: "A geolocalização costuma exigir HTTPS. Abra o app em uma conexão segura.",
      });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => {
        let kind: GeolocationErrorKind = "unknown";
        let message = err.message || "Não foi possível obter a localização.";
        switch (err.code) {
          case err.PERMISSION_DENIED:
            kind = "denied";
            message = "Permissão de localização negada. Ative nas configurações do navegador.";
            break;
          case err.POSITION_UNAVAILABLE:
            kind = "unavailable";
            message = "Posição indisponível no momento.";
            break;
          case err.TIMEOUT:
            kind = "timeout";
            message = "Tempo esgotado ao obter a localização. Tente de novo.";
            break;
          default:
            break;
        }
        setError({ kind, message });
      },
      { enableHighAccuracy: true, timeout: 18_000, maximumAge: 60_000 },
    );
  }, []);

  return { position, error, requestPosition, clearError };
}
