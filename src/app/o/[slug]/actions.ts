"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const key = (orgId: string) => `imx_skip_setup_${orgId.replace(/[^a-f0-9]/g, "").slice(0, 32)}`;

/** Sembunyikan senarai persediaan untuk masjid ini (dalam pelayar ini) selama 30 hari. */
export async function skipSetup(slug: string, orgId: string) {
  (await cookies()).set(key(orgId), "1", { maxAge: 60 * 60 * 24 * 30, path: "/", sameSite: "lax", httpOnly: true, secure: true });
  revalidatePath(`/o/${slug}`);
}

export async function showSetup(slug: string, orgId: string) {
  (await cookies()).delete(key(orgId));
  revalidatePath(`/o/${slug}`);
}

export async function isSetupSkipped(orgId: string) {
  return (await cookies()).get(key(orgId))?.value === "1";
}
