import React from "react";
import { Composition, getInputProps, registerRoot } from "remotion";
import { EstateMotionRender, getRenderDimensions, getRenderDurationFrames } from "./EstateMotionRender.jsx";

const inputProps = getInputProps();
const dimensions = getRenderDimensions(inputProps.format);
const durationInFrames = getRenderDurationFrames(inputProps.manifest);

export const RemotionRoot = () => {
  return (
    <Composition
      id="EstateMotionRender"
      component={EstateMotionRender}
      fps={30}
      durationInFrames={durationInFrames}
      width={dimensions.width}
      height={dimensions.height}
      defaultProps={{
        manifest: inputProps.manifest || {},
        format: inputProps.format || "vertical"
      }}
    />
  );
};

registerRoot(RemotionRoot);
