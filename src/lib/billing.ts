/** Butiran penerbit invois (Fathi Global). Diisi melalui tetapan persekitaran di Vercel, bukan dalam kod. */
export const BILLER = {
  name: process.env.BILLING_NAME || "Fathi Global",
  reg: process.env.BILLING_REG_NO || "",
  address: process.env.BILLING_ADDRESS || "",
  email: process.env.BILLING_EMAIL || "",
  phone: process.env.BILLING_PHONE || "",
  bank: process.env.BILLING_BANK_NAME || "",
  account: process.env.BILLING_BANK_ACCOUNT || "",
  accountName: process.env.BILLING_BANK_ACCOUNT_NAME || process.env.BILLING_NAME || "Fathi Global",
};
export const hasBank = () => !!(BILLER.bank && BILLER.account);
