import { Wifi, Wind, ShowerHead, Plug, Tv, BedDouble, Armchair, type LucideIcon } from "lucide-react";

// Complete amenity config mapping DB keys to icons and labels
const AMENITY_CONFIG: Record<string, { label: string; icon: LucideIcon }> = {
  wifi:            { label: "Wi-Fi",               icon: Wifi },
  ac:              { label: "Ar Condicionado",     icon: Wind },
  bathroom:        { label: "Banheiro",            icon: ShowerHead },
  usb:             { label: "Tomadas USB",         icon: Plug },
  tv:              { label: "TV",                  icon: Tv },
  blanket:         { label: "Cobertor",            icon: BedDouble },
  reclining_seats: { label: "Reclinação",          icon: Armchair },
};

export type AmenityKey = keyof typeof AMENITY_CONFIG;

interface AmenityBadgesProps {
  amenities: Record<string, boolean> | null | undefined;
  variant?: "pills" | "icons";
  size?: "sm" | "md";
  className?: string;
}

export default function AmenityBadges({ amenities, variant = "pills", size = "md", className = "" }: AmenityBadgesProps) {
  if (!amenities) return null;

  const activeAmenities = Object.entries(AMENITY_CONFIG).filter(
    ([key]) => amenities[key] === true
  );

  if (activeAmenities.length === 0) return null;

  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  if (variant === "icons") {
    return (
      <div className={`flex flex-wrap gap-1.5 ${className}`}>
        {activeAmenities.map(([key, { label, icon: Icon }]) => (
          <span
            key={key}
            title={label}
            className={`${size === "sm" ? "w-6 h-6" : "w-7 h-7"} rounded-lg bg-surface-container-high flex items-center justify-center transition-colors hover:bg-surface-container`}
          >
            <Icon className={`${iconSize} text-on-surface-variant`} />
          </span>
        ))}
      </div>
    );
  }

  // variant === "pills"
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {activeAmenities.map(([key, { label, icon: Icon }]) => (
        <span
          key={key}
          className={`inline-flex items-center gap-1.5 ${size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"} rounded-full bg-primary/10 text-primary font-medium`}
        >
          <Icon className={iconSize} />
          {label}
        </span>
      ))}
    </div>
  );
}

// Export the config for reuse in admin forms
export { AMENITY_CONFIG };
