"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnchorHTMLAttributes } from "react";

interface SmoothScrollLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
}

export function SmoothScrollLink({ href, className, children, ...props }: SmoothScrollLinkProps) {
  const pathname = usePathname();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    // Check if the link has a hash
    if (href.includes("#")) {
      const [path, hash] = href.split("#");
      
      // If the link is for the current page, or it's a purely hash link
      if ((path === "" || path === pathname) && hash) {
        const element = document.getElementById(hash);
        if (element) {
          e.preventDefault();
          element.scrollIntoView({ behavior: "smooth" });
          
          // Update URL hash without jumping
          window.history.pushState(null, "", `#${hash}`);
        }
      }
    }
  };

  return (
    <Link href={href} className={className} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
