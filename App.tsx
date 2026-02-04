import React from "react";
import { ActivityIndicator, StyleSheet, useColorScheme, useWindowDimensions, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { useNotes } from "./src/db/useNotes";
import { NoteEditor } from "./src/components/NoteEditor";
import { NoteList } from "./src/components/NoteList";
import { DarkColors, LightColors } from "./src/theme/colors";

export default function App() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;

  const {
    notes,
    activeNote,
    activeNoteId,
    setActiveNoteId,
    loading,
    createNote,
    updateNote,
    persistNote,
    removeNote,
  } = useNotes();

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={[styles.sidebar, { width: isTablet ? 320 : "100%" }]}
        >
          <NoteList
            notes={notes}
            activeNoteId={activeNoteId}
            onSelect={(id) => setActiveNoteId(id)}
            onCreate={createNote}
            isDark={isDark}
          />
        </View>
        {activeNote && (
          <View style={styles.editorPane}>
            <NoteEditor
              note={activeNote}
              onSave={persistNote}
              onUpdate={updateNote}
              onDelete={removeNote}
              isDark={isDark}
            />
          </View>
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    borderRightWidth: 1,
    borderRightColor: "#00000010",
  },
  editorPane: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
