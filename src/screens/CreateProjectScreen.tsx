import React from "react";
import { View } from "react-native";
import { Field, PrimaryButton, Section } from "../components/Primitives";
import { ListingProject } from "../data/types";
import { spacing } from "../components/theme";

export function CreateProjectScreen({ project, onChange, onNext }: { project: ListingProject; onChange: (project: ListingProject) => void; onNext: () => void }) {
  const patch = (key: keyof ListingProject, value: string) => onChange({ ...project, [key]: value } as ListingProject);
  return (
    <View style={{ gap: spacing.md }}>
      <Section title="Create Project" eyebrow="Listing basics">
        <Field label="Property address" value={project.address} onChangeText={(value) => patch("address", value)} />
        <Field label="Price" value={project.price} onChangeText={(value) => patch("price", value)} />
        <Field label="Neighborhood" value={project.neighborhood} onChangeText={(value) => patch("neighborhood", value)} />
        <Field label="City" value={project.city} onChangeText={(value) => patch("city", value)} />
        <Field label="Listing type" value={project.listingType} onChangeText={(value) => patch("listingType", value)} />
        <PrimaryButton label="Continue to photos" onPress={onNext} />
      </Section>
    </View>
  );
}
