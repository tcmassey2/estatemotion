import React from "react";
import { Text, View } from "react-native";
import { Card, PrimaryButton, Section } from "../components/Primitives";
import { UserProfile } from "../data/types";
import { colors, spacing } from "../components/theme";

export function SubscriptionScreen({ user }: { user: UserProfile }) {
  return (
    <View style={{ gap: spacing.md }}>
      <Section title="Subscription & Credits" eyebrow={user.subscriptionStatus}>
        <Card>
          <Text style={{ color: colors.ink, fontSize: 34, fontWeight: "900" }}>{user.creditBalance}</Text>
          <Text style={{ color: colors.muted }}>Available render credits</Text>
        </Card>
        <Card>
          <Text style={{ color: colors.ink, fontWeight: "900" }}>Agent Pro</Text>
          <Text style={{ color: colors.muted, lineHeight: 20 }}>Monthly subscription with branded exports, content packs, and priority rendering.</Text>
          <PrimaryButton label="Manage with Stripe" onPress={() => undefined} />
        </Card>
      </Section>
    </View>
  );
}
