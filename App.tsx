import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppShell } from "./src/components/AppShell";
import { ScreenKey } from "./src/data/navigation";
import { demoBrandKit, demoProject, demoUser } from "./src/data/dummy";
import { templates } from "./src/data/templates";
import { generateCopyPack } from "./src/lib/ai";
import { createContentPack, createRenderJobs } from "./src/lib/rendering";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { WelcomeScreen } from "./src/screens/WelcomeScreen";
import { AuthScreen } from "./src/screens/AuthScreen";
import { BrandKitScreen } from "./src/screens/BrandKitScreen";
import { CreateProjectScreen } from "./src/screens/CreateProjectScreen";
import { UploadPhotosScreen } from "./src/screens/UploadPhotosScreen";
import { ListingDetailsScreen } from "./src/screens/ListingDetailsScreen";
import { ChooseTemplateScreen } from "./src/screens/ChooseTemplateScreen";
import { PreviewVideoScreen } from "./src/screens/PreviewVideoScreen";
import { EditReelScreen } from "./src/screens/EditReelScreen";
import { ExportScreen } from "./src/screens/ExportScreen";
import { SubscriptionScreen } from "./src/screens/SubscriptionScreen";

export default function App() {
  const [screen, setScreen] = useState<ScreenKey>("welcome");
  const [user] = useState(demoUser);
  const [brandKit, setBrandKit] = useState(demoBrandKit);
  const [project, setProject] = useState(demoProject);
  const [selectedTemplateId, setSelectedTemplateId] = useState("desert-luxury");
  const [hasLoadedLocalState, setHasLoadedLocalState] = useState(false);
  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? templates[0];

  useEffect(() => {
    async function loadLocalState() {
      const saved = await AsyncStorage.getItem("estatemotion.native.mvp.v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        setBrandKit({ ...demoBrandKit, ...parsed.brandKit });
        setProject({ ...demoProject, ...parsed.project });
        setSelectedTemplateId(parsed.selectedTemplateId ?? "desert-luxury");
        setScreen(parsed.screen ?? "dashboard");
      }
      setHasLoadedLocalState(true);
    }
    loadLocalState();
  }, []);

  useEffect(() => {
    if (!hasLoadedLocalState) return;
    AsyncStorage.setItem("estatemotion.native.mvp.v1", JSON.stringify({ brandKit, project, selectedTemplateId, screen }));
  }, [brandKit, hasLoadedLocalState, project, screen, selectedTemplateId]);

  const copyPack = useMemo(() => generateCopyPack(project, selectedTemplate), [project, selectedTemplate]);
  const contentPack = useMemo(() => createContentPack(project, selectedTemplate, copyPack), [project, selectedTemplate, copyPack]);
  const renderJobs = useMemo(() => createRenderJobs(project, selectedTemplate, brandKit, contentPack), [project, selectedTemplate, brandKit, contentPack]);

  return (
    <SafeAreaProvider>
      <AppShell currentScreen={screen} onNavigate={setScreen} user={user}>
        {screen === "welcome" && <WelcomeScreen onStart={() => setScreen("login")} />}
        {screen === "login" && <AuthScreen onAuthenticated={() => setScreen("dashboard")} />}
        {screen === "dashboard" && <DashboardScreen user={user} project={project} contentPack={contentPack} onNavigate={setScreen} />}
        {screen === "create" && <CreateProjectScreen project={project} onChange={setProject} onNext={() => setScreen("upload")} />}
        {screen === "upload" && <UploadPhotosScreen project={project} onChange={setProject} onNext={() => setScreen("details")} />}
        {screen === "details" && <ListingDetailsScreen project={project} onChange={setProject} onNext={() => setScreen("template")} />}
        {screen === "template" && <ChooseTemplateScreen selectedId={selectedTemplateId} onSelect={setSelectedTemplateId} onNext={() => setScreen("preview")} />}
        {screen === "preview" && <PreviewVideoScreen project={project} template={selectedTemplate} brandKit={brandKit} contentPack={contentPack} onNext={() => setScreen("edit")} />}
        {screen === "edit" && <EditReelScreen project={project} copyPack={copyPack} template={selectedTemplate} onProjectChange={setProject} onNext={() => setScreen("export")} />}
        {screen === "export" && <ExportScreen contentPack={contentPack} renderJobs={renderJobs} onNavigate={setScreen} />}
        {screen === "brand" && <BrandKitScreen brandKit={brandKit} onChange={setBrandKit} />}
        {screen === "billing" && <SubscriptionScreen user={user} />}
      </AppShell>
    </SafeAreaProvider>
  );
}
