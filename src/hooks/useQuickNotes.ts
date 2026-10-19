import { useState, useEffect, useCallback, useMemo } from 'react';
import { QuickNote, NoteColor } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { createScopedStorage } from '../lib/storage';

const INITIAL_QUICK_NOTES: QuickNote[] = [
  {
    id: 'welcome-scratchpad-note',
    title: '📝 Welcome to your Scratchpad',
    content: 'Capture your thoughts, ideas, and fleeting notes during focus sessions.\n\nTip: Press Ctrl+J (or Cmd+J) anytime to toggle this scratchpad.',
    color: 'sage',
    isPinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function useQuickNotes() {
  const { user, isDemo } = useAuth();

  const storage = useMemo(() => createScopedStorage<QuickNote[]>('quick_notes', user?.id, isDemo), [user?.id, isDemo]);
  const seedStorage = useMemo(() => createScopedStorage<string>('scratchpad_seeded', user?.id, isDemo), [user?.id, isDemo]);

  const [notes, setNotes] = useState<QuickNote[]>(() => {
    const fallback = isDemo ? INITIAL_QUICK_NOTES : [];
    return storage.get(fallback) || fallback;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Notes from LocalStorage or Supabase
  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Demo mode -> ephemeral scoped storage
    if (storage.isDemo || !isSupabaseConfigured || !user || user.id === 'demo-user-123') {
      const saved = storage.get(INITIAL_QUICK_NOTES) || INITIAL_QUICK_NOTES;
      setNotes(saved);
      storage.set(saved);
      setLoading(false);
      return;
    }

    try {
      const { data, error: dbError } = await supabase
        .from('quick_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });

      if (dbError) throw dbError;

      const mapped: QuickNote[] = (data || []).map((n) => ({
        id: n.id,
        title: n.title || undefined,
        content: n.content || '',
        color: (n.color as NoteColor) || 'slate',
        isPinned: n.is_pinned || false,
        archived: Boolean(n.archived),
        archivedAt: n.archived_at || undefined,
        createdAt: n.created_at || new Date().toISOString(),
        updatedAt: n.updated_at || new Date().toISOString(),
      }));

      // Merge with user-scoped local archive cache in case Supabase columns were un-migrated
      const localNotes = storage.get([]) || [];

      const merged = mapped.map((dbNote) => {
        const local = localNotes.find((l) => l.id === dbNote.id);
        if (local && local.archived) {
          return { ...dbNote, archived: true, archivedAt: local.archivedAt };
        }
        return dbNote;
      });

      const hasSeeded = seedStorage.get();
      if (merged.length > 0) {
        setNotes(merged);
        seedStorage.set('true');
        storage.set(merged);
      } else if (!hasSeeded) {
        // First time for this user: show single welcome note
        setNotes(INITIAL_QUICK_NOTES);
        seedStorage.set('true');
        storage.set(INITIAL_QUICK_NOTES);
      } else {
        // User deliberately deleted all notes
        setNotes([]);
        storage.set([]);
      }
    } catch (err: any) {
      console.error('Error fetching quick notes from Supabase:', err);
      setError(err.message || 'Failed to fetch notes.');
      const saved = storage.get([]);
      setNotes(saved || []);
    } finally {
      setLoading(false);
    }
  }, [user, storage, seedStorage]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Write-through cache with strict demo isolation
  useEffect(() => {
    storage.set(notes);
  }, [notes, storage]);

  // Add Note
  const addNote = async (newNoteData: {
    title?: string;
    content: string;
    color?: NoteColor;
    isPinned?: boolean;
  }) => {
    const tempId = `note-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const created: QuickNote = {
      id: tempId,
      title: newNoteData.title || undefined,
      content: newNoteData.content,
      color: newNoteData.color || 'slate',
      isPinned: newNoteData.isPinned || false,
      archived: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setNotes((prev) => [created, ...prev]);

    if (!isDemo && isSupabaseConfigured && user && user.id !== 'demo-user-123') {
      try {
        const { data, error } = await supabase
          .from('quick_notes')
          .insert({
            user_id: user.id,
            title: newNoteData.title || null,
            content: newNoteData.content,
            color: newNoteData.color || 'slate',
            is_pinned: newNoteData.isPinned || false,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setNotes((prev) =>
            prev.map((n) => (n.id === tempId ? { ...n, id: data.id } : n))
          );
        }
      } catch (err: any) {
        console.error('Error adding quick note to Supabase:', err);
      }
    }
    return created;
  };

  // Update Note
  const updateNote = async (id: string, updates: Partial<QuickNote>) => {
    const nowIso = new Date().toISOString();
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: nowIso } : n))
    );

    if (!isDemo && isSupabaseConfigured && user && user.id !== 'demo-user-123') {
      try {
        const dbPayload: Record<string, any> = { updated_at: nowIso };
        if (updates.title !== undefined) dbPayload.title = updates.title;
        if (updates.content !== undefined) dbPayload.content = updates.content;
        if (updates.color !== undefined) dbPayload.color = updates.color;
        if (updates.isPinned !== undefined) dbPayload.is_pinned = updates.isPinned;
        if (updates.archived !== undefined) {
          dbPayload.archived = updates.archived;
          dbPayload.archived_at = updates.archived ? (updates.archivedAt || nowIso) : null;
        }

        await supabase
          .from('quick_notes')
          .update(dbPayload)
          .eq('id', id)
          .eq('user_id', user.id);
      } catch (err: any) {
        console.error('Error updating quick note in Supabase:', err);
      }
    }
  };

  // Archive a note (soft delete -> moves to Archive)
  const archiveNote = async (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;

    const nowIso = new Date().toISOString();
    const updated = notes.map((n) => (n.id === id ? { ...n, archived: true, archivedAt: nowIso } : n));
    setNotes(updated);

    if (!isDemo && isSupabaseConfigured && user && user.id !== 'demo-user-123') {
      try {
        const res = await supabase
          .from('quick_notes')
          .update({ archived: true, archived_at: nowIso, updated_at: nowIso })
          .eq('id', id)
          .eq('user_id', user.id);

        if (res.error) {
          console.error('Could not archive note in Supabase:', res.error);
        }
      } catch (err: any) {
        console.error('Could not archive note in Supabase:', err);
      }
    }
  };

  // Unarchive / restore a note from Archive back to Scratchpad
  const unarchiveNote = async (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;

    const nowIso = new Date().toISOString();
    const updated = notes.map((n) => (n.id === id ? { ...n, archived: false, archivedAt: undefined } : n));
    setNotes(updated);

    if (!isDemo && isSupabaseConfigured && user && user.id !== 'demo-user-123') {
      try {
        await supabase
          .from('quick_notes')
          .update({ archived: false, archived_at: null, updated_at: nowIso })
          .eq('id', id)
          .eq('user_id', user.id);
      } catch (err: any) {
        console.warn('Could not unarchive note in Supabase:', err);
      }
    }
  };

  // Batch unarchive notes
  const batchUnarchiveNotes = async (ids: string[]) => {
    if (ids.length === 0) return;
    const nowIso = new Date().toISOString();
    const updated = notes.map((n) => (ids.includes(n.id) ? { ...n, archived: false, archivedAt: undefined } : n));
    setNotes(updated);

    if (!isDemo && isSupabaseConfigured && user && user.id !== 'demo-user-123') {
      try {
        await supabase
          .from('quick_notes')
          .update({ archived: false, archived_at: null, updated_at: nowIso })
          .in('id', ids)
          .eq('user_id', user.id);
      } catch (err: any) {
        console.warn('Error batch unarchiving notes in Supabase:', err);
      }
    }
  };

  // Permanent Delete Note
  const deleteNote = async (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);

    if (!isDemo && isSupabaseConfigured && user && user.id !== 'demo-user-123') {
      try {
        await supabase
          .from('quick_notes')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
      } catch (err: any) {
        console.error('Error deleting quick note from Supabase:', err);
      }
    }
  };

  // Batch Permanent Delete Notes
  const batchDeleteNotes = async (ids: string[]) => {
    if (ids.length === 0) return;
    setNotes((prev) => prev.filter((n) => !ids.includes(n.id)));

    if (!isDemo && isSupabaseConfigured && user && user.id !== 'demo-user-123') {
      try {
        await supabase
          .from('quick_notes')
          .delete()
          .in('id', ids)
          .eq('user_id', user.id);
      } catch (err: any) {
        console.error('Error batch deleting notes from Supabase:', err);
      }
    }
  };

  // Toggle Pin
  const togglePin = async (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;
    updateNote(id, { isPinned: !target.isPinned });
  };

  return {
    notes,
    loading,
    error,
    addNote,
    updateNote,
    deleteNote,
    archiveNote,
    unarchiveNote,
    batchUnarchiveNotes,
    batchDeleteNotes,
    togglePin,
    refreshNotes: fetchNotes,
  };
}
