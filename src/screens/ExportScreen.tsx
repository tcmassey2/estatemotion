import React from "react";
import { Platform, Text, View } from "react-native";
import { Card, PrimaryButton, SecondaryButton, Section } from "../components/Primitives";
import { ScreenKey } from "../data/navigation";
import { ContentPackItem, RenderJob } from "../data/types";
import { colors, spacing } from "../components/theme";

export function ExportScreen({ contentPack, renderJobs, onNavigate }: { contentPack: ContentPackItem[]; renderJobs: RenderJob[]; onNavigate: (screen: ScreenKey) => void }) {
  const exportManifest = () => {
    const payload = {
      app: "EstateMotion",
      createdAt: new Date().toISOString(),
      limitation: "Local MVP manifest. MP4 render is mocked until Remotion/FFmpeg worker is connected.",
      contentPack,
      renderJobs
    };
    downloadOnWeb("estatemotion-render-manifest.json", "application/json", JSON.stringify(payload, null, 2));
  };
  return (
    <View style={{ gap: spacing.md }}>
      <Section title="Export" eyebrow="MP4, captions, hashtags, thumbnail">
        {renderJobs.slice(0, 5).map((job) => (
          <Card key={job.id}>
            <Text style={{ color: colors.ink, fontSize: 16, fontWeight: "900" }}>{job.outputName}</Text>
            <Text style={{ color: colors.gold, fontWeight: "800" }}>{job.format} - {job.status} - ~{job.estimatedSeconds}s</Text>
            <Text style={{ color: colors.muted }}>{job.pipeline[job.pipeline.length - 1]}</Text>
          </Card>
        ))}
        <PrimaryButton label="Download render manifest" onPress={exportManifest} />
        <SecondaryButton label={`Download ${contentPack.length} captions`} onPress={() => downloadOnWeb("estatemotion-captions.txt", "text/plain", contentPack.map((item) => `${item.title}\n${item.caption}`).join("\n\n"))} />
        <SecondaryButton label="Back to dashboard" onPress={() => onNavigate("dashboard")} />
      </Section>
    </View>
  );
}

function downloadOnWeb(fileName: string, mimeType: string, body: string) {
  if (Platform.OS !== "web") return;
  const blob = new Blob([body], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
