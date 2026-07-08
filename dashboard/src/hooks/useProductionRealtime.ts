import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useProductionRealtime(
  uuids: string[],
  onPostChange: (post: any) => void,
  onMediaChange: () => void
) {
  useEffect(() => {
    if (uuids.length === 0) return;

    const channel = supabase.channel('production_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, (payload) => {
        const newRow = payload.new as any;
        if (newRow && uuids.includes(newRow.id_post)) {
          onPostChange(newRow);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'videos' }, (payload) => {
        const newRow = payload.new as any;
        if (newRow && uuids.includes(newRow.id_post)) onMediaChange();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'imagens' }, (payload) => {
        const newRow = payload.new as any;
        if (newRow && uuids.includes(newRow.id_post)) onMediaChange();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audios' }, (payload) => {
        const newRow = payload.new as any;
        if (newRow && uuids.includes(newRow.id_post)) onMediaChange();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [uuids.join(',')]);
}
