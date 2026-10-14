// Audio effects disabled by user request to keep app clean and professional

export function playClickSound() {
  // Silent / disabled
}

export function playSuccessSound() {
  // Silent / disabled
}

export function triggerHaptic(duration = 40) {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(duration);
    } catch {}
  }
}
