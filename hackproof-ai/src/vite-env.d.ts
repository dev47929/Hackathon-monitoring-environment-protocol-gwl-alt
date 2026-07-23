/// <reference types="vite/client" />

declare module '@/components/BorderGlow' {
  import type { FC, ReactNode } from 'react';
  interface BorderGlowProps {
    children?: ReactNode;
    className?: string;
    edgeSensitivity?: number;
    glowColor?: string;
    backgroundColor?: string;
    borderRadius?: number;
    glowRadius?: number;
    glowIntensity?: number;
    coneSpread?: number;
    animated?: boolean;
    colors?: string[];
    fillOpacity?: number;
  }
  const BorderGlow: FC<BorderGlowProps>;
  export default BorderGlow;
}

declare module '@/components/RotatingText' {
  import type { FC } from 'react';
  interface RotatingTextProps {
    texts: string[];
    mainClassName?: string;
    staggerFrom?: string;
    initial?: Record<string, unknown>;
    animate?: Record<string, unknown>;
    exit?: Record<string, unknown>;
    staggerDuration?: number;
    splitLevelClassName?: string;
    elementLevelClassName?: string;
    transition?: Record<string, unknown>;
    rotationInterval?: number;
    splitBy?: string;
    auto?: boolean;
    loop?: boolean;
    onNext?: (index: number) => void;
  }
  const RotatingText: FC<RotatingTextProps>;
  export default RotatingText;
}

declare module '@/components/DotField' {
  import type { FC } from 'react';
  interface DotFieldProps {
    dotRadius?: number;
    dotSpacing?: number;
    cursorRadius?: number;
    cursorForce?: number;
    bulgeOnly?: boolean;
    bulgeStrength?: number;
    glowRadius?: number;
    sparkle?: boolean;
    waveAmplitude?: number;
    gradientFrom?: string;
    gradientTo?: string;
    glowColor?: string;
  }
  const DotField: FC<DotFieldProps>;
  export default DotField;
}

declare module '@/components/ScrollVelocity' {
  import type { FC } from 'react';
  interface ScrollVelocityProps {
    texts: string[];
    velocity?: number;
    className?: string;
    damping?: number;
    stiffness?: number;
    numCopies?: number;
    scrollContainerRef?: React.RefObject<HTMLElement>;
    velocityMapping?: { input: number[]; output: number[] };
    parallaxClassName?: string;
    scrollerClassName?: string;
    parallaxStyle?: React.CSSProperties;
    scrollerStyle?: React.CSSProperties;
  }
  const ScrollVelocity: FC<ScrollVelocityProps>;
  export default ScrollVelocity;
}

declare module '@/components/Grainient' {
  import type { FC } from 'react';
  interface GrainientProps {
    color1?: string;
    color2?: string;
    color3?: string;
    timeSpeed?: number;
    colorBalance?: number;
    warpStrength?: number;
    warpFrequency?: number;
    warpSpeed?: number;
    warpAmplitude?: number;
    blendAngle?: number;
    blendSoftness?: number;
    rotationAmount?: number;
    noiseScale?: number;
    grainAmount?: number;
    grainScale?: number;
    grainAnimated?: boolean;
    contrast?: number;
    gamma?: number;
    saturation?: number;
    centerX?: number;
    centerY?: number;
    zoom?: number;
    className?: string;
  }
  const Grainient: FC<GrainientProps>;
  export default Grainient;
}

declare module '@/components/LineSidebar' {
  import type { FC } from 'react';
  interface LineSidebarProps {
    items?: string[];
    accentColor?: string;
    textColor?: string;
    markerColor?: string;
    showIndex?: boolean;
    showMarker?: boolean;
    proximityRadius?: number;
    maxShift?: number;
    falloff?: 'linear' | 'smooth' | 'sharp';
    markerLength?: number;
    markerGap?: number;
    tickScale?: number;
    scaleTick?: boolean;
    itemGap?: number;
    fontSize?: number;
    smoothing?: number;
    defaultActive?: number | null;
    onItemClick?: (index: number, label: string) => void;
    className?: string;
  }
  const LineSidebar: FC<LineSidebarProps>;
  export default LineSidebar;
}



