import React from "react";
import { View } from "react-native";
import { Field, PrimaryButton, Section } from "../components/Primitives";
import { ListingProject } from "../data/types";
import { spacing } from "../components/theme";

export function ListingDetailsScreen({ project, onChange, onNext }: { project: ListingProject; onChange: (project: ListingProject) => void; onNext: () => void }) {
  const patch = (key: keyof ListingProject, value: string) => onChange({ ...project, [key]: value } as ListingProject);
  return (
    <View style={{ gap: spacing.md }}>
      <Section title="Listing Details" eyebrow="AI copy inputs">
        <Field label="Beds" value={project.beds} onChangeText={(value) => patch("beds", value)} />
        <Field label="Baths" value={project.baths} onChangeText={(value) => patch("baths", value)} />
        <Field label="Square footage" value={project.squareFeet} onChangeText={(value) => patch("squareFeet", value)} />
        <Field label="Hook text" value={project.hookText} onChangeText={(value) => patch("hookText", value)} />
        <Field label="CTA" value={project.cta} onChangeText={(value) => patch("cta", value)} />
        <PrimaryButton label="Choose template" onPress={onNext} />
      </Section>
    </View>
  );
}
