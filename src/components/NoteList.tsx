import React, { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Note } from "../types/notes";
import { DarkColors, LightColors } from "../theme/colors";

const formatPreview = (note: Note) => {
  const trimmed = note.content.trim();
  if (trimmed.length === 0) {
    return "No additional text";
  }
  return trimmed.slice(0, 100);
};

type NoteListProps = {
  notes: Note[];
  activeNoteId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  isDark: boolean;
};

export const NoteList = ({ notes, activeNoteId, onSelect, onCreate, isDark }: NoteListProps) => {
  const colors = isDark ? DarkColors : LightColors;
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) {
      return notes;
    }
    const lower = query.toLowerCase();
    return notes.filter((note) =>
      note.title.toLowerCase().includes(lower) || note.content.toLowerCase().includes(lower)
    );
  }, [notes, query]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Notes</Text>
        <TouchableOpacity onPress={onCreate}>
          <Text style={[styles.addButton, { color: colors.primary }]}>New</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search notes"
        placeholderTextColor={colors.subText}
        style={[styles.search, { color: colors.text, borderColor: colors.border }]}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => onSelect(item.id)}
            style={[
              styles.card,
              {
                backgroundColor: item.id === activeNoteId ? colors.background : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}
            >
              {item.title || "Untitled"}
            </Text>
            <Text style={[styles.cardContent, { color: colors.subText }]}
            >
              {formatPreview(item)}
            </Text>
            <Text style={[styles.cardMeta, { color: colors.subText }]}
            >
              {new Date(item.updatedAt).toLocaleString()}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
  },
  addButton: {
    fontSize: 16,
    fontWeight: "600",
  },
  search: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  list: {
    paddingBottom: 24,
  },
  card: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardContent: {
    fontSize: 14,
    marginTop: 4,
  },
  cardMeta: {
    fontSize: 12,
    marginTop: 8,
  },
});
