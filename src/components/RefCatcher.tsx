"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Cookies from "js-cookie";

export function RefCatcher() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      // Save ref in a cookie for 30 days
      Cookies.set("partiuturismo_ref", ref, { expires: 30 });
    }
  }, [searchParams]);

  return null;
}
