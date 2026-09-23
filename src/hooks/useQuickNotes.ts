import { useState, useEffect, useCallback } from 'react';
import { QuickNote, NoteColor } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const INITIAL_QUICK_NOTES: QuickNote[] = [
  {
    id: 'note-sample-1',
    title: '🌱 Deep Work Sprint Idea',
    content: 'Explore combining visual velocity charts with daily time-blocking presets.\n• Research pomodoro intervals\n• Test acoustic ambient soundscapes',
    color: 'sage',
    isPinned: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'note-sample-2',
    title: '⚡ Quick Checklist',
    content: '- [ ] Review daily focus matrix\n- [ ] Hydrate after 50-minute sprint\n- [ ] Check off habit rings',
    color: 'terracotta',
    isPinned: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'note-sample-3',
    title: '💡 Reflection & Reference',
    content: 'Remember: Consistent 80% effort over 30 days beats a 100% burst that leads to burnout.',
    color: 'ochre',
    isPinned: false,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    updatedAt: new Date(Date.now() - 14400000).toISOString(),
  },
];

export function useQuickNotes() {
  const { user, isDemo } = useAuth();
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Notes from LocalStorage or Supabase
  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Demo or offline mode -> LocalStorage
    if (isDemo || !isSupabaseConfigured || !user || user.id === 'demo-user-123') {
      const saved = localStorage.getItem('taktic_quick_notes');
      setNotes(saved ? JSON.parse(saved) : INITIAL_QUICK_NOTES);
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
        createdAt: n.created_at || new Date().toISOString(),
        updatedAt: n.updated_at || new Date().toISOString(),
      }));

      setNotes(mapped.length > 0 ? mapped : INITIAL_QUICK_NOTES);
    } catch (err: any) {
      console.error('Error fetching quick notes from Supabase:', err);
      setError(err.message || 'Failed to fetch notes.');
      const saved = localStorage.getItem('taktic_quick_notes');
      setNotes(saved ? JSON.parse(saved) : INITIAL_QUICK_NOTES);
    } finally {
      setLoading(false);
    }
  }, [user, isDemo]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Write-through cache to LocalStorage
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem('taktic_quick_notes', JSON.stringify(notes));
    }
  }, [notes]);

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

  // Delete Note
  const deleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));

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
    togglePin,
    refreshNotes: fetchNotes,
  };
}
