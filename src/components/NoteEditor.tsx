import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";
import { DrawingCanvas } from "./DrawingCanvas";
import { DrawingData, Note } from "../types/notes";
import { LightColors, DarkColors } from "../theme/colors";

const TOOL_COLORS = ["#111111", "#2F80ED", "#EB5757", "#27AE60", "#F2C94C"];

type NoteEditorProps = {
  note: Note;
  onSave: (note: Note) => Promise<void>;
  onUpdate: (id: string, updates: Partial<Omit<Note, "id">>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isDark: boolean;
};

export const NoteEditor = ({ note, onSave, onUpdate, onDelete, isDark }: NoteEditorProps) => {
  const colors = isDark ? DarkColors : LightColors;
  const [mode, setMode] = useState<"text" | "draw">("text");
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [drawing, setDrawing] = useState<DrawingData>(note.drawing);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [color, setColor] = useState(TOOL_COLORS[0]);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });
  const [history, setHistory] = useState<DrawingData[]>([note.drawing]);
  const [future, setFuture] = useState<DrawingData[]>([]);
  const viewRef = useRef<View>(null);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setDrawing(note.drawing);
    setHistory([note.drawing]);
    setFuture([]);
  }, [note]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onUpdate(note.id, { title, content, drawing });
      onSave({ ...note, title, content, drawing, updatedAt: Date.now() });
    }, 600);
    return () => clearTimeout(handler);
  }, [title, content, drawing, note, onUpdate, onSave]);

  const handleDrawingChange = useCallback(
    (next: DrawingData) => {
      setDrawing(next);
      setHistory((prev) => [...prev, next]);
      setFuture([]);
    },
    []
  );

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length <= 1) {
        return prev;
      }
      const updated = prev.slice(0, -1);
      const removed = prev[prev.length - 1];
      setFuture((futurePrev) => [removed, ...futurePrev]);
      setDrawing(updated[updated.length - 1]);
      return updated;
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((prev) => {
      if (prev.length === 0) {
        return prev;
      }
      const [next, ...rest] = prev;
      setHistory((historyPrev) => [...historyPrev, next]);
      setDrawing(next);
      return rest;
    });
  }, []);

  const exportPdf = useCallback(async () => {
    const svgContent = drawing.strokes
      .map((stroke) => {
        const points = stroke.points.map((point) => `${point.x},${point.y}`).join(" ");
        return `<polyline fill="none" stroke="${stroke.color}" stroke-width="${stroke.width}" stroke-linecap="round" stroke-linejoin="round" points="${points}" />`;
      })
      .join("");
    const html = `
      <html>
        <body style="font-family: -apple-system, sans-serif; padding: 24px;">
          <h1>${title || "Untitled"}</h1>
          <p style="white-space: pre-wrap;">${content}</p>
          <div style="margin-top: 24px;">
            <svg width="${canvasSize.width}" height="${canvasSize.height}" viewBox="0 0 ${canvasSize.width} ${canvasSize.height}">
              ${svgContent}
            </svg>
          </div>
        </body>
      </html>
    `;
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
  }, [title, content, drawing, canvasSize]);

  const exportImage = useCallback(async () => {
    if (!viewRef.current) {
      return;
    }
    const uri = await captureRef(viewRef.current, {
      format: "png",
      quality: 0.9,
    });
    await Sharing.shareAsync(uri);
  }, []);

  const handleDelete = useCallback(() => {
    Alert.alert("Delete note", "This will permanently delete the note.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => onDelete(note.id) },
    ]);
  }, [note.id, onDelete]);

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onUpdate((event) => {
          setScale((prev) => Math.min(Math.max(prev * event.scale, 0.6), 3));
        })
        .onEnd(() => {}),
    []
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .minPointers(2)
        .onUpdate((event) => {
          setTranslate((prev) => ({
            x: prev.x + event.changeX,
            y: prev.y + event.changeY,
          }));
        }),
    []
  );

  const combinedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const eraserColor = colors.canvas;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>Note</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={exportPdf} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, { color: colors.primary }]}>PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={exportImage} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, { color: colors.primary }]}>Image</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, { color: "#EB5757" }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.modeSwitch}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            { backgroundColor: mode === "text" ? colors.surface : "transparent" },
          ]}
          onPress={() => setMode("text")}
        >
          <Text style={{ color: colors.text }}>Text</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeButton,
            { backgroundColor: mode === "draw" ? colors.surface : "transparent" },
          ]}
          onPress={() => setMode("draw")}
        >
          <Text style={{ color: colors.text }}>Draw</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.editor} ref={viewRef} collapsable={false}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title"
          placeholderTextColor={colors.subText}
          style={[styles.titleInput, { color: colors.text }]}
        />
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Start writing..."
          placeholderTextColor={colors.subText}
          multiline
          style={[styles.contentInput, { color: colors.text }]}
        />
        <GestureDetector gesture={combinedGesture}>
          <View style={[styles.canvasContainer, { backgroundColor: colors.canvas }]}
          >
            <DrawingCanvas
              drawing={drawing}
              mode={mode}
              color={color}
              eraserColor={eraserColor}
              strokeWidth={strokeWidth}
              tool={tool}
              onChange={handleDrawingChange}
              scale={scale}
              translate={translate}
              canvasSize={canvasSize}
              onCanvasLayout={(width, height) => setCanvasSize({ width, height })}
            />
          </View>
        </GestureDetector>
      </View>

      {mode === "draw" && (
        <View style={[styles.toolbar, { borderTopColor: colors.border }]}
        >
          <View style={styles.toolRow}>
            <TouchableOpacity
              onPress={() => setTool("pen")}
              style={[
                styles.toolButton,
                { borderColor: tool === "pen" ? colors.primary : colors.border },
              ]}
            >
              <Text style={{ color: colors.text }}>Pen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTool("eraser")}
              style={[
                styles.toolButton,
                { borderColor: tool === "eraser" ? colors.primary : colors.border },
              ]}
            >
              <Text style={{ color: colors.text }}>Eraser</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={undo} style={styles.toolButton}>
              <Text style={{ color: colors.text }}>Undo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={redo} style={styles.toolButton}>
              <Text style={{ color: colors.text }}>Redo</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.toolRow}>
            {TOOL_COLORS.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => {
                  setColor(item);
                  setTool("pen");
                }}
                style={[
                  styles.colorDot,
                  {
                    backgroundColor: item,
                    borderColor: item === color ? colors.primary : colors.border,
                  },
                ]}
              />
            ))}
            <View style={styles.sliderGroup}>
              {[2, 4, 6, 8].map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeOption,
                    { borderColor: strokeWidth === size ? colors.primary : colors.border },
                  ]}
                  onPress={() => setStrokeWidth(size)}
                >
                  <View
                    style={{
                      width: size,
                      height: size,
                      borderRadius: size / 2,
                      backgroundColor: colors.text,
                    }}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  headerActions: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  headerButton: {
    paddingVertical: 4,
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modeSwitch: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
  },
  editor: {
    flex: 1,
    paddingHorizontal: 16,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
  },
  contentInput: {
    minHeight: 120,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  canvasContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "transparent",
  },
  toolbar: {
    borderTopWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  toolRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  toolButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
  sliderGroup: {
    flexDirection: "row",
    gap: 8,
    marginLeft: "auto",
  },
  sizeOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
