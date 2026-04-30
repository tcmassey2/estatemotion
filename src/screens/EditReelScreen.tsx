import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Field, PrimaryButton, Section } from "../components/Primitives";
import { CopyPack, ListingProject, TemplateStyle } from "../data/types";
import { colors, spacing } from "../components/theme";

export function EditReelScreen({ project, copyPack, template, onProjectChange, onNext }: { project: ListingProject; copyPack: CopyPack; template: TemplateStyle; onProjectChange: (project: ListingProject) => void; onNext: () => void }) {
  const orderedPhotos = [...project.photos].sort((a, b) => a.order - b.order);
  const movePhoto = (photoId: string, direction: number) => {
    const currentIndex = orderedPhotos.findIndex((photo) => photo.id === photoId);
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= orderedPhotos.length) return;
    const nextPhotos = [...orderedPhotos];
    [nextPhotos[currentIndex], nextPhotos[targetIndex]] = [nextPhotos[targetIndex], nextPhotos[currentIndex]];
    onProjectChange({ ...project, photos: nextPhotos.map((photo, index) => ({ ...photo, order: index + 1 })) });
  };
  return (
    <View style={{ gap: spacing.md }}>
      <Section title="Edit Reel" eyebrow={template.ctaWording}>
        <Field label="Hook" value={project.hookText} onChangeText={(value) => onProjectChange({ ...project, hookText: value })} />
        <Field label="Caption" value={project.caption} onChangeText={(value) => onProjectChange({ ...project, caption: value })} />
        <Field label="CTA" value={project.cta} onChangeText={(value) => onProjectChange({ ...project, cta: value })} />
        <Text style={{ color: colors.ink, fontWeight: "900" }}>AI feature highlights</Text>
        {copyPack.highlights.map((highlight) => <Text key={highlight} style={{ color: colors.muted }}>- {highlight}</Text>)}
        <Text style={{ color: colors.ink, fontWeight: "900", marginTop: 8 }}>Voiceover script</Text>
        <Text style={{ color: colors.muted, lineHeight: 20 }}>{copyPack.voiceoverScript}</Text>
        <Text style={{ color: colors.ink, fontWeight: "900", marginTop: 8 }}>Photo order</Text>
        {orderedPhotos.map((photo, index) => (
          <View key={photo.id} style={styles.photoRow}>
            <Image source={{ uri: photo.uri }} style={styles.photo} />
            <View style={{ flex: 1 }}>
              <Text style={styles.photoTitle}>{index + 1}. {photo.category}</Text>
              <Text style={styles.photoMeta}>{photo.fileName}</Text>
            </View>
            <Pressable style={styles.orderButton} onPress={() => movePhoto(photo.id, -1)}><Text>Up</Text></Pressable>
            <Pressable style={styles.orderButton} onPress={() => movePhoto(photo.id, 1)}><Text>Down</Text></Pressable>
          </View>
        ))}
        <PrimaryButton label="Export content pack" onPress={onNext} />
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  photoRow: { alignItems: "center", backgroundColor: colors.card, borderColor: colors.line, borderRadius: 8, borderWidth: 1, flexDirection: "row", gap: spacing.sm, padding: spacing.sm },
  photo: { borderRadius: 8, height: 52, width: 52 },
  photoTitle: { color: colors.ink, fontWeight: "900" },
  photoMeta: { color: colors.muted, fontSize: 12 },
  orderButton: { backgroundColor: "#F1ECE2", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 8 }
});
