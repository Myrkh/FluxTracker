// ═══════════════════════════════════════════════════════════════════════════
// OmniLink - useCableBooks Hook
// CRUD pour les 3 carnets de câbles
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { convertJBtoBN } from '../../constants/OmniLink/cableTypes';

export function useCableBooks() {
  const [unitRecords, setUnitRecords] = useState([]);
  const [localRecords, setLocalRecords] = useState([]);
  const [multiRecords, setMultiRecords] = useState([]);
  const [cableTypes, setCableTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  // ─────────────────────────────────────────────────────────
  // LOAD ALL DATA
  // ─────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [unitRes, localRes, multiRes, typesRes] = await Promise.all([
        supabase.from('cable_book_unit').select('*').order('tag'),
        supabase.from('cable_book_local').select('*').order('tag'),
        supabase.from('cable_book_multiconductor').select('*').order('jb_tag'),
        supabase.from('ref_cable_types').select('*').order('code')
      ]);

      setUnitRecords(unitRes.data || []);
      setLocalRecords(localRes.data || []);
      setMultiRecords(multiRes.data || []);
      setCableTypes(typesRes.data || []);
    } catch (err) {
      console.error('Error loading cable books:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ─────────────────────────────────────────────────────────
  // CARNET UNITÉ - CRUD
  // ─────────────────────────────────────────────────────────
  const addUnitRecord = async (data) => {
    const { error } = await supabase.from('cable_book_unit').insert([data]);
    if (error) throw error;
    await loadAll();
  };

  const updateUnitRecord = async (id, data) => {
    const { error } = await supabase.from('cable_book_unit').update(data).eq('id', id);
    if (error) throw error;
    await loadAll();
  };

  const deleteUnitRecord = async (id) => {
    const { error } = await supabase.from('cable_book_unit').delete().eq('id', id);
    if (error) throw error;
    await loadAll();
  };

  const bulkAddUnit = async (insRecords) => {
    const records = insRecords.map(ins => ({
      ins_record_id: ins.id,
      tag: ins.tag,
      cable_type: null, // À remplir par l'utilisateur
      jb_tag: ins.jb_tag,
      terminal: ins.jb_terminal || '', // Si disponible
      created_by: 'user'
    }));

    const { error } = await supabase.from('cable_book_unit').insert(records);
    if (error) throw error;
    await loadAll();
    return records.length;
  };

  // ─────────────────────────────────────────────────────────
  // CARNET LOCAL TECHNIQUE - CRUD
  // ─────────────────────────────────────────────────────────
  const addLocalRecord = async (data) => {
    const { error } = await supabase.from('cable_book_local').insert([data]);
    if (error) throw error;
    await loadAll();
  };

  const updateLocalRecord = async (id, data) => {
    const { error } = await supabase.from('cable_book_local').update(data).eq('id', id);
    if (error) throw error;
    await loadAll();
  };

  const deleteLocalRecord = async (id) => {
    const { error } = await supabase.from('cable_book_local').delete().eq('id', id);
    if (error) throw error;
    await loadAll();
  };

  const bulkAddLocal = async (insRecords) => {
    const records = insRecords.map(ins => ({
      ins_record_id: ins.id,
      tag: ins.tag,
      bn_tag: convertJBtoBN(ins.jb_tag), // Auto-conversion JB → BN
      terminal: ins.jb_terminal || '',
      cable_type: null, // À remplir
      affectation: ins.io_address,
      created_by: 'user'
    }));

    const { error } = await supabase.from('cable_book_local').insert(records);
    if (error) throw error;
    await loadAll();
    return records.length;
  };

  // ─────────────────────────────────────────────────────────
  // CARNET MULTICONDUCTEUR - CRUD
  // ─────────────────────────────────────────────────────────
  const addMultiRecord = async (data) => {
    const { error } = await supabase.from('cable_book_multiconductor').insert([data]);
    if (error) throw error;
    await loadAll();
  };

  const updateMultiRecord = async (id, data) => {
    const { error } = await supabase.from('cable_book_multiconductor').update(data).eq('id', id);
    if (error) throw error;
    await loadAll();
  };

  const deleteMultiRecord = async (id) => {
    const { error } = await supabase.from('cable_book_multiconductor').delete().eq('id', id);
    if (error) throw error;
    await loadAll();
  };

  return {
    // Data
    unitRecords,
    localRecords,
    multiRecords,
    cableTypes,
    loading,

    // Actions
    reload: loadAll,

    // Unité
    addUnitRecord,
    updateUnitRecord,
    deleteUnitRecord,
    bulkAddUnit,

    // Local
    addLocalRecord,
    updateLocalRecord,
    deleteLocalRecord,
    bulkAddLocal,

    // Multi
    addMultiRecord,
    updateMultiRecord,
    deleteMultiRecord,
  };
}
