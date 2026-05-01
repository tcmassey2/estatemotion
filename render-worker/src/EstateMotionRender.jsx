import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, Sequence, useCurrentFrame, useVideoConfig } from "remotion";

const fps = 30;

export function getRenderDimensions(format = "vertical") {
  if (format === "square") return { width: 1080, height: 1080 };
  if (format === "wide" || format === "mls") return { width: 1920, height: 1080 };
  return { width: 1080, height: 1920 };
}

export function getRenderDurationFrames(manifest = {}) {
  const stylePack = stylePackForManifest(manifest);
  const sceneFrames = scenesFromManifest(manifest).reduce((sum, scene) => sum + secondsToFrames(scene.duration || 3), 0);
  return Math.max(300, sceneFrames + secondsToFrames(stylePack.outroDuration));
}

export function EstateMotionRender({ manifest = {}, format = "vertical" }) {
  const scenes = scenesFromManifest(manifest);
  const project = normalizeProject(manifest.project || {});
  const brandKit = normalizeBrandKit(manifest.brandKit || {}, project);
  const template = manifest.template || {};
  const stylePack = stylePackForManifest(manifest);
  const music = manifest.music || manifest.creative?.musicTrack || {};
  const dimensions = getRenderDimensions(format);
  const endCardFrames = secondsToFrames(stylePack.outroDuration);
  let cursor = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: stylePack.background, fontFamily: "Inter, Arial, sans-serif" }}>
      {music.url ? <Audio src={music.url} volume={stylePack.musicVolume} /> : null}
      {scenes.map((scene, index) => {
        const duration = secondsToFrames(scene.duration || stylePack.defaultSceneDuration);
        const from = cursor;
        cursor += duration;
        return (
          <Sequence key={`${scene.photoId || index}-${from}`} from={from} durationInFrames={duration + stylePack.overlapFrames}>
            <RenderScene
              scene={scene}
              manifest={manifest}
              index={index}
              total={scenes.length}
              duration={duration}
              accentColor={template.accentColor || brandKit.accentColor || "#C7A76C"}
              dimensions={dimensions}
              stylePack={stylePack}
            />
          </Sequence>
        );
      })}
      <Sequence from={cursor} durationInFrames={endCardFrames}>
        <EndCard
          project={project}
          brandKit={brandKit}
          compliance={manifest.compliance || {}}
          accentColor={template.accentColor || brandKit.accentColor || "#C7A76C"}
          stylePack={stylePack}
        />
      </Sequence>
      {!music.url && stylePack.showMusicFallback ? <MusicFallbackBadge music={music} stylePack={stylePack} /> : null}
    </AbsoluteFill>
  );
}

function RenderScene({ scene, manifest, index, total, duration, accentColor, dimensions, stylePack }) {
  const frame = useCurrentFrame();
  const image = scene.durableUrl || scene.durable_url || scene.imageUrl || scene.uri || scene.photoUrl || "";
  const progress = interpolate(frame, [0, duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const entrance = interpolate(frame, [0, Math.min(18, duration * 0.18)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const exit = interpolate(frame, [Math.max(1, duration - 14), duration], [1, 0.94], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const transform = cameraTransform(scene.renderMotion || scene.motionStyle, progress, dimensions, scene.sceneType);
  const transitionStyle = transitionLayer(scene.transition, entrance, exit, accentColor, stylePack);
  const project = normalizeProject(manifest.project || {});
  const brandKit = normalizeBrandKit(manifest.brandKit || {}, project);
  const showHero = index === 0;
  const sqft = project.sqft || project.squareFeet;
  const facts = [project.price, project.beds ? `${project.beds} BD` : "", project.baths ? `${project.baths} BA` : "", sqft ? `${sqft} SQFT` : ""].filter(Boolean).join("  /  ");
  const titleY = interpolate(frame, [8, 28], [34, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleOpacity = interpolate(frame, [6, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lowerThirdY = interpolate(frame, [22, 42], [24, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lowerThirdOpacity = interpolate(frame, [18, 36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const priceScale = interpolate(frame, [26, 40], [0.96, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      {image ? (
        <Img
          src={image}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform,
            filter: stylePack.imageFilter
          }}
        />
      ) : (
        <AbsoluteFill style={{ background: "#1C1C1C" }} />
      )}
      <AbsoluteFill style={{ background: stylePack.gradient }} />
      <LightLeakOverlay progress={progress} stylePack={stylePack} />
      <BrandedFrame accentColor={accentColor} stylePack={stylePack} />
      {transitionStyle}
      <div style={{ position: "absolute", top: 54, left: 54, right: 54, color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ padding: "12px 18px", border: `1px solid ${accentColor}`, background: stylePack.badgeBackground, borderRadius: 999, fontSize: 22, fontWeight: 800, letterSpacing: 0, textTransform: "uppercase" }}>
          {stylePack.label}
        </span>
        <span style={{ fontSize: 20, opacity: .72 }}>{String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
      </div>
      {showHero ? (
        <AddressIntro
          project={project}
          text={scene.overlayText || manifest.copy?.hook || project.title}
          accentColor={accentColor}
          stylePack={stylePack}
          opacity={titleOpacity}
          translateY={titleY}
        />
      ) : (
        <SceneTitle
          scene={scene}
          accentColor={accentColor}
          opacity={titleOpacity}
          translateY={titleY}
          stylePack={stylePack}
        />
      )}
      <LowerThird
        facts={facts}
        price={project.price}
        scene={scene}
        accentColor={accentColor}
        opacity={lowerThirdOpacity}
        translateY={lowerThirdY}
        priceScale={priceScale}
        stylePack={stylePack}
      />
      {showHero ? (
        <NeighborhoodTitleCard project={project} accentColor={accentColor} stylePack={stylePack} progress={progress} />
      ) : null}
      {stylePack.showMapPin && index === 1 ? (
        <MapPinCard project={project} accentColor={accentColor} stylePack={stylePack} progress={progress} />
      ) : null}
      {stylePack.showContactCta && index === total - 1 ? (
        <ContactCtaCard brandKit={brandKit} project={project} accentColor={accentColor} stylePack={stylePack} progress={progress} />
      ) : null}
      <MarketingModeOverlay overlay={normalizeMarketingOverlay(scene.marketingOverlay, manifest.marketingOS, project, brandKit)} brandKit={brandKit} accentColor={accentColor} stylePack={stylePack} progress={progress} />
      <div style={{ position: "absolute", left: 64, right: 64, bottom: 112, color: "white" }}>
        {scene.featureCard && stylePack.showFeatureCards ? <FeatureCard text={scene.featureCard} accentColor={accentColor} /> : null}
      </div>
      <ComplianceFooter compliance={manifest.compliance || {}} />
    </AbsoluteFill>
  );
}

function normalizeProject(project = {}) {
  const city = project.city || "";
  const neighborhood = project.neighborhood || city || "Local area";
  return {
    ...project,
    title: project.title || project.address || "Featured listing",
    address: project.address || project.title || "Featured listing",
    city: city || neighborhood,
    neighborhood,
    price: project.price || "",
    beds: project.beds || "",
    baths: project.baths || "",
    squareFeet: project.squareFeet || project.sqft || "",
    cta: project.cta || project.conversionGoal || "Schedule a private tour",
    brokerage: project.brokerage || ""
  };
}

function normalizeBrandKit(brandKit = {}, project = {}) {
  return {
    ...brandKit,
    name: brandKit.name || project.agentName || "Your Local Agent",
    brokerage: brandKit.brokerage || project.brokerage || "Real Estate Advisor",
    phone: brandKit.phone || project.phone || "",
    website: brandKit.website || project.website || "",
    instagram: brandKit.instagram || project.instagram || "",
    ctaText: brandKit.ctaText || project.cta || "Schedule a private tour"
  };
}

function normalizeMarketingOverlay(overlay = {}, marketingOS = {}, project = {}, brandKit = {}) {
  if (overlay?.headline) {
    return {
      ...overlay,
      label: overlay.label || overlay.modeName || "EstateMotion",
      lines: Array.isArray(overlay.lines) ? overlay.lines.filter(Boolean) : [],
      disclaimer: overlay.disclaimer || safeModeDisclaimer(overlay.variant || marketingOS.contentMode)
    };
  }
  const mode = marketingOS.contentMode || "listing-reel";
  const metrics = marketingOS.investorEstimateSummary || marketingOS.investorMetrics || {};
  if (mode === "seller-lead-magnet") {
    return {
      label: "Seller Preview",
      headline: "See what your home could look like online",
      lines: ["Your photos", marketingOS.conversionGoal || "Seller consultation"],
      disclaimer: "Marketing preview only. No sale price or outcome is guaranteed.",
      variant: "seller"
    };
  }
  if (mode === "investor-breakdown" || mode === "wholesale-opportunity") {
    const wholesale = mode === "wholesale-opportunity";
    return {
      label: wholesale ? "Wholesale Opportunity" : "Investor Estimate",
      headline: wholesale ? "Assignment-style deal summary" : "Deal snapshot",
      lines: [
        `ARV est. ${formatFallbackMoney(metrics.arv)}`,
        `Rehab est. ${formatFallbackMoney(metrics.rehab || metrics.rehabEstimate)}`,
        wholesale ? `Assignment est. ${formatFallbackMoney(metrics.assignment || metrics.assignmentFee)}` : `Projected spread est. ${formatFallbackMoney(metrics.projectedSpread)}`
      ],
      disclaimer: wholesale ? "Wholesale/investor figures are estimates, not guarantees or financial advice." : "All figures are estimates and require independent verification.",
      variant: wholesale ? "wholesale" : "investor"
    };
  }
  if (mode === "neighborhood-spotlight") {
    return {
      label: "Neighborhood Spotlight",
      headline: `${project.neighborhood || project.city || "Local area"} lifestyle`,
      lines: [project.city || "Local market", "Local context", marketingOS.conversionGoal || "Ask me about this area"],
      disclaimer: "Lifestyle captions are based on listing location and uploaded photos.",
      variant: "neighborhood"
    };
  }
  if (mode === "agent-brand") {
    return {
      label: "Agent Authority",
      headline: `${brandKit.name || "Your agent"} can help you move next`,
      lines: [brandKit.brokerage, brandKit.phone, marketingOS.conversionGoal || brandKit.ctaText].filter(Boolean),
      disclaimer: "Agent contact CTA card.",
      variant: "agent"
    };
  }
  return null;
}

function formatFallbackMoney(value) {
  const numeric = Number(String(value || "").replace(/[$,\s%]/g, ""));
  if (!Number.isFinite(numeric) || numeric <= 0) return "Estimate needed";
  return `$${numeric.toLocaleString()}`;
}

function safeModeDisclaimer(mode = "") {
  if (String(mode).includes("investor") || String(mode).includes("wholesale")) return "All figures are estimates and require independent verification.";
  if (String(mode).includes("seller")) return "Marketing preview only. No sale price or outcome is guaranteed.";
  return "";
}

function NeighborhoodTitleCard({ project, accentColor, stylePack, progress }) {
  if (!stylePack.showPremiumGraphics) return null;
  const opacity = interpolate(progress, [0.08, 0.22, 0.78, 0.92], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 64, top: 150, padding: "18px 22px", borderRadius: 16, background: stylePack.graphicCardBackground, border: `1px solid ${accentColor}`, color: stylePack.graphicTextColor, opacity }}>
      <span style={{ color: accentColor, fontSize: 18, fontWeight: 950, textTransform: "uppercase" }}>Neighborhood</span>
      <strong style={{ display: "block", fontSize: 30, marginTop: 6 }}>{[project.neighborhood, project.city].filter(Boolean).join(" / ") || "Local area"}</strong>
    </div>
  );
}

function MapPinCard({ project, accentColor, stylePack, progress }) {
  if (!stylePack.showPremiumGraphics) return null;
  const opacity = interpolate(progress, [0.12, 0.28, 0.78, 0.9], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = interpolate(progress, [0.12, 0.28], [24, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", right: 64, top: 150, width: 330, padding: 24, borderRadius: 20, background: stylePack.graphicCardBackground, color: stylePack.graphicTextColor, opacity, transform: `translateY(${y}px)`, border: `1px solid ${accentColor}` }}>
      <div style={{ width: 42, height: 42, borderRadius: 999, background: accentColor, color: "#0D0D0D", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 950 }}>⌖</div>
      <strong style={{ display: "block", marginTop: 16, fontSize: 27 }}>{project.city || "Property area"}</strong>
      <span style={{ display: "block", marginTop: 8, fontSize: 20, opacity: .82 }}>{project.address || project.neighborhood || "Listing location"}</span>
    </div>
  );
}

function ContactCtaCard({ brandKit, project, accentColor, stylePack, progress }) {
  if (!stylePack.showContactCta) return null;
  const opacity = interpolate(progress, [0.35, 0.55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", right: 64, bottom: 86, padding: "18px 22px", borderRadius: 18, background: stylePack.graphicCardBackground, color: stylePack.graphicTextColor, border: `1px solid ${accentColor}`, opacity }}>
      <strong style={{ display: "block", fontSize: 26 }}>{project.cta || brandKit.ctaText || "Schedule a private tour"}</strong>
      <span style={{ display: "block", fontSize: 19, marginTop: 8 }}>{[brandKit.phone, brandKit.website, brandKit.instagram].filter(Boolean).join(" / ") || brandKit.name}</span>
    </div>
  );
}

function MarketingModeOverlay({ overlay, brandKit, accentColor, stylePack, progress }) {
  if (!overlay?.headline) return null;
  const opacity = interpolate(progress, [0.12, 0.28, 0.92, 1], [0, 1, 1, 0.9], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = interpolate(progress, [0.12, 0.28], [22, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const isAgent = overlay.variant === "agent";
  const borderColor = overlay.variant === "investor" || overlay.variant === "wholesale" ? "#D7E6B8" : accentColor;
  return (
    <div style={{ position: "absolute", left: 64, right: 64, top: isAgent ? 210 : 246, display: "flex", justifyContent: isAgent ? "flex-end" : "flex-start", opacity, transform: `translateY(${y}px)` }}>
      <div style={{ width: isAgent ? 430 : 560, padding: "22px 24px", borderRadius: 18, background: stylePack.graphicCardBackground || "rgba(13,13,13,.72)", color: stylePack.graphicTextColor || "#fff", border: `1px solid ${borderColor}`, boxShadow: "0 24px 70px rgba(0,0,0,.28)" }}>
        <p style={{ margin: "0 0 10px", color: borderColor, fontSize: 18, fontWeight: 950, textTransform: "uppercase", letterSpacing: 0 }}>{overlay.label}</p>
        <h3 style={{ margin: 0, fontSize: isAgent ? 34 : 38, lineHeight: 1, fontWeight: 950 }}>{overlay.headline}</h3>
        {overlay.lines?.length ? (
          <div style={{ display: "grid", gap: 7, marginTop: 16 }}>
            {overlay.lines.slice(0, 3).map((line) => <span key={line} style={{ fontSize: 22, fontWeight: 850 }}>{line}</span>)}
          </div>
        ) : null}
        {isAgent ? <p style={{ margin: "16px 0 0", fontSize: 20 }}>{[brandKit.name, brandKit.phone, brandKit.website].filter(Boolean).join("  /  ") || "Your local real estate advisor"}</p> : null}
        {overlay.disclaimer ? <p style={{ margin: "16px 0 0", fontSize: 15, opacity: .76 }}>{overlay.disclaimer}</p> : null}
      </div>
    </div>
  );
}

function LightLeakOverlay({ progress, stylePack }) {
  if (!stylePack.showLightLeak) return null;
  const x = interpolate(progress, [0, 1], [-24, 24]);
  const opacity = interpolate(progress, [0, .28, .72, 1], [0.05, 0.22, 0.16, 0.04]);
  return (
    <AbsoluteFill style={{ background: stylePack.lightLeakGradient, mixBlendMode: "screen", opacity, transform: `translateX(${x}px)` }} />
  );
}

function BrandedFrame({ accentColor, stylePack }) {
  if (!stylePack.showBrandedFrame) return null;
  return (
    <AbsoluteFill style={{ border: `14px solid ${stylePack.frameColor || accentColor}`, boxShadow: "inset 0 0 0 1px rgba(255,255,255,.18)" }} />
  );
}

function MusicFallbackBadge({ music, stylePack }) {
  return (
    <div style={{ position: "absolute", right: 28, top: 28, padding: "10px 14px", borderRadius: 999, background: "rgba(13,13,13,.54)", color: "rgba(255,255,255,.72)", fontSize: 14 }}>
      {music.fallback || "No music file configured"}
    </div>
  );
}

function AddressIntro({ project, text, accentColor, stylePack, opacity, translateY }) {
  return (
    <div style={{ position: "absolute", left: 64, right: 64, bottom: 265, color: "white", opacity, transform: `translateY(${translateY}px)` }}>
      <p style={{ color: accentColor, fontSize: 24, fontWeight: 900, margin: "0 0 16px", textTransform: "uppercase" }}>{project.city || "Featured Listing"}</p>
      <h1 style={{ fontSize: stylePack.heroSize, lineHeight: .94, margin: 0, maxWidth: 900, fontFamily: stylePack.headlineFont }}>{text}</h1>
      <p style={{ fontSize: 30, fontWeight: 800, opacity: .86, margin: "22px 0 0" }}>{project.address || project.title}</p>
    </div>
  );
}

function SceneTitle({ scene, accentColor, opacity, translateY, stylePack }) {
  return (
    <div style={{ position: "absolute", left: 64, right: 64, bottom: 250, color: "white", opacity, transform: `translateY(${translateY}px)` }}>
      <p style={{ color: accentColor, fontSize: 21, fontWeight: 900, margin: "0 0 14px", textTransform: "uppercase" }}>{scene.sceneType || "Property Detail"}</p>
      <h2 style={{ fontSize: stylePack.sceneTitleSize, lineHeight: .98, margin: 0, maxWidth: 860, fontFamily: stylePack.headlineFont }}>{scene.overlayText || scene.sceneType || "Property highlight"}</h2>
    </div>
  );
}

function LowerThird({ facts, price, scene, accentColor, opacity, translateY, priceScale, stylePack }) {
  return (
    <div style={{ position: "absolute", left: 64, right: 64, bottom: 175, display: "flex", alignItems: "center", gap: 16, opacity, transform: `translateY(${translateY}px)`, color: "white" }}>
      {price ? (
        <div style={{ transform: `scale(${priceScale})`, transformOrigin: "left center", padding: "15px 20px", borderRadius: 12, background: stylePack.priceBackground, border: `1px solid ${accentColor}`, color: stylePack.priceColor, fontSize: 26, fontWeight: 950 }}>
          {price}
        </div>
      ) : null}
      {facts ? (
        <div style={{ padding: "15px 20px", borderRadius: 12, background: "rgba(13,13,13,.58)", backdropFilter: "blur(10px)", fontSize: 24, fontWeight: 850 }}>
          {facts}
        </div>
      ) : null}
      <div style={{ padding: "15px 18px", borderRadius: 12, background: "rgba(255,255,255,.12)", fontSize: 21, fontWeight: 800 }}>
        {scene.beatMarker || "Beat timed"}
      </div>
    </div>
  );
}

function FeatureCard({ text, accentColor }) {
  return (
    <div style={{ display: "inline-block", marginTop: 24, padding: "18px 22px", background: "rgba(248,245,239,.94)", color: "#0D0D0D", borderLeft: `7px solid ${accentColor}`, borderRadius: 10, fontSize: 24, fontWeight: 900 }}>
      {text}
    </div>
  );
}

function EndCard({ project, brandKit, compliance, accentColor, stylePack }) {
  const cta = project.cta || brandKit.ctaText || "Schedule a private tour";
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = interpolate(frame, [0, 24], [36, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", backgroundColor: stylePack.endCardBackground, color: stylePack.endCardColor }}>
      <div style={{ width: 820, maxWidth: "82%", borderTop: `10px solid ${accentColor}`, background: stylePack.endCardPanel, color: stylePack.endCardPanelText, borderRadius: 18, padding: 58, boxShadow: "0 34px 90px rgba(13,13,13,.18)", opacity, transform: `translateY(${y}px)` }}>
        <p style={{ color: accentColor, fontWeight: 900, textTransform: "uppercase", fontSize: 24, margin: "0 0 18px" }}>{cta}</p>
        <h2 style={{ fontSize: 68, lineHeight: .95, margin: "0 0 18px" }}>{brandKit.name || "Your Local Agent"}</h2>
        <p style={{ fontSize: 31, color: stylePack.endCardMuted, margin: 0 }}>{brandKit.brokerage || project.brokerage || ""}</p>
        <p style={{ fontSize: 28, margin: "28px 0 0" }}>{[brandKit.phone, brandKit.website, brandKit.instagram].filter(Boolean).join("  /  ")}</p>
      </div>
      <ComplianceFooter compliance={compliance} dark={stylePack.endCardBackground !== "#0D0D0D"} />
    </AbsoluteFill>
  );
}

function ComplianceFooter({ compliance, dark = false }) {
  const copy = [compliance.listingCourtesyOf, compliance.brokerageDisclaimer, compliance.equalHousing ? "Equal Housing Opportunity" : "", compliance.mlsDisclaimer].filter(Boolean).join("  |  ");
  if (!copy) return null;
  return (
    <div style={{ position: "absolute", left: 34, right: 34, bottom: 24, color: dark ? "#444" : "rgba(255,255,255,.68)", fontSize: 16, textAlign: "center" }}>
      {copy}
    </div>
  );
}

function cameraTransform(style = "Push-in", progress, dimensions, sceneType = "") {
  const wide = dimensions.width > dimensions.height;
  const pan = wide ? 24 : 42;
  if (style === "Exterior slow zoom" || sceneType === "Exterior hero") {
    const scale = interpolate(progress, [0, 1], [1.015, 1.105]);
    const y = interpolate(progress, [0, 1], [10, -10]);
    return `scale(${scale}) translate3d(0, ${y}px, 0)`;
  }
  if (style === "Kitchen lateral pan" || sceneType === "Kitchen") {
    const x = interpolate(progress, [0, 1], [-48, 48]);
    return `scale(1.085) translate3d(${x}px, 0, 0)`;
  }
  if (style === "Living depth zoom" || sceneType === "Living room") {
    const scale = interpolate(progress, [0, 1], [1.025, 1.13]);
    const x = interpolate(progress, [0, 1], [-12, 12]);
    return `scale(${scale}) translate3d(${x}px, 0, 0)`;
  }
  if (style === "Bedroom gentle fade" || sceneType === "Primary bedroom" || sceneType === "Bedroom") {
    const scale = interpolate(progress, [0, 1], [1.055, 1.02]);
    return `scale(${scale}) translate3d(0, 0, 0)`;
  }
  if (style === "Bathroom clean slide" || sceneType === "Bathroom") {
    const x = interpolate(progress, [0, 1], [28, -18]);
    return `scale(1.06) translate3d(${x}px, 0, 0)`;
  }
  if (style === "Pull-out") {
    const scale = interpolate(progress, [0, 1], [1.1, 1.02]);
    return `scale(${scale}) translate3d(0, 0, 0)`;
  }
  if (style === "Slow pan") {
    const x = interpolate(progress, [0, 1], [-pan, pan]);
    return `scale(1.06) translate3d(${x}px, 0, 0)`;
  }
  if (style === "Orbit simulation") {
    const x = interpolate(progress, [0, 1], [-28, 28]);
    const rotate = interpolate(progress, [0, 1], [-.22, .22]);
    return `scale(1.08) translate3d(${x}px, 0, 0) rotate(${rotate}deg)`;
  }
  if (style === "Vertical social framing") {
    const y = interpolate(progress, [0, 1], [20, -20]);
    return `scale(1.07) translate3d(0, ${y}px, 0)`;
  }
  if (style === "Depth zoom") {
    const scale = interpolate(progress, [0, 1], [1.02, 1.12]);
    const x = interpolate(progress, [0, 1], [0, -18]);
    return `scale(${scale}) translate3d(${x}px, 0, 0)`;
  }
  const scale = interpolate(progress, [0, 1], [1.01, 1.09]);
  return `scale(${scale}) translate3d(0, 0, 0)`;
}

function transitionLayer(transition = "", entrance, exit, accentColor, stylePack) {
  const opacity = 1 - entrance;
  if (transition.includes("slide")) {
    const x = interpolate(entrance, [0, 1], [0, 100]);
    return <AbsoluteFill style={{ background: stylePack.transitionColor, opacity, transform: `translateX(${x}%)` }} />;
  }
  if (transition.includes("wipe")) {
    const x = interpolate(entrance, [0, 1], [0, -100]);
    return <AbsoluteFill style={{ background: `linear-gradient(90deg, ${accentColor}, ${stylePack.transitionColor})`, opacity: opacity * .88, transform: `translateX(${x}%)` }} />;
  }
  return <AbsoluteFill style={{ background: stylePack.transitionColor, opacity: opacity * .72 }} />;
}

function stylePackForManifest(manifest = {}) {
  const id = String(manifest.stylePack || manifest.template?.id || "").toLowerCase();
  if (id.includes("viral") || id.includes("fast")) return stylePacks.viral;
  if (id.includes("mls") || id.includes("clean")) return stylePacks.mlsClean;
  if (id.includes("investor")) return stylePacks.investor;
  if (id.includes("neighborhood")) return stylePacks.neighborhood;
  if (id.includes("personalbrand") || id.includes("personal-brand") || id.includes("agent")) return stylePacks.personalBrand;
  return stylePacks.luxury;
}

const stylePacks = {
  luxury: {
    label: "EstateMotion Luxury",
    background: "#0D0D0D",
    transitionColor: "#0D0D0D",
    gradient: "linear-gradient(180deg, rgba(0,0,0,.12), rgba(0,0,0,.04) 38%, rgba(0,0,0,.84))",
    badgeBackground: "rgba(13,13,13,.56)",
    imageFilter: "contrast(1.04) saturate(1.02)",
    priceBackground: "rgba(248,245,239,.94)",
    priceColor: "#0D0D0D",
    endCardBackground: "#F8F5EF",
    endCardPanel: "white",
    endCardColor: "#0D0D0D",
    endCardPanelText: "#0D0D0D",
    endCardMuted: "#454545",
    headlineFont: "Georgia, 'Times New Roman', serif",
    heroSize: 78,
    sceneTitleSize: 58,
    defaultSceneDuration: 2.45,
    outroDuration: 3.5,
    overlapFrames: 10,
    showFeatureCards: true
    ,
    showPremiumGraphics: true,
    showLightLeak: true,
    showBrandedFrame: true,
    showMapPin: true,
    showContactCta: true,
    showMusicFallback: true,
    musicVolume: 0.42,
    graphicCardBackground: "rgba(13,13,13,.58)",
    graphicTextColor: "#FFFFFF",
    lightLeakGradient: "radial-gradient(circle at 18% 28%, rgba(199,167,108,.38), transparent 34%), radial-gradient(circle at 82% 12%, rgba(255,255,255,.16), transparent 30%)"
  },
  viral: {
    label: "EstateMotion Viral",
    background: "#070707",
    transitionColor: "#070707",
    gradient: "linear-gradient(180deg, rgba(0,0,0,.18), rgba(0,0,0,.08) 34%, rgba(0,0,0,.88))",
    badgeBackground: "rgba(13,13,13,.72)",
    imageFilter: "contrast(1.09) saturate(1.08)",
    priceBackground: "rgba(199,167,108,.96)",
    priceColor: "#0D0D0D",
    endCardBackground: "#0D0D0D",
    endCardPanel: "#F8F5EF",
    endCardColor: "#F8F5EF",
    endCardPanelText: "#0D0D0D",
    endCardMuted: "#57524b",
    headlineFont: "Inter, Arial, sans-serif",
    heroSize: 74,
    sceneTitleSize: 62,
    defaultSceneDuration: 1.35,
    outroDuration: 2.7,
    overlapFrames: 6,
    showFeatureCards: false,
    showPremiumGraphics: true,
    showLightLeak: true,
    showBrandedFrame: true,
    showMapPin: true,
    showContactCta: true,
    showMusicFallback: true,
    musicVolume: 0.5,
    graphicCardBackground: "rgba(13,13,13,.68)",
    graphicTextColor: "#FFFFFF",
    lightLeakGradient: "radial-gradient(circle at 20% 20%, rgba(227,187,115,.28), transparent 30%)"
  },
  mlsClean: {
    label: "MLS Clean",
    background: "#F8F5EF",
    transitionColor: "#F8F5EF",
    gradient: "linear-gradient(180deg, rgba(0,0,0,.04), rgba(0,0,0,.02) 44%, rgba(0,0,0,.62))",
    badgeBackground: "rgba(248,245,239,.84)",
    imageFilter: "contrast(1.0) saturate(0.98)",
    priceBackground: "rgba(248,245,239,.96)",
    priceColor: "#0D0D0D",
    endCardBackground: "#F8F5EF",
    endCardPanel: "white",
    endCardColor: "#0D0D0D",
    endCardPanelText: "#0D0D0D",
    endCardMuted: "#555",
    headlineFont: "Inter, Arial, sans-serif",
    heroSize: 60,
    sceneTitleSize: 46,
    defaultSceneDuration: 2.4,
    outroDuration: 3.2,
    overlapFrames: 4,
    showFeatureCards: false,
    showPremiumGraphics: false,
    showLightLeak: false,
    showBrandedFrame: false,
    showMapPin: false,
    showContactCta: false,
    showMusicFallback: false,
    musicVolume: 0.18,
    graphicCardBackground: "rgba(248,245,239,.92)",
    graphicTextColor: "#0D0D0D",
    lightLeakGradient: "transparent"
  },
  investor: {
    label: "Investor Reel",
    background: "#11150F",
    transitionColor: "#11150F",
    gradient: "linear-gradient(180deg, rgba(0,0,0,.16), rgba(0,0,0,.05) 40%, rgba(0,0,0,.82))",
    badgeBackground: "rgba(17,21,15,.68)",
    imageFilter: "contrast(1.06) saturate(0.98)",
    priceBackground: "rgba(228,232,215,.94)",
    priceColor: "#11150F",
    endCardBackground: "#11150F",
    endCardPanel: "#F8F5EF",
    endCardColor: "#F8F5EF",
    endCardPanelText: "#11150F",
    endCardMuted: "#4d5548",
    headlineFont: "Inter, Arial, sans-serif",
    heroSize: 66,
    sceneTitleSize: 50,
    defaultSceneDuration: 1.85,
    outroDuration: 3,
    overlapFrames: 5,
    showFeatureCards: true,
    showPremiumGraphics: true,
    showLightLeak: true,
    showBrandedFrame: true,
    showMapPin: true,
    showContactCta: true,
    showMusicFallback: true,
    musicVolume: 0.44,
    graphicCardBackground: "rgba(17,21,15,.7)",
    graphicTextColor: "#FFFFFF",
    lightLeakGradient: "radial-gradient(circle at 85% 20%, rgba(199,167,108,.24), transparent 32%)"
  },
  neighborhood: {
    label: "Neighborhood Authority",
    background: "#0E1719",
    transitionColor: "#0E1719",
    gradient: "linear-gradient(180deg, rgba(0,0,0,.12), rgba(0,0,0,.04) 40%, rgba(0,0,0,.8))",
    badgeBackground: "rgba(14,23,25,.72)",
    imageFilter: "contrast(1.04) saturate(1.04)",
    priceBackground: "rgba(248,245,239,.94)",
    priceColor: "#0E1719",
    endCardBackground: "#0E1719",
    endCardPanel: "#F8F5EF",
    endCardColor: "#F8F5EF",
    endCardPanelText: "#0E1719",
    endCardMuted: "#46575b",
    headlineFont: "Inter, Arial, sans-serif",
    heroSize: 68,
    sceneTitleSize: 52,
    defaultSceneDuration: 2,
    outroDuration: 3,
    overlapFrames: 7,
    showFeatureCards: true,
    showPremiumGraphics: true,
    showLightLeak: true,
    showBrandedFrame: true,
    showMapPin: true,
    showContactCta: true,
    showMusicFallback: true,
    musicVolume: 0.36,
    graphicCardBackground: "rgba(14,23,25,.72)",
    graphicTextColor: "#FFFFFF",
    lightLeakGradient: "radial-gradient(circle at 22% 18%, rgba(62,110,120,.34), transparent 34%)"
  },
  personalBrand: {
    label: "Agent Authority",
    background: "#0D0D0D",
    transitionColor: "#0D0D0D",
    gradient: "linear-gradient(180deg, rgba(0,0,0,.14), rgba(0,0,0,.05) 42%, rgba(0,0,0,.86))",
    badgeBackground: "rgba(13,13,13,.72)",
    imageFilter: "contrast(1.05) saturate(1.03)",
    priceBackground: "rgba(199,167,108,.96)",
    priceColor: "#0D0D0D",
    endCardBackground: "#0D0D0D",
    endCardPanel: "#F8F5EF",
    endCardColor: "#F8F5EF",
    endCardPanelText: "#0D0D0D",
    endCardMuted: "#4d4942",
    headlineFont: "Inter, Arial, sans-serif",
    heroSize: 70,
    sceneTitleSize: 54,
    defaultSceneDuration: 2,
    outroDuration: 3.4,
    overlapFrames: 8,
    showFeatureCards: true,
    showPremiumGraphics: true,
    showLightLeak: true,
    showBrandedFrame: true,
    showMapPin: true,
    showContactCta: true,
    showMusicFallback: true,
    musicVolume: 0.4,
    graphicCardBackground: "rgba(13,13,13,.68)",
    graphicTextColor: "#FFFFFF",
    lightLeakGradient: "radial-gradient(circle at 75% 18%, rgba(199,167,108,.30), transparent 32%)"
  }
};

function scenesFromManifest(manifest = {}) {
  const photos = manifest.orderedPhotos || [];
  return (manifest.scenes || []).map((scene, index) => ({
    ...scene,
    imageUrl: photos[index]?.durableUrl || photos[index]?.durable_url || photos[index]?.publicUrl || photos[index]?.public_url || photos[index]?.imageUrl || photos[index]?.uri || scene.durableUrl || scene.durable_url || scene.publicUrl || scene.public_url || scene.imageUrl || scene.uri || "",
    duration: Number(scene.duration || 3)
  }));
}

function secondsToFrames(seconds) {
  return Math.max(45, Math.round(Number(seconds || 3) * fps));
}
