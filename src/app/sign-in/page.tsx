import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthForms } from "@/components/AuthForms";

export default async function SignInPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <h1 className="mb-8 text-2xl font-bold text-white">Wok Quest</h1>
      <AuthForms />
    </main>
  );
}
