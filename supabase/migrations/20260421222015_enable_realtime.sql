BEGIN;

-- Ativar Replica Identity para garantir replicação de eventos adequadamente
ALTER TABLE public.global_settings REPLICA IDENTITY DEFAULT;
ALTER TABLE public.tour_packages REPLICA IDENTITY DEFAULT;
ALTER TABLE public.excursions REPLICA IDENTITY DEFAULT;
ALTER TABLE public.reservations REPLICA IDENTITY FULL;
ALTER TABLE public.passenger_tickets REPLICA IDENTITY FULL;

-- Adicionar as tabelas à publicação padrão do Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE 
  public.global_settings,
  public.tour_packages,
  public.excursions,
  public.reservations,
  public.passenger_tickets;

COMMIT;
