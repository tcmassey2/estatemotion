import React from "react";
import { AbsoluteFill, Img, interpolate, Sequence, useCurrentFrame } from "remotion";

type ReelProps = {
  project: any;
  brandKit: any;
  template: any;
  contentType: string;
};

export function EstateMotionReel({ project, brandKit, template }: ReelProps) {
  const photos = [...(project.photos ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const scenes = photos.length ? photos : [{ uri: "" }];
  const sceneFrames = 120;
  return (
    <AbsoluteFill style={{ backgroundColor: "#101113", fontFamily: "Arial, sans-serif" }}>
      {scenes.map((photo, index) => (
        <Sequence key={photo.id ?? index} from={index * sceneFrames} durationInFrames={sceneFrames + 18}>
          <Scene
            photo={photo}
            hook={index === 0 ? project.hookText : photo.category}
            facts={`${project.price ?? ""} - ${project.beds ?? ""} BD - ${project.baths ?? ""} BA`}
            accentColor={template.accentColor ?? "#C7A76C"}
          />
        </Sequence>
      ))}
      <Sequence from={Math.max(0, scenes.length * sceneFrames - 60)} durationInFrames={120}>
        <EndCard brandKit={brandKit} accentColor={template.accentColor ?? "#C7A76C"} />
      </Sequence>
    </AbsoluteFill>
  );
}

function Scene({ photo, hook, facts, accentColor }: { photo: any; hook: string; facts: string; accentColor: string }) {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 120], [1, 1.08], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      {photo.uri && <Img src={photo.uri} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale})` }} />}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,.05), rgba(0,0,0,.78))" }} />
      <div style={{ position: "absolute", left: 70, right: 70, bottom: 230, color: "white" }}>
        <div style={{ display: "inline-block", background: "white", color: "#101113", borderRadius: 999, padding: "14px 20px", fontWeight: 900, marginBottom: 28 }}>EstateMotion</div>
        <h1 style={{ fontSize: 82, lineHeight: 0.96, margin: 0 }}>{hook}</h1>
        <p style={{ fontSize: 30, color: "rgba(255,255,255,.82)", fontWeight: 800 }}>{facts}</p>
        <div style={{ width: 140, height: 8, background: accentColor, borderRadius: 999 }} />
      </div>
    </AbsoluteFill>
  );
}

function EndCard({ brandKit, accentColor }: { brandKit: any; accentColor: string }) {
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", backgroundColor: "#F8F6F1", color: "#101113" }}>
      <div style={{ width: 820, borderLeft: `14px solid ${accentColor}`, background: "white", borderRadius: 24, padding: 60 }}>
        <p style={{ color: accentColor, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0 }}>Book a private tour</p>
        <h2 style={{ fontSize: 72, margin: "10px 0" }}>{brandKit.name}</h2>
        <p style={{ fontSize: 34, color: "#6C717A" }}>{brandKit.brokerage}</p>
        <p style={{ fontSize: 30 }}>{brandKit.website} - {brandKit.phone}</p>
      </div>
    </AbsoluteFill>
  );
}
