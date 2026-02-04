import * as SQLite from "expo-sqlite";
import { DrawingData, Note } from "../types/notes";

const db = SQLite.openDatabase("notes.db");

export const initDb = (): Promise<void> =>
  new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        "CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY NOT NULL, title TEXT, content TEXT, drawing TEXT, updated_at INTEGER);",
        [],
        () => resolve(),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });

const parseDrawing = (raw: string | null): DrawingData => {
  if (!raw) {
    return { strokes: [] };
  }
  try {
    return JSON.parse(raw) as DrawingData;
  } catch (error) {
    return { strokes: [] };
  }
};

export const fetchNotes = (): Promise<Note[]> =>
  new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM notes ORDER BY updated_at DESC;",
        [],
        (_, result) => {
          const items = result.rows._array.map((row) => ({
            id: row.id as string,
            title: (row.title as string) ?? "",
            content: (row.content as string) ?? "",
            drawing: parseDrawing(row.drawing as string),
            updatedAt: row.updated_at as number,
          }));
          resolve(items);
        },
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });

export const saveNote = (note: Note): Promise<void> =>
  new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        "INSERT OR REPLACE INTO notes (id, title, content, drawing, updated_at) VALUES (?, ?, ?, ?, ?);",
        [
          note.id,
          note.title,
          note.content,
          JSON.stringify(note.drawing),
          note.updatedAt,
        ],
        () => resolve(),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });

export const deleteNote = (id: string): Promise<void> =>
  new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        "DELETE FROM notes WHERE id = ?;",
        [id],
        () => resolve(),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
