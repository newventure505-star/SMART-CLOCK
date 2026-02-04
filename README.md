# Smart Notes App

A modern, offline-first notes app inspired by Apple Notes. It supports rich text notes, a fast canvas for hand‑drawn sketches, and stores everything locally using SQLite.

## Features
- Create, edit, and delete notes
- Toggle between text and drawing mode inside the same note
- Pen/eraser tools with color and thickness controls
- Smooth touch drawing with undo/redo
- Pinch to zoom and two‑finger pan on the canvas
- Auto‑save to SQLite (offline)
- Dark mode
- Search notes by title or content
- Export a note to PDF or image

## Folder structure
```
.
├── App.tsx
├── assets
├── src
│   ├── components
│   │   ├── DrawingCanvas.tsx
│   │   ├── NoteEditor.tsx
│   │   └── NoteList.tsx
│   ├── db
│   │   ├── notesDb.ts
│   │   └── useNotes.ts
│   ├── theme
│   │   └── colors.ts
│   └── types
│       └── notes.ts
├── app.json
├── babel.config.js
├── package.json
└── tsconfig.json
```

## Setup instructions
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the Expo dev server:
   ```bash
   npm run start
   ```
3. Run on Android:
   ```bash
   npm run android
   ```

## Architecture overview
- **UI (View):** `NoteList`, `NoteEditor`, and `DrawingCanvas` render the interface and handle gestures.
- **Controller/State:** `useNotes` orchestrates CRUD actions, local state, and persistence.
- **Model:** `Note`, `DrawingData`, and `Stroke` types define the core data shapes.

## How the drawing canvas works
- The canvas uses **react-native-svg** to render vector strokes.
- Each stroke is captured as a series of points (`{x, y}`), plus a color, width, and tool type.
- While drawing, `PanResponder` tracks the user’s finger and appends points to the current stroke.
- Strokes are stored in `drawing.strokes`, serialized to JSON, and saved in SQLite with the text content.
- Undo/redo is managed via a history stack in `NoteEditor`.
- Pinch‑to‑zoom and two‑finger pan are handled by `react-native-gesture-handler`, adjusting the SVG transform.

## Notes
- This project is ready for production hardening (analytics, cloud sync, authentication) but currently targets local‑only storage.
- Export uses **expo-print** for PDF generation and **react-native-view-shot** for image snapshots.
