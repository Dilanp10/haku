"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";

type Props = ComponentProps<typeof Link>;

/**
 * Link que envuelve la navegación en la View Transitions API cuando está
 * disponible (spec 031, O5). Progressive enhancement: sin soporte o con
 * prefers-reduced-motion, se comporta exactamente como <Link>.
 */
export function TransitionLink({ href, onClick, ...rest }: Props) {
  const router = useRouter();

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented) return;

    // Dejar pasar aperturas en pestaña nueva / descargas / modificadores.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

    const supportsVT =
      typeof document !== "undefined" && "startViewTransition" in document;
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!supportsVT || reducedMotion) return; // <Link> navega normal

    e.preventDefault();
    const url = typeof href === "string" ? href : (href.pathname ?? "/");
    (
      document as Document & {
        startViewTransition: (cb: () => void) => void;
      }
    ).startViewTransition(() => {
      router.push(url);
    });
  }

  return <Link href={href} onClick={handleClick} {...rest} />;
}
