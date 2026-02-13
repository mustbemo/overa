import Image from "next/image";
import {
  getInitialColor,
  getTeamFlagEmoji,
  getTeamInitials,
} from "@/lib/team-flags";
import { cn } from "@/lib/classnames";

type TeamMarkProps = {
  name: string;
  shortName: string;
  flagUrl: string | null;
  compact?: boolean;
};

export function TeamMark({
  name,
  shortName,
  flagUrl,
  compact = false,
}: TeamMarkProps) {
  const flagEmoji = getTeamFlagEmoji(name, shortName);
  const initials = getTeamInitials(shortName || name);
  const color = getInitialColor(shortName || name);

  const sizeClasses = compact ? "h-5 w-7 text-xs" : "h-6 w-9 text-sm";

  if (flagEmoji) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-sm",
          sizeClasses,
        )}
      >
        {flagEmoji}
      </span>
    );
  }

  if (flagUrl) {
    const imageSize = compact
      ? { width: 28, height: 20 }
      : { width: 36, height: 24 };

    return (
      <Image
        src={flagUrl}
        alt={name}
        width={imageSize.width}
        height={imageSize.height}
        unoptimized
        className={cn("shrink-0 rounded-sm object-cover", sizeClasses)}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-sm text-[10px] font-bold text-white",
        sizeClasses,
      )}
      style={{ backgroundColor: color }}
    >
      {initials}
    </span>
  );
}
