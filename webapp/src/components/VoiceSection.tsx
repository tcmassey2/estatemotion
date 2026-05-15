import { useEffect, useState } from "react";
import { useStore } from "../lib/store";

/**
 * VoiceSection — Settings widget for picking the narrator voice.
 *
 * Reads the catalog from /api/voices, renders a radio-style picker, and
 * writes the selection to brandKit.voiceId (which the store auto-syncs to
 * Supabase). The render-worker's voice-mixer resolves the slug back into
 * the underlying ElevenLabs voice ID + tuned per-voice settings.
 *
 * Default selection: empty string ("Use style default") so the worker
 * picks the right voice based on the active style pack at render time.
 */

interface PublicVoice {
  slug: string;
  label: string;
  description: string;
  gender: string;
  accent: string;
  bestFor: string[];
}

interface VoicesResponse {
  voices: PublicVoice[];
  defaultsByStyle: Record<string, string>;
}

export default function VoiceSection() {
  const branding = useStore((s) => s.branding);
  const setBranding = useStore((s) => s.setBranding);

  const [voices, setVoices] = useState<PublicVoice[] | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/voices")
      .then((res) => res.json())
      .then((data: VoicesResponse) => {
        if (!alive) return;
        setVoices(Array.isArray(data?.voices) ? data.voices : []);
      })
      .catch((err) => {
        if (!alive) return;
        setLoadError(err instanceof Error ? err.message : "Couldn't load voice catalog.");
        setVoices([]);
      });
    return () => { alive = false; };
  }, []);

  const selectedSlug = branding.voiceId || "";

  const handlePick = (slug: string, label: string) => {
    setBranding({
      voiceId: slug || undefined,
      voiceLabel: label || undefined
    });
  };

  if (voices === null) {
    return (
      <div className="rounded-lg border border-edge-soft bg-surface-input p-4 animate-pulse">
        <div className="h-4 w-40 bg-edge rounded mb-2" />
        <div className="h-3 w-56 bg-edge rounded" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="px-3 py-2.5 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-300">
        {loadError}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-ink-muted leading-relaxed max-w-xl">
        Pick the narrator that runs across your videos. "Use style default" lets us
        match the voice to whichever style pack you choose for each render
        (warm Sarah for Luxury, energetic Bella for Viral, deep Drew for Investor).
      </div>

      <div className="flex flex-col gap-2">
        {/* Default option — no slug means "use style default" */}
        <VoiceOption
          slug=""
          label="Use style default"
          description="Best match per style pack — recommended."
          accent=""
          gender=""
          selected={selectedSlug === ""}
          onPick={() => handlePick("", "Use style default")}
        />

        {voices.map((v) => (
          <VoiceOption
            key={v.slug}
            slug={v.slug}
            label={v.label}
            description={v.description}
            accent={v.accent}
            gender={v.gender}
            selected={selectedSlug === v.slug}
            onPick={() => handlePick(v.slug, v.label)}
          />
        ))}
      </div>

      <div className="text-[11px] text-ink-dim leading-relaxed mt-2">
        Voices are powered by ElevenLabs. Same voice plays across every scene of a render.
        You can change it any time — your next render will use the new pick.
      </div>
    </div>
  );
}

function VoiceOption({
  slug,
  label,
  description,
  accent,
  gender,
  selected,
  onPick
}: {
  slug: string;
  label: string;
  description: string;
  accent: string;
  gender: string;
  selected: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      data-voice-slug={slug || "default"}
      className={
        "card-press text-left w-full px-4 py-3 rounded-lg border transition-colors " +
        (selected
          ? "border-gold bg-gold/10 ring-2 ring-gold/30"
          : "border-edge bg-surface-input hover:border-edge-strong hover:bg-surface")
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold tracking-tightish text-ink flex items-center gap-2 flex-wrap">
            {label}
            {accent && (
              <span className="text-[9px] font-bold tracking-widest px-1.5 py-px rounded bg-surface text-ink-muted border border-edge uppercase">
                {accent}
              </span>
            )}
            {gender && (
              <span className="text-[9px] font-bold tracking-widest px-1.5 py-px rounded bg-surface text-ink-muted border border-edge uppercase">
                {gender}
              </span>
            )}
          </div>
          <div className="text-xs text-ink-muted mt-1 leading-relaxed">{description}</div>
        </div>
        <div className={
          "shrink-0 w-5 h-5 rounded-full border-2 transition-colors mt-0.5 " +
          (selected
            ? "border-gold bg-gold"
            : "border-edge bg-transparent")
        }>
          {selected && (
            <svg viewBox="0 0 20 20" fill="none" className="w-full h-full p-0.5">
              <path
                d="M5 10.5l3 3 7-7"
                stroke="#0E0E10"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
}
