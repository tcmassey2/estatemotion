import React from "react";
import { Composition } from "remotion";
import { EstateMotionReel } from "./reel";

export function RemotionRoot() {
  return (
    <Composition
      id="EstateMotionReel"
      component={EstateMotionReel}
      durationInFrames={900}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        project: {},
        brandKit: {},
        template: {},
        contentType: "full-property-reel"
      }}
    />
  );
}
