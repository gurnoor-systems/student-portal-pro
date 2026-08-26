import confetti from "canvas-confetti";

/**
 * Trigger vibrant dopamine milestone celebration confetti
 */
export function fireMilestoneConfetti(intensity: "standard" | "high" | "streak" = "standard") {
  if (typeof window === "undefined") return;

  try {
    if (intensity === "streak") {
      // Multi-angle blast for major streaks / exam completions
      const count = 200;
      const defaults = { origin: { y: 0.7 } };

      const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      };

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
      return;
    }

    if (intensity === "high") {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#1c69d4", "#60a5fa", "#3b82f6", "#10b981", "#f59e0b", "#ec4899"]
      });
      return;
    }

    // Standard task check-off celebration
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.7 },
      colors: ["#1c69d4", "#60a5fa", "#10b981"]
    });
  } catch {
    // Gracefully ignore if canvas context unavailable
  }
}
