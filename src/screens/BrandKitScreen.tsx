import React from "react";
import { Text, View } from "react-native";
import { Field, Section } from "../components/Primitives";
import { BrandKit } from "../data/types";
import { colors, spacing } from "../components/theme";

export function BrandKitScreen({ brandKit, onChange }: { brandKit: BrandKit; onChange: (brandKit: BrandKit) => void }) {
  const patch = (key: keyof BrandKit, value: string) => onChange({ ...brandKit, [key]: value } as BrandKit);
  return (
    <View style={{ gap: spacing.md }}>
      <Section title="Agent Brand Kit" eyebrow="Personal brand end card">
        <Field label="Name" value={brandKit.name} onChangeText={(value) => patch("name", value)} />
        <Field label="Brokerage" value={brandKit.brokerage} onChangeText={(value) => patch("brokerage", value)} />
        <Field label="Phone" value={brandKit.phone} onChangeText={(value) => patch("phone", value)} />
        <Field label="Email" value={brandKit.email} onChangeText={(value) => patch("email", value)} />
        <Field label="Website" value={brandKit.website} onChangeText={(value) => patch("website", value)} />
        <Field label="Instagram" value={brandKit.instagram} onChangeText={(value) => patch("instagram", value)} />
        <Field label="Primary color" value={brandKit.primaryColor} onChangeText={(value) => patch("primaryColor", value)} />
        <Field label="Accent color" value={brandKit.accentColor} onChangeText={(value) => patch("accentColor", value)} />
        <Field label="CTA text" value={brandKit.ctaText} onChangeText={(value) => patch("ctaText", value)} />
        <Field label="Listing courtesy of" value={brandKit.listingCourtesyOf} onChangeText={(value) => patch("listingCourtesyOf", value)} />
        <Text style={{ color: colors.muted, lineHeight: 20 }}>Headshot and logo uploads are stored in Supabase Storage in production. The MVP keeps URL fields in the seed brand kit.</Text>
      </Section>
    </View>
  );
}
