import { describe, expect, it } from "vitest";
import {
  DEFAULT_AUDIO_CLIENT_ID,
  getConfiguredAudioClient,
  normalizeAudioClientId,
} from "@/lib/audioClients";

describe("audioClients", () => {
  it("normalizes supported client aliases", () => {
    expect(normalizeAudioClientId("lightspeedvoice")).toBe("lightspeedvoice");
    expect(normalizeAudioClientId("Lightspeed Voice")).toBe("lightspeedvoice");
    expect(normalizeAudioClientId("ringcentral")).toBe("ringcentral");
    expect(normalizeAudioClientId("Ring_Central")).toBe("ringcentral");
  });

  it("returns null for unsupported values", () => {
    expect(normalizeAudioClientId("unknown")).toBeNull();
    expect(normalizeAudioClientId("")).toBeNull();
    expect(normalizeAudioClientId(undefined)).toBeNull();
  });

  it("falls back to the default client when the env value is missing", () => {
    expect(getConfiguredAudioClient(undefined).id).toBe(DEFAULT_AUDIO_CLIENT_ID);
    expect(getConfiguredAudioClient("").id).toBe(DEFAULT_AUDIO_CLIENT_ID);
  });

  it("falls back to the default client when the env value is invalid", () => {
    expect(getConfiguredAudioClient("unsupported-client").id).toBe(
      DEFAULT_AUDIO_CLIENT_ID
    );
  });

  it("returns the configured ringcentral client when present", () => {
    expect(getConfiguredAudioClient("Ring Central").id).toBe("ringcentral");
  });
});
