// Supabase Auth is email/password based. We only ever want players to deal
// with usernames, so signup/login map a username to a deterministic,
// never-emailed placeholder address behind the scenes.
const EMAIL_DOMAIN = "users.wokquest.local";

export function usernameToEmail(username: string) {
  return `${username.toLowerCase()}@${EMAIL_DOMAIN}`;
}
