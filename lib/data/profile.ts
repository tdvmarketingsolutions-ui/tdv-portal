import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function updateOwnProfileName(fullName: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");

  const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id);
  if (error) throw new Error(`Kon profiel niet bijwerken: ${error.message}`);
}

export async function updateOwnEmailNotificationPref(enabled: boolean): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");

  const { error } = await supabase.from("profiles").update({ email_notifications: enabled }).eq("id", user.id);
  if (error) throw new Error(`Kon voorkeur niet bijwerken: ${error.message}`);
}
