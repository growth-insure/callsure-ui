import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AudioSourceBadge } from "@/app/dashboard/components/AudioSourceBadge";

describe("AudioSourceBadge", () => {
  it("renders Lightspeedvoice by default when env config is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_AUDIO_SOURCE_CLIENT", "");

    render(<AudioSourceBadge />);

    expect(
      screen.getByLabelText("Audio source: Lightspeed Voice")
    ).toBeInTheDocument();
    expect(screen.getByAltText("Lightspeed Voice logo")).toHaveAttribute(
      "src",
      "/assets/audio-clients/lightspeedvoice-logo.png"
    );
  });

  it("renders the RingCentral badge when configured", () => {
    vi.stubEnv("NEXT_PUBLIC_AUDIO_SOURCE_CLIENT", "ringcentral");

    render(<AudioSourceBadge />);

    expect(
      screen.getByLabelText("Audio source: RingCentral")
    ).toBeInTheDocument();
    expect(screen.getByAltText("RingCentral logo")).toHaveAttribute(
      "src",
      "/assets/audio-clients/ringcentral-logo.svg"
    );
  });
});
