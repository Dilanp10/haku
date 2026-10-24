"use client";

import Image from "next/image";
import { useState } from "react";

interface Props {
  src: string | null | undefined;
  alt: string;
  /** Nombre del que sale la inicial cuando no hay foto. */
  name: string;
  sizes: string;
  priority?: boolean;
  /** Fondo del placeholder (wash de categoría o terra). */
  fallbackBg: string;
  /** Color de la inicial. */
  fallbackFg: string;
  /** Clase Tailwind con el tamaño de la inicial según el contenedor. */
  fallbackTextClassName: string;
  viewTransitionName?: string;
}

export function CoverImage({
  src,
  alt,
  name,
  sizes,
  priority,
  fallbackBg,
  fallbackFg,
  fallbackTextClassName,
  viewTransitionName,
}: Props) {
  const [failed, setFailed] = useState(false);
  const transition = viewTransitionName
    ? ({ viewTransitionName } as React.CSSProperties)
    : {};

  if (!src || failed) {
    return (
      <div
        className={`flex h-full w-full select-none items-center justify-center leading-none ${fallbackTextClassName}`}
        style={{
          background: fallbackBg,
          color: fallbackFg,
          fontFamily: "var(--font-serif), Georgia, serif",
          ...transition,
        }}
        aria-hidden
      >
        {initial(name)}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className="object-cover"
      style={transition}
      onError={() => setFailed(true)}
      {...(priority ? { priority: true } : {})}
    />
  );
}

function initial(name: string): string {
  const char = name.trim().charAt(0);
  return char ? char.toUpperCase() : "·";
}
