import { lostFoundAdmin } from '../lostFoundSupabaseAdmin';

export interface Contact {
  name?: string;
  phone?: string;
  email?: string;
}

/**
 * Ported from apps/api's Team1IdentityService — identity fields aren't
 * duplicated into Lost & Found's own tables, they're read from auth.users
 * (same place AppLayout.tsx's updateProfile() reads full_name/avatar_url
 * from for the real Google-OAuth session).
 */
export async function getContact(userId: string): Promise<Contact> {
  const { data, error } = await lostFoundAdmin.auth.admin.getUserById(userId);
  if (error || !data?.user) return {};
  const metadata = data.user.user_metadata as Record<string, unknown> | undefined;
  const fullName = (metadata?.['full_name'] as string) ?? (metadata?.['name'] as string) ?? undefined;
  return {
    name: fullName,
    phone: (metadata?.['phone'] as string) ?? data.user.phone ?? undefined,
    email: data.user.email ?? undefined,
  };
}
