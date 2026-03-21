export const DEFAULT_AUDIO_CLIENT_ID = "lightspeedvoice" as const;

export type AudioClientId = "lightspeedvoice" | "ringcentral";

export interface AudioClientDefinition {
  id: AudioClientId;
  label: string;
  shortLabel: string;
  iconPath: string;
  iconAlt: string;
}

export const AUDIO_CLIENTS: Record<AudioClientId, AudioClientDefinition> = {
  lightspeedvoice: {
    id: "lightspeedvoice",
    label: "Lightspeed Voice",
    shortLabel: "LSV",
    iconPath: "/assets/audio-clients/lightspeedvoice-logo.png",
    iconAlt: "Lightspeed Voice logo",
  },
  ringcentral: {
    id: "ringcentral",
    label: "RingCentral",
    shortLabel: "RC",
    iconPath: "/assets/audio-clients/ringcentral-logo.svg",
    iconAlt: "RingCentral logo",
  },
};

const AUDIO_CLIENT_ALIASES: Record<string, AudioClientId> = {
  lightspeedvoice: "lightspeedvoice",
  lightspeed: "lightspeedvoice",
  ringcentral: "ringcentral",
  ring: "ringcentral",
};

export function normalizeAudioClientId(
  value?: string | null
): AudioClientId | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase().replace(/[\s_-]+/g, "");
  return AUDIO_CLIENT_ALIASES[normalized] ?? null;
}

export function getConfiguredAudioClient(
  value = process.env.NEXT_PUBLIC_AUDIO_SOURCE_CLIENT
): AudioClientDefinition {
  const resolvedId = normalizeAudioClientId(value) ?? DEFAULT_AUDIO_CLIENT_ID;
  return AUDIO_CLIENTS[resolvedId];
}
