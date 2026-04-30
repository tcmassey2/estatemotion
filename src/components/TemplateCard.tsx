import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { TemplateStyle } from "../data/types";
import { colors, spacing } from "./theme";

export function TemplateCard({ template, selected, onPress }: { template: TemplateStyle; selected: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.card, selected && styles.selected]} onPress={onPress}>
      <View style={[styles.swatch, { backgroundColor: template.accentColor }]} />
      <View style={styles.copy}>
        <Text style={styles.name}>{template.name}</Text>
        <Text style={styles.description}>{template.description}</Text>
        <Text style={styles.meta}>{template.motionSpeed} - {template.transitionStyle} - {template.textPlacement}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: "center", backgroundColor: colors.card, borderColor: colors.line, borderRadius: 8, borderWidth: 1, flexDirection: "row", gap: spacing.md, padding: spacing.md },
  selected: { borderColor: colors.gold, borderWidth: 2 },
  swatch: { borderRadius: 999, height: 38, width: 38 },
  copy: { flex: 1, gap: 4 },
  name: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  description: { color: colors.muted, lineHeight: 19 },
  meta: { color: colors.gold, fontSize: 12, fontWeight: "800", textTransform: "uppercase" }
});
