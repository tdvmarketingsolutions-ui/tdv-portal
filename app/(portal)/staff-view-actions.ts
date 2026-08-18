"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { assertTdvStaff } from "@/lib/auth/assert-staff";
import { STAFF_VIEW_COOKIE } from "@/lib/staff-view";

export async function setStaffViewCompanyAction(companyId: string | null): Promise<{ error?: string }> {
  try {
    await assertTdvStaff();
  } catch {
    return { error: "Niet toegestaan." };
  }

  if (companyId) {
    cookies().set(STAFF_VIEW_COOKIE, companyId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // a day is plenty for a testing/preview aid
    });
  } else {
    cookies().delete(STAFF_VIEW_COOKIE);
  }

  revalidatePath("/", "layout");
  return {};
}
