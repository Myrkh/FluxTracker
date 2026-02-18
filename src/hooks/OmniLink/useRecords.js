import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export function useRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ins_records')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRecords(data || []);
      computeStats(data || []);
    } catch (err) {
      console.error('Error loading records:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const computeStats = (data) => {
    if (!data.length) { setStats(null); return; }
    const byLoopType = {};
    const bySystem = {};
    const byFunction = {};
    const byLoc = {};
    const bySig = {};
    let missingIO = 0;
    let missingJB = 0;

    data.forEach(r => {
      byLoopType[r.loop_type || 'N/A'] = (byLoopType[r.loop_type || 'N/A'] || 0) + 1;
      bySystem[r.system || 'N/A'] = (bySystem[r.system || 'N/A'] || 0) + 1;
      byFunction[r.function || 'N/A'] = (byFunction[r.function || 'N/A'] || 0) + 1;
      byLoc[r.loc || 'N/A'] = (byLoc[r.loc || 'N/A'] || 0) + 1;
      bySig[r.sig || 'N/A'] = (bySig[r.sig || 'N/A'] || 0) + 1;
      if (!r.io_address) missingIO++;
      if (!r.jb_tag) missingJB++;
    });

    const toChartData = (obj) => Object.entries(obj)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    setStats({
      total: data.length,
      byLoopType: toChartData(byLoopType),
      bySystem: toChartData(bySystem),
      byFunction: toChartData(byFunction).slice(0, 15),
      byLoc: toChartData(byLoc),
      bySig: toChartData(bySig).slice(0, 12),
      missingIO, missingJB,
      completeness: Math.round(((data.length - missingIO) / data.length) * 100),
    });
  };

  const insert = async (formData) => {
    const { data, error } = await supabase.from('ins_records').insert([formData]).select();
    if (error) throw error;
    await load();
    return data;
  };

  const update = async (id, formData) => {
    const { data, error } = await supabase.from('ins_records').update(formData).eq('id', id).select();
    if (error) throw error;
    await load();
    return data;
  };

  const remove = async (id) => {
    const { error } = await supabase.from('ins_records').delete().eq('id', id);
    if (error) throw error;
    await load();
  };

  const bulkInsert = async (dataArray, onProgress) => {
    let inserted = 0;
    let skipped = 0;
    let errors = [];
    
    for (let i = 0; i < dataArray.length; i++) {
      try {
        const { data, error } = await supabase.from('ins_records').insert([dataArray[i]]).select();
        if (error) {
          if (error.code === '23505') {
            skipped++;
          } else {
            errors.push({ row: i + 1, error: error.message, data: dataArray[i] });
          }
        } else {
          inserted++;
        }
        if (onProgress) onProgress(i + 1, dataArray.length, inserted, skipped, errors.length);
      } catch (err) {
        errors.push({ row: i + 1, error: err.message, data: dataArray[i] });
      }
    }
    
    await load();
    return { inserted, skipped, errors };
  };

  useEffect(() => { load(); }, [load]);
  return { records, loading, stats, reload: load, insert, update, remove, bulkInsert };
}
