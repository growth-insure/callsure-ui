"use client";

import Image from "next/image";
import { Volume2 } from "lucide-react";
import { getConfiguredAudioClient } from "@/lib/audioClients";

export function AudioSourceBadge() {
  const audioClient = getConfiguredAudioClient();

  return (
    <div
      className="flex h-10 shrink-0 items-center rounded-full border border-slate-200/80 bg-white/95 px-3 shadow-sm ring-1 ring-black/5"
      title={`Audio source: ${audioClient.label}`}
      aria-label={`Audio source: ${audioClient.label}`}
    >
      <Volume2 className="mr-2 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
      <Image
        src={audioClient.iconPath}
        alt={audioClient.iconAlt}
        width={120}
        height={32}
        className="h-5 w-auto max-w-[88px] object-contain sm:max-w-[112px]"
      />
    </div>
  );
}
