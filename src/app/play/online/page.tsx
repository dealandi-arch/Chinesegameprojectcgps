import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { OnlineLobby } from "@/components/battle/OnlineLobby";
import { ThemedPage } from "@/components/theme/ThemedPage";

export default async function OnlineLobbyPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  return (
    <ThemedPage className="flex-1 px-6 py-12 sm:px-12">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold">Online Duel</h1>
        <p className="mt-1 text-sm opacity-70">
          Create a room and share the code, or join one with a code.
        </p>
        <div className="mt-8">
          <OnlineLobby />
        </div>
      </div>
    </ThemedPage>
  );
}
