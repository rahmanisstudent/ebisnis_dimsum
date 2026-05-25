/**
 * Visual spicy level indicator using chili pepper emojis.
 * spicy_level 0 = no spice, 5 = very spicy.
 */
export default function SpicyIndicator({ level }: { level: number }) {
  if (level === 0) {
    return (
      <span className="text-xs text-text-muted font-medium">Tidak Pedas</span>
    );
  }

  const clampedLevel = Math.min(Math.max(level, 0), 5);

  return (
    <div className="flex items-center gap-0.5" title={`Tingkat pedas: ${clampedLevel}/5`}>
      {Array.from({ length: clampedLevel }).map((_, i) => (
        <span key={i} className="text-sm leading-none">🌶️</span>
      ))}
    </div>
  );
}
