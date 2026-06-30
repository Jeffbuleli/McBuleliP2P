import { AuthWaitingScreen } from "@/components/auth/auth-waiting-screen";

export default function AppLoading() {
  return (
    <div className="home-theme flex min-h-[60vh] items-center justify-center">
      <AuthWaitingScreen />
    </div>
  );
}
