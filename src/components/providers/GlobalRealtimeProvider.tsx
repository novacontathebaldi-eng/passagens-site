'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export function GlobalRealtimeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase.channel('global-realtime-changes');

    const handlePayload = (payload: any) => {
      console.log('Realtime change received:', payload.table);
      router.refresh(); // Refetches active Server Components in the background
    };

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'global_settings' }, handlePayload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tour_packages' }, handlePayload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tour_package_images' }, handlePayload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'excursions' }, handlePayload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicle_layouts' }, handlePayload)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Global Realtime Subscribed!');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return <>{children}</>;
}
