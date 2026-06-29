import { AuthWaitingScreen } from "@/components/auth/auth-waiting-screen";

export default function AppLoading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <AuthWaitingScreen />
    </div>
  );
}
