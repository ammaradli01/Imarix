/** Peranan dan kebenaran. Pangkalan data (RLS) ialah penguat kuasa sebenar;
 *  fungsi di sini hanya untuk memaparkan atau menyembunyikan butang. */
export const ROLES = ["org_admin", "chairman", "treasurer", "secretary", "auditor", "committee"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  org_admin: "Pentadbir",
  chairman: "Nazir / Pengerusi",
  treasurer: "Bendahari",
  secretary: "Setiausaha",
  auditor: "Pemeriksa Kira-kira",
  committee: "AJK",
};

export const ROLE_HINT: Record<Role, string> = {
  org_admin: "Urus pengguna, peranan dan tetapan sistem",
  chairman: "Pegawai Pengawal: luluskan bayaran dan sahkan penyata",
  treasurer: "Pegawai Kewangan: rekod kutipan, resit, baucer",
  secretary: "Urus minit mesyuarat dan profil masjid",
  auditor: "Semak rekod kewangan (baca sahaja)",
  committee: "Ahli jawatankuasa: lihat maklumat asas",
};

export const ORG_TYPE_LABEL: Record<string, string> = {
  masjid: "Masjid",
  masjid_diwartakan: "Masjid diwartakan",
  surau: "Surau",
  surau_jumaat: "Surau Jumaat",
  musolla: "Musolla",
};

const has = (mine: Role[], allowed: Role[]) => mine.some((r) => allowed.includes(r));
export const can = {
  editProfile: (r: Role[]) => has(r, ["org_admin", "chairman", "secretary"]),
  manageMembers: (r: Role[]) => has(r, ["org_admin", "chairman"]),
  appointAdmin: (r: Role[]) => has(r, ["org_admin"]),
  viewBank: (r: Role[]) => has(r, ["org_admin", "chairman", "treasurer", "auditor"]),
  manageBank: (r: Role[]) => has(r, ["org_admin", "treasurer"]),
  deleteBank: (r: Role[]) => has(r, ["org_admin"]),
  viewAudit: (r: Role[]) => has(r, ["org_admin", "chairman", "auditor"]),
};

export function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "masjid";
}
