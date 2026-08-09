import { getCurrentUser } from "@/lib/auth";
import { SiteHeaderChrome } from "@/components/SiteHeaderChrome";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <SiteHeaderChrome
      user={user ? { username: user.username, role: user.role } : null}
    />
  );
}
