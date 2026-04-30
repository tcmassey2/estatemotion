import React, { useState } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { PrimaryButton, Section } from "../components/Primitives";
import { ListingProject } from "../data/types";
import { categorizePhoto, sortPhotosForReel } from "../lib/photoSorting";
import { colors, spacing } from "../components/theme";

export function UploadPhotosScreen({ project, onChange, onNext }: { project: ListingProject; onChange: (project: ListingProject) => void; onNext: () => void }) {
  const [uploadError, setUploadError] = useState("");
  const sortPhotos = () => onChange({ ...project, photos: sortPhotosForReel(project.photos).map((photo, index) => ({ ...photo, order: index + 1 })) });
  const orderedPhotos = [...project.photos].sort((a, b) => a.order - b.order);
  const handleWebFiles = async (event: { target?: { files?: FileList } }) => {
    const selectedFiles = Array.from(event.target?.files ?? []);
    const files = selectedFiles.filter((file) => file.type.startsWith("image/"));
    const rejectedCount = selectedFiles.length - files.length;
    if (rejectedCount) {
      setUploadError(`${rejectedCount} non-image file${rejectedCount === 1 ? "" : "s"} skipped.`);
    } else {
      setUploadError("");
    }
    if (!files.length) {
      setUploadError("No image files were selected.");
      return;
    }
    const existingKeys = new Set(orderedPhotos.map((photo) => `${photo.fileName.toLowerCase()}::${photo.size ?? 0}`));
    const uniqueFiles = files.filter((file) => {
      const key = `${file.name.toLowerCase()}::${file.size}`;
      if (existingKeys.has(key)) return false;
      existingKeys.add(key);
      return true;
    });
    if (!uniqueFiles.length) {
      setUploadError("Those photos are already in this project.");
      return;
    }
    const dataUrls = await Promise.all(uniqueFiles.map(readFileAsDataUrl));
    const uploadedPhotos = uniqueFiles.map((file, index) => ({
      id: `web-${Date.now()}-${index}`,
      uri: dataUrls[index],
      fileName: file.name,
      size: file.size,
      category: categorizePhoto(file.name),
      order: orderedPhotos.length + index + 1
    }));
    const photos = [...orderedPhotos, ...uploadedPhotos].map((photo, index) => ({ ...photo, order: index + 1 }));
    onChange({ ...project, photos });
  };
  return (
    <View style={{ gap: spacing.md }}>
      <Section title="Upload Photos" eyebrow="5-25 listing images">
        <Pressable style={styles.upload}>
          <Text style={styles.plus}>+</Text>
          <Text style={styles.uploadTitle}>Add property photos</Text>
          <Text style={styles.uploadCopy}>{Platform.OS === "web" ? "Select real image files for the local web MVP." : "Expo ImagePicker native picker is the next production step."}</Text>
          <Text style={styles.count}>{orderedPhotos.length} photo{orderedPhotos.length === 1 ? "" : "s"} uploaded.</Text>
          {!!uploadError && <Text style={styles.error}>{uploadError}</Text>}
          {Platform.OS === "web" &&
            React.createElement("input" as any, {
              accept: "image/*",
              multiple: true,
              onChange: handleWebFiles,
              style: styles.webInput,
              type: "file"
            })}
        </Pressable>
        <View style={styles.grid}>
          {orderedPhotos.map((photo) => (
            <View key={photo.id} style={styles.photoCard}>
              <Image source={{ uri: photo.uri }} style={styles.photo} />
              <Text style={styles.category}>{photo.order}. {photo.category}</Text>
            </View>
          ))}
        </View>
        <PrimaryButton label="AI sort photos" onPress={sortPhotos} />
        <PrimaryButton label="Continue to details" onPress={onNext} />
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  upload: { alignItems: "center", backgroundColor: colors.card, borderColor: colors.line, borderRadius: 8, borderStyle: "dashed", borderWidth: 1, gap: 6, padding: spacing.lg },
  plus: { color: colors.gold, fontSize: 34, fontWeight: "900" },
  uploadTitle: { color: colors.ink, fontWeight: "900" },
  uploadCopy: { color: colors.muted, textAlign: "center" },
  count: { color: colors.ink, fontSize: 13, fontWeight: "900" },
  error: { color: "#A94F4F", fontSize: 13, fontWeight: "800", textAlign: "center" },
  webInput: { marginTop: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  photoCard: { width: "48%" },
  photo: { aspectRatio: 1, borderRadius: 8, width: "100%" },
  category: { color: colors.muted, fontSize: 12, fontWeight: "800", marginTop: 5 }
});

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
