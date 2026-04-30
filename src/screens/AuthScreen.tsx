import React, { useState } from "react";
import { Text, View } from "react-native";
import { Field, PrimaryButton, SecondaryButton, Section } from "../components/Primitives";
import { colors, spacing } from "../components/theme";

export function AuthScreen({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [email, setEmail] = useState("agent@estatemotion.app");
  return (
    <View style={{ gap: spacing.md }}>
      <Section title="Welcome back" eyebrow="Login">
        <Field label="Email" value={email} onChangeText={setEmail} />
        <PrimaryButton label="Continue with email" onPress={onAuthenticated} />
        <SecondaryButton label="Continue with Google" onPress={onAuthenticated} />
        <Text style={{ color: colors.muted, lineHeight: 20 }}>Supabase Auth is wired as the production target. This MVP uses a one-tap demo session until credentials are configured.</Text>
      </Section>
    </View>
  );
}
