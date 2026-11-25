"use client";
export function PrintButton() {
  return <button className="btn btn-pri btn-sm" type="button" onClick={() => window.print()}>Cetak / Simpan PDF</button>;
}
