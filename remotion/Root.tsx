import React from "react";
import { Composition } from "remotion";
import { ProductDemo, FPS, DURATION_IN_FRAMES } from "./ProductDemo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ProductDemo"
      component={ProductDemo}
      durationInFrames={DURATION_IN_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
