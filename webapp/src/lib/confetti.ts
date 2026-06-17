// Lightweight, dependency-free confetti burst. ~50 DOM particles animated
// via the Web Animations API (GPU-composited transform/opacity), cleaned up
// after they fall. No library, no canvas loop left running. Used once for
// the finished-video reveal — the "you made something" reward moment.
//
// Respects prefers-reduced-motion (no-ops) per the v2.1 motion principles.

const COLORS = ["#C7A76C", "#DBBE7E", "#F4F2EC", "#9C773B", "#5BBE9B"];

export function fireConfetti(originX = 0.5, originY = 0.3): void {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const count = 56;
  const root = document.createElement("div");
  root.setAttribute("aria-hidden", "true");
  root.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:9998;overflow:hidden";
  document.body.appendChild(root);

  const cx = window.innerWidth * originX;
  const cy = window.innerHeight * originY;

  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    const size = 6 + Math.random() * 6;
    const color = COLORS[(Math.random() * COLORS.length) | 0];
    p.style.cssText =
      `position:absolute;left:${cx}px;top:${cy}px;width:${size}px;height:${size * 0.5}px;` +
      `background:${color};border-radius:1px;will-change:transform,opacity`;
    root.appendChild(p);

    const angle = Math.random() * Math.PI * 2;
    const velocity = 120 + Math.random() * 260;
    const dx = Math.cos(angle) * velocity;
    const dy = Math.sin(angle) * velocity - (160 + Math.random() * 120); // bias upward
    const rot = (Math.random() * 720 - 360) | 0;
    const dur = 900 + Math.random() * 800;

    p.animate(
      [
        { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
        { transform: `translate(${dx}px,${dy}px) rotate(${rot}deg)`, opacity: 1, offset: 0.7 },
        { transform: `translate(${dx * 1.1}px,${dy + 320}px) rotate(${rot}deg)`, opacity: 0 }
      ],
      { duration: dur, easing: "cubic-bezier(0.16,1,0.3,1)", fill: "forwards" }
    );
  }

  setTimeout(() => root.remove(), 1900);
}
