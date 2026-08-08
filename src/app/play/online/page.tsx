import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { OnlineLobby } from "@/components/battle/OnlineLobby";

export default async function OnlineLobbyPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  return (
    <main className="flex-1 px-6 py-12 sm:px-12">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold text-white">Online Duel</h1>
        <p className="mt-1 text-sm text-stone-400">
          Create a room and share the code, or join one with a code.
        </p>
        <div className="mt-8">
          <OnlineLobby />
        </div>
      </div>
    </main>
  );
}
