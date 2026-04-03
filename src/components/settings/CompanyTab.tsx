import React, { useRef, useState } from "react";
import { Upload, X, Building2, AlertTriangle } from "lucide-react";
import { ClientProfile, COMPANY_SIZES, INDUSTRIES } from "../../types/settings";
import { SField, inputCls, SaveRow } from "./AccountTab";
import api from "../../services/api";
import { cn } from "../../lib/utils";

interface CompanyTabProps { profile: ClientProfile; uid: string; onUpdated: (p: ClientProfile) => void; }

const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg","image/png","image/webp","image/svg+xml"];

export const CompanyTab: React.FC<CompanyTabProps> = ({ profile, uid, onUpdated }) => {
  const [form, setForm] = useState({
    companyName: profile.companyName, companyWebsite: profile.companyWebsite,
    companySize: profile.companySize, industry: profile.industry,
    companyDescription: profile.companyDescription,
  });
  const [logoPreview, setLogoPreview] = useState<string>(profile.logoUrl);
  const [logoFile, setLogoFile]       = useState<File | null>(null);
  const [logoError, setLogoError]     = useState("");
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [error, setError]             = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof form, v: string) => { setForm(p => ({ ...p, [k]: v })); setSaved(false); };

  const onFile = (file: File) => {
    setLogoError("");
    if (!ALLOWED_TYPES.includes(file.type)) { setLogoError("Unsupported format. Use JPG, PNG, WebP or SVG."); return; }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) { setLogoError(`File too large. Max ${MAX_SIZE_MB}MB.`); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  const save = async () => {
    setSaving(true); setError(""); setSaved(false);
    try {
      const logoUrl = logoFile ? logoPreview : profile.logoUrl;
      const res = await api.put<{ data: ClientProfile }>(`/api/clients/${uid}`, { ...form, logoUrl });
      onUpdated(res.data.data); setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { setError("Failed to save. Please try again."); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-base font-bold text-textPrimary">Company Information</h3>
        <p className="text-xs text-textMuted mt-0.5">This information is shown to freelancers when they review your projects.</p>
      </div>

      {/* Logo upload */}
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-textDisabled">Company Logo</p>
        <div
          className={cn("group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 transition-all cursor-pointer",
            logoError ? "border-error/40 bg-error/5" : "border-border hover:border-accent/40 hover:bg-accent/5")}
          onClick={() => fileRef.current?.click()}
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
        >
          {logoPreview ? (
            <div className="relative">
              <img src={logoPreview} alt="Logo preview" className="h-20 w-20 rounded-xl object-cover border border-border" />
              <button onClick={(e) => { e.stopPropagation(); setLogoPreview(""); setLogoFile(null); }}
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-error text-white">
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10"><Building2 className="h-6 w-6 text-accent" /></div>
              <div className="text-center">
                <p className="text-sm font-bold text-textPrimary">Drop logo here or <span className="text-accent">browse</span></p>
                <p className="text-xs text-textDisabled mt-0.5">JPG, PNG, WebP or SVG · Max {MAX_SIZE_MB}MB</p>
              </div>
            </>
          )}
          <input ref={fileRef} type="file" accept={ALLOWED_TYPES.join(",")} className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
        </div>
        {logoError && <p className="flex items-center gap-1.5 text-xs text-error"><AlertTriangle className="h-3.5 w-3.5" />{logoError}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <SField label="Company Name" id="co-name" required>
          <input id="co-name" value={form.companyName} onChange={e => set("companyName", e.target.value)}
            placeholder="Acme Corp." className={inputCls()} />
        </SField>

        <SField label="Company Website" id="co-website">
          <input id="co-website" type="url" value={form.companyWebsite} onChange={e => set("companyWebsite", e.target.value)}
            placeholder="https://acme.com" className={inputCls()} />
        </SField>

        <SField label="Company Size" id="co-size">
          <select id="co-size" value={form.companySize} onChange={e => set("companySize", e.target.value)} className={inputCls()}>
            <option value="">Select size…</option>
            {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
          </select>
        </SField>

        <SField label="Industry" id="co-industry">
          <select id="co-industry" value={form.industry} onChange={e => set("industry", e.target.value)} className={inputCls()}>
            <option value="">Select industry…</option>
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </SField>
      </div>

      <SField label="Company Description" id="co-desc">
        <textarea id="co-desc" rows={4} value={form.companyDescription}
          onChange={e => set("companyDescription", e.target.value)}
          placeholder="Describe your company, what you do, and what kind of freelancers you're looking for…"
          className={cn(inputCls(), "resize-none")} />
      </SField>

      <SaveRow saving={saving} saved={saved} onSave={save} error={error} />
    </div>
  );
};
