import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export function useReferenceData() {
  const [refData, setRefData] = useState({
    functions: [], subFunctions: [], locations: [], loopTypes: [],
    systems: [], signals: [], alims: [], isolators: [],
    lightnings: [], ioCardTypes: [], netTypes: [],
    raw: {}
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const tables = [
        'ref_function', 'ref_sub_function', 'ref_loc', 'ref_loop_type',
        'ref_system', 'ref_sig', 'ref_alim', 'ref_isolator',
        'ref_lightning', 'ref_io_card_type', 'ref_net_type'
      ];
      const results = await Promise.all(
        tables.map(t => supabase.from(t).select('*').order('code'))
      );

      const [functions, subFunctions, locations, loopTypes, systems,
        signals, alims, isolators, lightnings, ioCardTypes, netTypes] =
        results.map(r => r.data || []);

      const fmt = (arr) => arr.map(item => ({
        value: item.code,
        label: `${item.code} — ${item.description_fr || ''}`,
        ...item
      }));

      setRefData({
        functions: fmt(functions),
        subFunctions: subFunctions,
        locations: fmt(locations),
        loopTypes: fmt(loopTypes),
        systems: fmt(systems),
        signals: fmt(signals),
        alims: fmt(alims),
        isolators: fmt(isolators),
        lightnings: fmt(lightnings),
        ioCardTypes: fmt(ioCardTypes),
        netTypes: fmt(netTypes),
        raw: { functions, subFunctions, locations, loopTypes, systems, signals, alims, isolators, lightnings, ioCardTypes, netTypes }
      });
    } catch (err) {
      console.error('Error loading reference data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { refData, loading, reload: load };
}
