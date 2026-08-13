import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getGlobalMessages, sendGlobalMessage } from "@/app/actions/chat";
import { ChatPanel } from "@/components/chat/ChatPanel";

export default async function GlobalChatPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  return (
    <main className="flex-1 bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100 px-6 py-12 text-stone-900 sm:px-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-stone-900">World Chat</h1>
        <p className="mt-1 text-sm text-stone-600">
          Say hello to everyone playing Wok Quest.
        </p>
        <div className="mt-8">
          <ChatPanel
            fetchAction={getGlobalMessages}
            sendAction={sendGlobalMessage}
            theme="light"
            heightClass="h-[60vh]"
          />
        </div>
      </div>
    </main>
  );
}
