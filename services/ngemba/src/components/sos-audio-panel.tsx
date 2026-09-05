"use client";

import { useState } from "react";
import { AudioUploadButton } from "@/components/audio-upload-button";
import { VoiceButton } from "@/components/voice-button";

type Props = {
  recordLabel: string;
  listeningLabel: string;
  importLabel: string;
  changeLabel: string;
  tooLargeLabel: string;
  unsupportedLabel: string;
  onAudioChange: (blob: Blob | null) => void;
  discrete?: boolean;
  className?: string;
};

/**
 * SOS audio: mic record (native MediaRecorder mime) OR file import.
 * Mutual exclusive - one source at a time. No forced mp3/wav.
 */
export function SosAudioPanel({
  recordLabel,
  listeningLabel,
  importLabel,
  changeLabel,
  tooLargeLabel,
  unsupportedLabel,
  onAudioChange,
  discrete = false,
  className = "",
}: Props) {
  const [recordReset, setRecordReset] = useState(0);
  const [importReset, setImportReset] = useState(0);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <VoiceButton
          label={recordLabel}
          listeningLabel={listeningLabel}
          unsupportedLabel={unsupportedLabel}
          onAudioChange={(blob) => {
            if (blob) setImportReset((n) => n + 1);
            onAudioChange(blob);
          }}
          discrete={discrete}
          resetToken={recordReset}
          className="w-full"
        />
        <AudioUploadButton
          label={importLabel}
          changeLabel={changeLabel}
          tooLargeLabel={tooLargeLabel}
          unsupportedLabel={unsupportedLabel}
          onAudioChange={(blob) => {
            if (blob) setRecordReset((n) => n + 1);
            onAudioChange(blob);
          }}
          discrete={discrete}
          resetToken={importReset}
          className="w-full"
        />
      </div>
    </div>
  );
}
