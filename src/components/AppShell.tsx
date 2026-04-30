import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { navItems, ScreenKey } from "../data/navigation";
import { UserProfile } from "../data/types";
import { colors, spacing } from "./theme";

type Props = {
  children: React.ReactNode;
  currentScreen: ScreenKey;
  onNavigate: (screen: ScreenKey) => void;
  user: UserProfile;
};

export function AppShell({ children, currentScreen, onNavigate, user }: Props) {
  const showNav = currentScreen !== "welcome" && currentScreen !== "login";
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>EstateMotion</Text>
          <Text style={styles.subhead}>AI listing reels for real agents</Text>
        </View>
        <View style={styles.creditPill}>
          <Text style={styles.creditText}>{user.creditBalance} credits</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
      {showNav && (
        <View style={styles.nav}>
          {navItems.map((item) => (
            <Pressable key={item.key} style={[styles.navItem, currentScreen === item.key && styles.navItemActive]} onPress={() => onNavigate(item.key)}>
              <Text style={[styles.navText, currentScreen === item.key && styles.navTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md
  },
  logo: { color: colors.ink, fontSize: 22, fontWeight: "900", letterSpacing: 0 },
  subhead: { color: colors.muted, fontSize: 12, marginTop: 2 },
  creditPill: { backgroundColor: colors.ink, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  creditText: { color: colors.gold, fontSize: 12, fontWeight: "800" },
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: 110 },
  nav: {
    backgroundColor: colors.card,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: "row",
    gap: spacing.xs,
    left: 0,
    padding: spacing.sm,
    position: "absolute",
    right: 0
  },
  navItem: { alignItems: "center", borderRadius: 8, flex: 1, paddingVertical: 10 },
  navItemActive: { backgroundColor: colors.ink },
  navText: { color: colors.muted, fontSize: 12, fontWeight: "800" },
  navTextActive: { color: colors.gold }
});
