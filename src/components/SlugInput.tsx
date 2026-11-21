"use client";
import { useState } from "react";
import { slugify } from "@/lib/roles";

/** Nama masjid + alamat ringkas (slug) yang dijana automatik tetapi boleh diubah. */
export function NameSlugFields() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [touched, setTouched] = useState(false);
  return (
    <>
      <label className="field">Nama masjid / surau
        <input className="input" name="name" required minLength={3} maxLength={150} value={name}
          placeholder="cth. Masjid Al-Hidayah Taman Sri Kajang"
          onChange={(e) => { setName(e.target.value); if (!touched) setSlug(slugify(e.target.value)); }} />
      </label>
      <label className="field">Alamat ringkas sistem
        <input className="input" name="slug" required pattern="[a-z0-9][a-z0-9-]{1,48}[a-z0-9]" value={slug}
          onChange={(e) => { setTouched(true); setSlug(slugify(e.target.value)); }} />
        <small>masjid360.my/o/{slug || "nama-masjid"} — huruf kecil, nombor dan sengkang sahaja</small>
      </label>
    </>
  );
}
