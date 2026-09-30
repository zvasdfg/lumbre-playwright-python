/* eslint-disable @next/next/no-img-element -- Static hosting has no Next image server. */
import type { ImgHTMLAttributes } from "react";

type ImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
};

// Plain browser images: no image optimization endpoint or server is required.
export default function Image({ fill, priority, unoptimized, style, alt = "", ...props }: ImageProps) {
  void unoptimized;
  return <img {...props} alt={alt} loading={priority ? "eager" : "lazy"}
    fetchPriority={priority ? "high" : "auto"}
    style={fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", ...style } : style} />;
}
