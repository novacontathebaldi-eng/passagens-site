import Image from "next/image";

type LogoProps = {
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const SIZES = {
  sm: { icon: 20, text: "text-lg" },
  md: { icon: 28, text: "text-xl" },
  lg: { icon: 36, text: "text-2xl" },
  xl: { icon: 48, text: "text-4xl" },
};

function LogoIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Stylized V mark for ViajaEdu */}
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path
        d="M8 10L16 24L24 10"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 10L16 18L20 10"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
    </svg>
  );
}

export function Logo({ logoUrl, size = "md", className = "" }: LogoProps) {
  const s = SIZES[size];

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt="ViajaEdu!"
          width={s.icon}
          height={s.icon}
          className="object-contain"
          unoptimized
        />
      ) : (
        <LogoIcon size={s.icon} />
      )}
      <span
        className={`${s.text} font-extrabold font-[family-name:var(--font-display)] text-primary`}
      >
        ViajaEdu!
      </span>
    </span>
  );
}

export function LogoWhite({ logoUrl, size = "md", className = "" }: LogoProps) {
  const s = SIZES[size];

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt="ViajaEdu!"
          width={s.icon}
          height={s.icon}
          className="object-contain brightness-0 invert"
          unoptimized
        />
      ) : (
        <svg
          width={s.icon}
          height={s.icon}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect width="32" height="32" rx="8" fill="white" fillOpacity="0.2" />
          <path
            d="M8 10L16 24L24 10"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 10L16 18L20 10"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.5"
          />
        </svg>
      )}
      <span
        className={`${s.text} font-extrabold font-[family-name:var(--font-display)] text-white`}
      >
        ViajaEdu!
      </span>
    </span>
  );
}
