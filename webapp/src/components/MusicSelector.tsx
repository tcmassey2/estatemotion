// Vistalia — MusicSelector (v3: style-tabbed).
//
// Layout rationale (vs v2):
//   v2 rendered every track in one flat grouped list. That read fine at ~6
//   tracks but became a long, noisy scroll once the library grew to 19
//   (18 Pixabay picks + Poradovskyi) across 4 styles.
//
//   v3 leans on a fact the app already knows: the chosen RENDER style implies
//   which music is relevant. So we surface a style tab bar, auto-focus the tab
//   matching the current render style, and show only that style's ~4-6 tracks
//   at a time. The user can still browse other styles by tapping a tab — and
//   if their active track lives on another tab, that tab is dotted so the
//   selection is never hidden. Same one-tap play / one-tap select, same store
//   contract (selectedMusicTrackId; null = use style default).

import { useEffect, useRef, useState } from "react";
import { useStore } from "../lib/store";
import {
  MUSIC_CATALOG,
  defaultTrackForStyle,
  previewUrlFor,
  tracksGroupedByStyle,
  beatSyncFor,
  type MusicTrack
} from "../lib/music-catalog";
import type { StyleId } from "../lib/types";
import { cn } from "../lib/cn";

const STYLE_LABELS: Record<StyleId, string> = {
  "cinematic-luxury": "Luxury",
  "modern-social": "Social",
  "mls-clean": "MLS",
  "investor-tour": "Investor"
};

const STYLE_ORDER: StyleId[] = [
  "cinematic-luxury",
  "modern-social",
  "mls-clean",
  "investor-tour"
];

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function MusicSelector() {
  const selectedStyleId = useStore((s) => s.selectedStyleId);
  const selectedMusicTrackId = useStore((s) => s.selectedMusicTrackId);
  const setMusicTrack = useStore((s) => s.setMusicTrack);

  const styleDefault = defaultTrackForStyle(selectedStyleId);
  const effectiveTrackId = selectedMusicTrackId ?? styleDefault.id;
  const effectiveTrack =
    MUSIC_CATALOG.find((t) => t.id === effectiveTrackId) ?? styleDefault;

  // Which style tab is open. Follows the render style by default, but the
  // user can tab away to browse. Re-syncs whenever the render style changes
  // (that action also clears the music override in the store).
  const [activeStyle, setActiveStyle] = useState<StyleId>(selectedStyleId);
  useEffect(() => {
    setActiveStyle(selectedStyleId);
  }, [selectedStyleId]);

  // Audio playback state. Only one preview at a time. The persistent <audio>
  // tag lives below the list and ONLY mounts while previewing.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  const handlePreview = (track: MusicTrack) => {
    setPreviewError(null);
    if (previewingId === track.id) {
      audioRef.current?.pause();
      setPreviewingId(null);
      return;
    }
    setPreviewingId(track.id);
  };

  const handleSelect = (track: MusicTrack) => {
    // Picking the render style's own default stores null so future style
    // changes keep re-tracking the default. Anything else stores the id.
    setMusicTrack(track.id === styleDefault.id ? null : track.id);
  };

  const previewTrack = previewingId
    ? MUSIC_CATALOG.find((t) => t.id === previewingId) ?? null
    : null;

  const groups = tracksGroupedByStyle();
  const countByStyle = groups.reduce<Record<string, number>>((acc, g) => {
    acc[g.style] = g.tracks.length;
    return acc;
  }, {});
  const activeTracks = groups.find((g) => g.style === activeStyle)?.tracks ?? [];
  // Style that owns the currently-in-use track — used to dot its tab so a
  // cross-style selection stays findable.
  const inUseStyle = effectiveTrack.style;

  return (
    <div className="flex flex-col gap-3">
      {/* Header — current selection at a glance + reset link. */}
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="text-ink-muted">
          In use:{" "}
          <span className="text-ink font-medium">{effectiveTrack.label}</span>
          {!selectedMusicTrackId && (
            <span className="text-ink-muted"> — default for {STYLE_LABELS[selectedStyleId]}</span>
          )}
        </span>
        {selectedMusicTrackId && (
          <button
            type="button"
            onClick={() => setMusicTrack(null)}
            className="shrink-0 text-ink-muted hover:text-gold underline-offset-2 hover:underline"
          >
            Reset to default
          </button>
        )}
      </div>

      {/* Beat-sync explainer — markets the feature + tells the user the ♪
          value is the cut interval for their current render style. */}
      <div className="flex items-center gap-1.5 text-[10px] text-ink-muted -mt-1.5 leading-snug">
        <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor" className="shrink-0 text-gold/80" aria-hidden="true">
          <path d="M10 1L4 2.4v6.1a2 2 0 1 0 1 1.7V4.2l4-1v3.3a2 2 0 1 0 1 1.7V1z"/>
        </svg>
        <span>
          Cuts auto-sync to each track's beat — <span className="text-gold/80 font-mono">♪</span> is the cut interval for{" "}
          <span className="text-ink-soft font-medium">{STYLE_LABELS[selectedStyleId]}</span> style.
        </span>
      </div>

      {/* Style tab bar — one tab per style, auto-focused to the render style.
          A tab is dotted when it holds the in-use track. */}
      <div role="tablist" aria-label="Music style" className="flex gap-1.5">
        {STYLE_ORDER.map((style) => {
          const isActive = activeStyle === style;
          const isRenderStyle = selectedStyleId === style;
          const holdsInUse = inUseStyle === style;
          return (
            <button
              key={style}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveStyle(style)}
              className={cn(
                "relative flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-gold text-paper"
                  : "text-ink-muted hover:text-ink hover:bg-surface-input/60",
                !isActive && isRenderStyle && "ring-1 ring-inset ring-gold/40"
              )}
              title={isRenderStyle ? `${STYLE_LABELS[style]} — your render style` : STYLE_LABELS[style]}
            >
              {STYLE_LABELS[style]}
              <span className={cn("ml-1 text-[10px] tabular-nums", isActive ? "text-paper/70" : "opacity-60")}>
                {countByStyle[style] ?? 0}
              </span>
              {/* In-use dot — only on inactive tabs (the active tab shows the
                  row-level dot instead), so the marker never duplicates. */}
              {holdsInUse && !isActive && (
                <span
                  aria-hidden="true"
                  className="absolute top-1 right-1 inline-block h-1.5 w-1.5 rounded-full bg-gold"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Track list for the active style. */}
      <div
        role="tabpanel"
        className="rounded-lg border border-edge bg-surface-input/30 overflow-hidden"
      >
        <ul>
          {activeTracks.map((track) => {
            const isEffective = effectiveTrackId === track.id;
            const isPreviewing = previewingId === track.id;
            // Cut cadence this track will use under the current RENDER style
            // (selectedStyleId) — not the browsed tab — since that's what the
            // render actually uses if this track is picked.
            const sync = beatSyncFor(track, selectedStyleId);
            return (
              <li
                key={track.id}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 border-b border-edge/40 last:border-b-0 transition-colors cursor-pointer",
                  isEffective
                    ? "bg-gold/8 border-l-2 border-l-gold"
                    : "hover:bg-surface-input/60 border-l-2 border-l-transparent"
                )}
                onClick={() => handleSelect(track)}
              >
                {/* Play / pause — stops propagation so it doesn't also select. */}
                <button
                  type="button"
                  aria-label={isPreviewing ? "Pause preview" : "Preview track"}
                  onClick={(e) => { e.stopPropagation(); handlePreview(track); }}
                  className={cn(
                    "h-7 w-7 shrink-0 rounded-full flex items-center justify-center transition-colors",
                    isPreviewing
                      ? "bg-gold text-paper"
                      : "bg-surface-input border border-edge text-ink-soft hover:text-gold hover:border-gold"
                  )}
                >
                  {isPreviewing ? (
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor"><rect x="2" y="1" width="2" height="8"/><rect x="6" y="1" width="2" height="8"/></svg>
                  ) : (
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor"><polygon points="2,1 9,5 2,9"/></svg>
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm font-medium text-ink truncate leading-tight">
                      {track.label}
                    </span>
                    {track.isStyleDefault && (
                      <span className="shrink-0 rounded-sm bg-gold/15 px-1 py-px text-[9px] font-medium uppercase tracking-wide text-gold">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-ink-muted truncate leading-tight mt-0.5">
                    {track.vibe}
                  </div>
                </div>

                <div className="shrink-0 text-right leading-tight">
                  <div className="text-[10px] font-mono text-ink-muted tabular-nums">
                    {formatDuration(track.durationSec)}
                  </div>
                  {sync && (
                    <div
                      className="mt-0.5 text-[9px] font-mono text-gold/70 tabular-nums whitespace-nowrap"
                      title={`Beat-synced: cuts land on the ${sync.label} — about every ${sync.unitSec.toFixed(1)}s at ${sync.bpm} BPM for ${STYLE_LABELS[selectedStyleId]} style`}
                    >
                      ♪ {sync.unitSec.toFixed(1)}s
                    </div>
                  )}
                </div>

                {/* Single status dot — gold = in use, hidden otherwise. */}
                <div className="shrink-0 w-3 flex justify-center">
                  {isEffective && (
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full bg-gold"
                      aria-label="Currently in use"
                      title="Currently in use"
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Mini preview player — ONLY appears while previewing. */}
      {previewTrack && (
        <div className="rounded-lg border border-edge bg-surface-input/30 px-3 py-2 flex items-center gap-3">
          <audio
            ref={audioRef}
            src={previewUrlFor(previewTrack)}
            autoPlay
            onLoadedMetadata={() => {
              audioRef.current?.play().catch((err) => {
                console.error("[music-preview] play() rejected", err);
                setPreviewError("Couldn't play preview. Tap the play button again.");
                setPreviewingId(null);
              });
            }}
            onEnded={() => setPreviewingId(null)}
            onError={() => {
              const url = previewUrlFor(previewTrack);
              console.error("[music-preview] <audio> error for", url);
              setPreviewError(`Couldn't load ${url}.`);
              setPreviewingId(null);
            }}
            controls
            className="flex-1 h-8"
          />
          <button
            type="button"
            aria-label="Close preview"
            onClick={() => {
              audioRef.current?.pause();
              setPreviewingId(null);
            }}
            className="h-7 w-7 shrink-0 rounded-md text-ink-muted hover:text-ink hover:bg-surface-input flex items-center justify-center"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M1 1l8 8M9 1l-8 8" />
            </svg>
          </button>
        </div>
      )}

      {previewError && (
        <div className="text-[11px] text-red-300 px-1">{previewError}</div>
      )}
    </div>
  );
}
