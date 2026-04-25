"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function PeriodFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPeriod = searchParams.get("period") || "este_mes";

  const filters = [
    { label: "Hoje", value: "hoje" },
    { label: "Últimos 7 dias", value: "7_dias" },
    { label: "Este Mês", value: "este_mes" },
    { label: "Últimos 30 dias", value: "30_dias" },
    { label: "Este Ano", value: "este_ano" },
  ];

  const handleSelect = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", value);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 hide-scrollbar">
      {filters.map((filter) => {
        const isActive = currentPeriod === filter.value;
        return (
          <button
            key={filter.value}
            onClick={() => handleSelect(filter.value)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              isActive
                ? "bg-secondary-container text-on-secondary-container shadow-sm border border-secondary-container/50"
                : "bg-surface-container text-on-surface hover:bg-surface-container-high border border-outline-variant/30"
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
