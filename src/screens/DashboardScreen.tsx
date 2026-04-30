import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card, PrimaryButton, PropertyPreview, Section } from "../components/Primitives";
import { ScreenKey } from "../data/navigation";
import { ContentPackItem, ListingProject, UserProfile } from "../data/types";
import { colors, spacing } from "../components/theme";

export function DashboardScreen({ user, project, contentPack, onNavigate }: { user: UserProfile; project: ListingProject; contentPack: ContentPackItem[]; onNavigate: (screen: ScreenKey) => void }) {
  return (
    <View style={{ gap: spacing.lg }}>
      <Section title={`Good to see you, ${user.name.split(" ")[0]}`} eyebrow={user.subscriptionStatus}>
        <PropertyPreview uri={project.photos[0].uri} title={project.title} subtitle={`${project.price} - ${project.city} - ${project.listingType}`} />
        <PrimaryButton label="Create new listing video" onPress={() => onNavigate("create")} />
      </Section>
      <Section title="Content Pack" eyebrow="Generated assets">
        {contentPack.map((item) => (
          <Pressable key={item.id} onPress={() => onNavigate("preview")}>
            <Card>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemMeta}>{item.format} - {item.durationSeconds}s - {item.sequenceCategories.join(", ")}</Text>
              <Text style={styles.itemCopy}>{item.hook}</Text>
            </Card>
          </Pressable>
        ))}
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  itemTitle: { color: colors.ink, fontSize: 17, fontWeight: "900" },
  itemMeta: { color: colors.gold, fontSize: 12, fontWeight: "800" },
  itemCopy: { color: colors.muted, lineHeight: 20 }
});
