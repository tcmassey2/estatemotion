import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { PrimaryButton, PropertyPreview, Section } from "../components/Primitives";
import { demoProject } from "../data/dummy";
import { colors, spacing } from "../components/theme";

export function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <View style={styles.screen}>
      <PropertyPreview uri={demoProject.photos[0].uri} title="Premium listing reels in minutes" subtitle="Built for Reels, TikTok, Shorts, Stories, and agent brands." />
      <Section title="App-first real estate video creation" eyebrow="EstateMotion">
        <Text style={styles.copy}>Upload real listing photos, choose a social-native template, generate AI copy, preview the reel, and export a branded content pack without opening a desktop editor.</Text>
      </Section>
      <PrimaryButton label="Start creating" onPress={onStart} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: spacing.lg },
  copy: { color: colors.muted, fontSize: 15, lineHeight: 22 }
});
