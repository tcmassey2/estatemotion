import React from "react";
import { View } from "react-native";
import { PrimaryButton, Section } from "../components/Primitives";
import { TemplateCard } from "../components/TemplateCard";
import { templates } from "../data/templates";
import { spacing } from "../components/theme";

export function ChooseTemplateScreen({ selectedId, onSelect, onNext }: { selectedId: string; onSelect: (id: string) => void; onNext: () => void }) {
  return (
    <View style={{ gap: spacing.md }}>
      <Section title="Choose Template" eyebrow="Social-native styles">
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} selected={template.id === selectedId} onPress={() => onSelect(template.id)} />
        ))}
        <PrimaryButton label="Preview video" onPress={onNext} />
      </Section>
    </View>
  );
}
