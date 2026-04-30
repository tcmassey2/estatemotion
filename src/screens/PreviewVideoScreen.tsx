import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { PrimaryButton, Section } from "../components/Primitives";
import { VideoMock } from "../components/VideoMock";
import { BrandKit, ContentPackItem, ListingProject, TemplateStyle } from "../data/types";
import { colors, spacing } from "../components/theme";

export function PreviewVideoScreen({ project, template, brandKit, contentPack, onNext }: { project: ListingProject; template: TemplateStyle; brandKit: BrandKit; contentPack: ContentPackItem[]; onNext: () => void }) {
  const orderedPhotos = [...project.photos].sort((a, b) => a.order - b.order);
  return (
    <View style={{ gap: spacing.md }}>
      <Section title="Preview Video" eyebrow={template.name}>
        <VideoMock project={project} template={template} brandKit={brandKit} item={contentPack[0]} />
        <Text style={{ color: colors.muted, lineHeight: 20 }}>Preview shows the thumbnail, sequence tone, text overlays, brand end card, and compliance-ready CTA structure.</Text>
        <View style={styles.timeline}>
          {orderedPhotos.map((photo, index) => (
            <View key={photo.id} style={styles.scene}>
              <Image source={{ uri: photo.uri }} style={styles.sceneImage} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sceneTitle}>{index + 1}. {photo.category}</Text>
                <Text style={styles.sceneMeta}>{photo.fileName}</Text>
              </View>
            </View>
          ))}
        </View>
        <PrimaryButton label="Edit reel copy" onPress={onNext} />
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  timeline: { gap: spacing.sm },
  scene: { alignItems: "center", backgroundColor: colors.card, borderColor: colors.line, borderRadius: 8, borderWidth: 1, flexDirection: "row", gap: spacing.sm, padding: spacing.sm },
  sceneImage: { borderRadius: 8, height: 58, width: 58 },
  sceneTitle: { color: colors.ink, fontWeight: "900" },
  sceneMeta: { color: colors.muted, fontSize: 12, marginTop: 2 }
});
