import React from "react";
import Link from "next/link";
import { SocialLinkEntry } from "@/lib/get-settings";
import {
  FaInstagram,
  FaFacebook,
  FaWhatsapp,
  FaYoutube,
  FaTiktok,
  FaLinkedin,
  FaXTwitter,
  FaTelegram,
  FaGlobe,
} from "react-icons/fa6";

const iconMap: Record<string, React.ElementType> = {
  instagram: FaInstagram,
  facebook: FaFacebook,
  whatsapp: FaWhatsapp,
  youtube: FaYoutube,
  tiktok: FaTiktok,
  linkedin: FaLinkedin,
  twitter: FaXTwitter,
  telegram: FaTelegram,
  other: FaGlobe,
};

type SocialLinksProps = {
  links: SocialLinkEntry[] | null;
  className?: string;
  iconClassName?: string;
};

export function SocialLinks({ 
  links, 
  className = "flex flex-wrap gap-4 items-center", 
  iconClassName = "w-5 h-5 text-on-surface-variant hover:text-primary transition-colors" 
}: SocialLinksProps) {
  if (!links || links.length === 0) return null;

  const activeLinks = links.filter((link) => link.isActive);

  if (activeLinks.length === 0) return null;

  return (
    <div className={className}>
      {activeLinks.map((link) => {
        const Icon = iconMap[link.platform] || FaGlobe;
        return (
          <Link
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            title={link.name || link.platform}
            className="flex items-center justify-center p-2 -m-2 rounded-full transition-transform hover:scale-110 active:scale-95"
          >
            <Icon className={iconClassName} />
            <span className="sr-only">{link.name || link.platform}</span>
          </Link>
        );
      })}
    </div>
  );
}
