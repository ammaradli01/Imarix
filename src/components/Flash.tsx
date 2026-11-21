export function Flash({ ok, err }: { ok?: string; err?: string }) {
  if (!ok && !err) return null;
  return <div role="status" className={`alert ${err ? "alert-err" : "alert-ok"}`}>{err ?? ok}</div>;
}
