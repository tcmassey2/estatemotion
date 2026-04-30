import React from "react";
import { ImageBackground, StyleSheet, Text, View } from "react-native";
import { BrandKit, ContentPackItem, ListingProject, TemplateStyle } from "../data/types";
import { colors, spacing } from "./theme";

export function VideoMock({ project, template, brandKit, item }: { project: ListingProject; template: TemplateStyle; brandKit: BrandKit; item: ContentPackItem }) {
  const hero = project.photos[0]?.uri;
  return (
    <ImageBackground source={{ uri: hero }} style={styles.frame} imageStyle={styles.image}>
      <View style={styles.overlay} />
      <View style={styles.topBadge}>
        <Text style={styles.badgeText}>{project.listingType}</Text>
      </View>
      <View style={styles.captionBlock}>
        <Text style={styles.hook}>{item.hook}</Text>
        <Text style={styles.detail}>{project.price} - {project.beds} BD - {project.baths} BA - {project.squareFeet} SQ FT</Text>
      </View>
      <View style={[styles.endCard, { borderColor: template.accentColor }]}>
        <Text style={styles.agent}>{brandKit.name}</Text>
        <Text style={styles.brokerage}>{brandKit.brokerage}</Text>
        <Text style={styles.cta}>{brandKit.ctaText}</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  frame: { aspectRatio: 9 / 16, borderRadius: 8, justifyContent: "space-between", overflow: "hidden", padding: spacing.md },
  image: { borderRadius: 8 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.34)" },
  topBadge: { alignSelf: "flex-start", backgroundColor: colors.card, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  badgeText: { color: colors.ink, fontSize: 12, fontWeight: "900" },
  captionBlock: { gap: spacing.xs },
  hook: { color: "#FFFFFF", fontSize: 31, fontWeight: "900", letterSpacing: 0 },
  detail: { color: "rgba(255,255,255,0.84)", fontSize: 13, fontWeight: "800" },
  endCard: { backgroundColor: "rgba(255,255,255,0.94)", borderLeftWidth: 4, borderRadius: 8, gap: 2, padding: spacing.md },
  agent: { color: colors.ink, fontSize: 17, fontWeight: "900" },
  brokerage: { color: colors.muted, fontWeight: "700" },
  cta: { color: colors.ink, fontWeight: "900", marginTop: 6 }
});
