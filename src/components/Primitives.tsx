import React from "react";
import { ImageBackground, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, spacing } from "./theme";

export function Section({ title, eyebrow, children }: { title: string; eyebrow?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
      <Text style={styles.title}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.primaryButton} onPress={onPress}>
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.secondaryButton} onPress={onPress}>
      <Text style={styles.secondaryText}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChangeText} placeholderTextColor={colors.muted} />
    </View>
  );
}

export function PropertyPreview({ uri, title, subtitle }: { uri: string; title: string; subtitle: string }) {
  return (
    <ImageBackground source={{ uri }} style={styles.preview} imageStyle={styles.previewImage}>
      <View style={styles.previewShade} />
      <View style={styles.previewText}>
        <Text style={styles.previewTitle}>{title}</Text>
        <Text style={styles.previewSubtitle}>{subtitle}</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  eyebrow: { color: colors.gold, fontSize: 12, fontWeight: "900", letterSpacing: 0, textTransform: "uppercase" },
  title: { color: colors.ink, fontSize: 24, fontWeight: "900", letterSpacing: 0 },
  sectionBody: { gap: spacing.sm },
  card: { backgroundColor: colors.card, borderColor: colors.line, borderRadius: 8, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  primaryButton: { alignItems: "center", backgroundColor: colors.ink, borderRadius: 8, padding: 15 },
  primaryText: { color: colors.gold, fontWeight: "900" },
  secondaryButton: { alignItems: "center", backgroundColor: colors.card, borderColor: colors.line, borderRadius: 8, borderWidth: 1, padding: 14 },
  secondaryText: { color: colors.ink, fontWeight: "900" },
  field: { gap: 6 },
  label: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  input: { backgroundColor: colors.card, borderColor: colors.line, borderRadius: 8, borderWidth: 1, color: colors.ink, padding: 13 },
  preview: { height: 390, justifyContent: "flex-end", overflow: "hidden", borderRadius: 8 },
  previewImage: { borderRadius: 8 },
  previewShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.32)" },
  previewText: { gap: 6, padding: spacing.lg },
  previewTitle: { color: "#FFFFFF", fontSize: 30, fontWeight: "900", letterSpacing: 0 },
  previewSubtitle: { color: "rgba(255,255,255,0.86)", fontSize: 14, fontWeight: "700" }
});
