import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getGlobalMessages, sendGlobalMessage } from "@/app/actions/chat";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ThemedPage } from "@/components/theme/ThemedPage";

export default async function GlobalChatPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  return (
    <ThemedPage className="flex-1 px-6 py-12 sm:px-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">World Chat</h1>
        <p className="mt-1 text-sm opacity-70">
          Say hello to everyone playing Wok Quest.
        </p>
        <div className="mt-8">
          <ChatPanel
            fetchAction={getGlobalMessages}
            sendAction={sendGlobalMessage}
            heightClass="h-[60vh]"
          />
        </div>
      </div>
    </ThemedPage>
  );
}
