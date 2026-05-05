import { useEffect } from "react";
import { useStore } from "./lib/store";
import AuthScreen from "./screens/AuthScreen";
import DashboardScreen from "./screens/DashboardScreen";
import ProjectScreen from "./screens/ProjectScreen";
import TopBar from "./components/TopBar";
import Toast from "./components/Toast";

export default function App() {
  const init = useStore((s) => s.init);
  const screen = useStore((s) => s.screen);
  const authReady = useStore((s) => s.authReady);

  useEffect(() => {
    init();
  }, [init]);

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" aria-label="Loading" />
      </div>
    );
  }

  return (
    <>
      {screen !== "auth" && <TopBar />}
      <main>
        {screen === "auth" && <AuthScreen />}
        {screen === "dashboard" && <DashboardScreen />}
        {screen === "project" && <ProjectScreen />}
      </main>
      <Toast />
    </>
  );
}
