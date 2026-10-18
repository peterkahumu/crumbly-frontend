export function getInitials(name) {
  const words = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

const PALETTE = ["#c1502e", "#d68a1f", "#a33f22", "#6b4038", "#82311b", "#b06e15"];

export function colorFromString(str) {
  let hash = 0;
  for (let i = 0; i < String(str).length; i++) {
    hash = String(str).charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
