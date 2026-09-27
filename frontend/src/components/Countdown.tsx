function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (days > 0 || hours > 0) parts.push(`${hours}h`);
  if (days > 0 || hours > 0 || minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${rest}s`);

  return parts.join(" ");
}

export default function Countdown({
  now,
  target,
  className,
}: {
  now: number;
  target: number;
  className?: string;
}) {
  return (
    <span className={className}>
      {target === 0 ? "not started" : formatDuration(target - now)}
    </span>
  );
}
