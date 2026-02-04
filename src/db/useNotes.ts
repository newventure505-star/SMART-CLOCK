import { useCallback, useEffect, useMemo, useState } from "react";
import { deleteNote, fetchNotes, initDb, saveNote } from "./notesDb";
import { DrawingData, Note } from "../types/notes";

const createEmptyNote = (): Note => ({
  id: `${Date.now()}`,
  title: "",
  content: "",
  drawing: { strokes: [] },
  updatedAt: Date.now(),
});

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const activeNote = useMemo(
    () => notes.find((note) => note.id === activeNoteId) ?? null,
    [notes, activeNoteId]
  );

  const refreshNotes = useCallback(async () => {
    const items = await fetchNotes();
    setNotes(items);
    if (!activeNoteId && items.length > 0) {
      setActiveNoteId(items[0].id);
    }
  }, [activeNoteId]);

  useEffect(() => {
    const start = async () => {
      await initDb();
      await refreshNotes();
      setLoading(false);
    };
    start();
  }, [refreshNotes]);

  const createNote = useCallback(async () => {
    const note = createEmptyNote();
    await saveNote(note);
    setNotes((prev) => [note, ...prev]);
    setActiveNoteId(note.id);
  }, []);

  const updateNote = useCallback(
    async (id: string, updates: Partial<Omit<Note, "id">>) => {
      setNotes((prev) =>
        prev.map((note) => {
          if (note.id !== id) {
            return note;
          }
          const updated: Note = {
            ...note,
            ...updates,
            drawing: updates.drawing ?? note.drawing,
            updatedAt: Date.now(),
          };
          return updated;
        })
      );
    },
    []
  );

  const persistNote = useCallback(
    async (note: Note) => {
      await saveNote(note);
    },
    []
  );

  const removeNote = useCallback(async (id: string) => {
    await deleteNote(id);
    setNotes((prev) => prev.filter((note) => note.id !== id));
    setActiveNoteId((prev) => (prev === id ? null : prev));
  }, []);

  const setDrawing = useCallback(
    async (id: string, drawing: DrawingData) => {
      await updateNote(id, { drawing });
    },
    [updateNote]
  );

  const setContent = useCallback(
    async (id: string, content: string, title?: string) => {
      await updateNote(id, { content, title });
    },
    [updateNote]
  );

  return {
    notes,
    activeNote,
    activeNoteId,
    setActiveNoteId,
    loading,
    createNote,
    updateNote,
    persistNote,
    removeNote,
    setDrawing,
    setContent,
    refreshNotes,
  };
};
