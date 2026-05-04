"use client";

import { useState, useRef, useEffect } from "react";
import { useNotifications, type NotificationType } from "@/hooks/useNotifications";
import Link from "next/link";

const NOTIFICATION_CONFIG: Record<
  NotificationType,
  { icon: string; color: string; bgColor: string; href?: (entityId: string | null) => string }
> = {
  NEW_RESERVATION: {
    icon: "M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z",
    color: "text-primary",
    bgColor: "bg-primary-container/40",
    href: () => "/admin/reservas?status=PENDING_PIX",
  },
  RESERVATION_APPROVED: {
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "text-success",
    bgColor: "bg-success-light/50",
    href: () => "/admin/reservas?status=APPROVED",
  },
  RESERVATION_EXPIRED: {
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "text-warning",
    bgColor: "bg-warning-light/50",
    href: () => "/admin/reservas?status=EXPIRED",
  },
  RESERVATION_CANCELLED: {
    icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "text-error",
    bgColor: "bg-error-light/50",
    href: () => "/admin/reservas",
  },
  RESERVATION_REFUNDED: {
    icon: "M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6",
    color: "text-secondary",
    bgColor: "bg-secondary-container/40",
    href: () => "/admin/reservas",
  },
  NEW_CLIENT: {
    icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
    color: "text-primary",
    bgColor: "bg-primary-container/30",
    href: () => "/admin/clientes",
  },
  EXCURSION_SOLD_OUT: {
    icon: "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z",
    color: "text-cta",
    bgColor: "bg-cta-container/40",
    href: () => "/admin/excursoes",
  },
  WAITLIST_SPOT_OPENED: {
    icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
    color: "text-success",
    bgColor: "bg-success-light/50",
    href: () => "/admin/excursoes",
  },
  SYSTEM_ALERT: {
    icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "text-on-surface",
    bgColor: "bg-surface-container-high/50",
  },
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "agora mesmo";
  if (diffMinutes < 60) return `${diffMinutes}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function NotificationCenter() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } =
    useNotifications(30);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [animateBadge, setAnimateBadge] = useState(false);

  const prevUnread = useRef(unreadCount);

  // Animate badge on new unread
  if (prevUnread.current !== unreadCount) {
    if (unreadCount > prevUnread.current) {
      setAnimateBadge(true);
      setTimeout(() => setAnimateBadge(false), 600);
    }
    prevUnread.current = unreadCount;
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-surface-container-high transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ""}`}
      >
        <svg
          className={`w-6 h-6 text-on-surface-variant transition-colors ${isOpen ? "text-primary" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>

        {/* Badge */}
        {unreadCount > 0 && (
          <span
            className={`absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-error rounded-full shadow-sm transition-transform ${
              animateBadge ? "scale-125" : "scale-100"
            }`}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-[380px] max-h-[480px] bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/30 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          role="dialog"
          aria-label="Centro de Notificações"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline-variant/20 bg-surface-container-low/50">
            <h3 className="font-bold text-on-surface text-sm">Notificações</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-xs font-medium text-primary hover:text-primary-dark transition-colors"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[380px] divide-y divide-outline-variant/10">
            {isLoading ? (
              <div className="px-5 py-10 text-center">
                <div className="w-6 h-6 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-outline mt-2">Carregando...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <svg className="w-10 h-10 mx-auto text-outline-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                <p className="text-sm font-medium text-on-surface-variant mt-3">Nenhuma notificação</p>
                <p className="text-xs text-outline mt-1">Quando houver atividade, ela aparecerá aqui</p>
              </div>
            ) : (
              notifications.map((n) => {
                const config = NOTIFICATION_CONFIG[n.type] || NOTIFICATION_CONFIG.SYSTEM_ALERT;
                const href = config.href?.(n.entity_id) || "#";

                return (
                  <Link
                    key={n.id}
                    href={href}
                    onClick={() => handleNotificationClick(n.id)}
                    className={`flex items-start gap-3 px-5 py-3.5 hover:bg-surface-container-low/50 transition-colors cursor-pointer ${
                      !n.is_read ? "bg-primary-container/5" : ""
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`shrink-0 w-9 h-9 rounded-lg ${config.bgColor} flex items-center justify-center mt-0.5`}
                    >
                      <svg
                        className={`w-4.5 h-4.5 ${config.color}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
                      </svg>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm leading-tight ${
                            !n.is_read
                              ? "font-bold text-on-surface"
                              : "font-medium text-on-surface-variant"
                          }`}
                        >
                          {n.title}
                        </p>
                        {!n.is_read && (
                          <span className="shrink-0 w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-outline mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-5 py-2.5 border-t border-outline-variant/20 bg-surface-container-low/30 text-center">
              <p className="text-[10px] text-outline">
                {unreadCount > 0
                  ? `${unreadCount} não lida(s) · ${notifications.length} total`
                  : `${notifications.length} notificações`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
