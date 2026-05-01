import React from "react";
import { AbsoluteFill, Img, interpolate, Sequence, useCurrentFrame, useVideoConfig } from "remotion";

const fps = 30;

export function getRenderDimensions(format = "vertical") {
  if (format === "square") return { width: 1080, height: 1080 };
  if (format === "wide" || format === "mls") return { width: 1920, height: 1080 };
  return { width: 1080, height: 1920 };
}

export function getRenderDurationFrames(manifest = {}) {
  const sceneFrames = scenesFromManifest(manifest).reduce((sum, scene) => sum + secondsToFrames(scene.duration || 3), 0);
  return Math.max(300, sceneFrames + secondsToFrames(3.5));
}

export function EstateMotionRender({ manifest = {}, format = "vertical" }) {
  const scenes = scenesFromManifest(manifest);
  const brandKit = manifest.brandKit || {};
  const template = manifest.template || {};
  const project = manifest.project || {};
  const dimensions = getRenderDimensions(format);
  const endCardFrames = secondsToFrames(3.5);
  let cursor = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0D0D0D", fontFamily: "Inter, Arial, sans-serif" }}>
      {scenes.map((scene, index) => {
        const duration = secondsToFrames(scene.duration || 3);
        const from = cursor;
        cursor += duration;
        return (
          <Sequence key={`${scene.photoId || index}-${from}`} from={from} durationInFrames={duration + 8}>
            <RenderScene
              scene={scene}
              manifest={manifest}
              index={index}
              total={scenes.length}
              duration={duration}
              accentColor={template.accentColor || brandKit.accentColor || "#C7A76C"}
              dimensions={dimensions}
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
        />
      </Sequence>
    </AbsoluteFill>
  );
}

function RenderScene({ scene, manifest, index, total, duration, accentColor, dimensions }) {
  const frame = useCurrentFrame();
  const image = scene.durableUrl || scene.durable_url || scene.imageUrl || scene.uri || scene.photoUrl || "";
  const progress = interpolate(frame, [0, duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const transform = cameraTransform(scene.motionStyle, progress, dimensions);
  const project = manifest.project || {};
  const showHero = index === 0;
  const sqft = project.sqft || project.squareFeet;
  const facts = [project.price, project.beds ? `${project.beds} BD` : "", project.baths ? `${project.baths} BA` : "", sqft ? `${sqft} SQFT` : ""].filter(Boolean).join("  /  ");

  return (
    <AbsoluteFill>
      {image ? (
        <Img
          src={image}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform,
            filter: "contrast(1.02) saturate(1.02)"
          }}
        />
      ) : (
        <AbsoluteFill style={{ background: "#1C1C1C" }} />
      )}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,.16), rgba(0,0,0,.06) 40%, rgba(0,0,0,.82))" }} />
      <div style={{ position: "absolute", top: 54, left: 54, right: 54, color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ padding: "12px 18px", border: `1px solid ${accentColor}`, background: "rgba(13,13,13,.56)", borderRadius: 999, fontSize: 22, fontWeight: 800, textTransform: "uppercase" }}>
          EstateMotion
        </span>
        <span style={{ fontSize: 20, opacity: .72 }}>{String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
      </div>
      <div style={{ position: "absolute", left: 64, right: 64, bottom: showHero ? 210 : 170, color: "white" }}>
        <p style={{ color: accentColor, fontSize: 24, fontWeight: 900, margin: "0 0 18px", textTransform: "uppercase" }}>{scene.sceneType || "Featured Property"}</p>
        <h1 style={{ fontSize: showHero ? 78 : 58, lineHeight: .94, margin: 0, maxWidth: 880 }}>{scene.overlayText || manifest.copy?.hook || project.title}</h1>
        <p style={{ fontSize: 28, fontWeight: 800, opacity: .88 }}>{facts}</p>
        {scene.featureCard ? <FeatureCard text={scene.featureCard} accentColor={accentColor} /> : null}
      </div>
      <ComplianceFooter compliance={manifest.compliance || {}} />
    </AbsoluteFill>
  );
}

function FeatureCard({ text, accentColor }) {
  return (
    <div style={{ display: "inline-block", marginTop: 24, padding: "18px 22px", background: "rgba(248,245,239,.94)", color: "#0D0D0D", borderLeft: `7px solid ${accentColor}`, borderRadius: 10, fontSize: 24, fontWeight: 900 }}>
      {text}
    </div>
  );
}

function EndCard({ project, brandKit, compliance, accentColor }) {
  const cta = project.cta || brandKit.ctaText || "Schedule a private tour";
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", backgroundColor: "#F8F5EF", color: "#0D0D0D" }}>
      <div style={{ width: 820, maxWidth: "82%", borderTop: `10px solid ${accentColor}`, background: "white", borderRadius: 18, padding: 58, boxShadow: "0 34px 90px rgba(13,13,13,.18)" }}>
        <p style={{ color: accentColor, fontWeight: 900, textTransform: "uppercase", fontSize: 24, margin: "0 0 18px" }}>{cta}</p>
        <h2 style={{ fontSize: 68, lineHeight: .95, margin: "0 0 18px" }}>{brandKit.name || "Your Local Agent"}</h2>
        <p style={{ fontSize: 31, color: "#454545", margin: 0 }}>{brandKit.brokerage || project.brokerage || ""}</p>
        <p style={{ fontSize: 28, margin: "28px 0 0" }}>{[brandKit.phone, brandKit.website, brandKit.instagram].filter(Boolean).join("  /  ")}</p>
      </div>
      <ComplianceFooter compliance={compliance} dark />
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

function cameraTransform(style = "Push-in", progress, dimensions) {
  const wide = dimensions.width > dimensions.height;
  const pan = wide ? 24 : 42;
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
