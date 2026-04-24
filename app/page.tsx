"use client";

import { useState, useRef } from "react";

type Extraction = {
  patient_name?: string;
  date_of_birth?: string;
  visit_date?: string;
  diagnoses?: { code: string; description: string }[];
  medications?: { name: string; dosage: string; frequency: string }[];
  allergies?: string[];
  lab_results?: { test: string; value: string; unit: string; reference_range: string }[];
  attending_physician?: string;
  facility?: string;
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"fhir" | "deidentified">("fhir");
  const [result, setResult] = useState<Extraction | null>(null);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleExtract() {
    if (!file) return;
    setProcessing(true);
    setResult(null);
    const form = new FormData();
    form.append("file", file);
    form.append("mode", mode);
    const res = await fetch("/api/extract", { method: "POST", body: form });
    const data = await res.json();
    setResult(data.extraction);
    setProcessing(false);
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-1">🏥 Medical Record Extractor</h1>
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 mb-6">
        🔒 <strong>Privacy first:</strong> All processing happens locally on this server. No patient data is sent to external services.
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Output mode</label>
          <div className="flex gap-4">
            {(["fhir", "deidentified"] as const).map((m) => (
              <label key={m} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value={m} checked={mode === m} onChange={() => setMode(m)} />
                <span className="text-sm">{m === "fhir" ? "FHIR R4 JSON" : "De-identified (for research)"}</span>
              </label>
            ))}
          </div>
        </div>

        <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button
          onClick={() => inputRef.current?.click()}
          className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 mr-3"
        >
          {file ? `📄 ${file.name}` : "Select Record PDF"}
        </button>
        <button
          onClick={handleExtract}
          disabled={!file || processing}
          className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {processing ? "Extracting..." : "Extract Data"}
        </button>
      </div>

      {result && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="text-lg font-semibold">Extracted Data</h2>
          {result.patient_name && <Row label="Patient" value={mode === "deidentified" ? "[REDACTED]" : result.patient_name} />}
          {result.date_of_birth && <Row label="Date of Birth" value={mode === "deidentified" ? "[REDACTED]" : result.date_of_birth} />}
          {result.visit_date && <Row label="Visit Date" value={result.visit_date} />}
          {result.attending_physician && <Row label="Physician" value={result.attending_physician} />}
          {result.facility && <Row label="Facility" value={result.facility} />}

          {result.diagnoses?.length ? (
            <Section title="Diagnoses">
              {result.diagnoses.map((d, i) => (
                <div key={i} className="text-sm"><span className="font-mono text-indigo-600">{d.code}</span> — {d.description}</div>
              ))}
            </Section>
          ) : null}

          {result.medications?.length ? (
            <Section title="Medications">
              {result.medications.map((m, i) => (
                <div key={i} className="text-sm">{m.name} — {m.dosage} {m.frequency}</div>
              ))}
            </Section>
          ) : null}

          {result.allergies?.length ? (
            <Section title="Allergies">
              <div className="flex flex-wrap gap-2">{result.allergies.map((a, i) => (
                <span key={i} className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">{a}</span>
              ))}</div>
            </Section>
          ) : null}

          {result.lab_results?.length ? (
            <Section title="Lab Results">
              <table className="text-sm w-full border-collapse">
                <thead><tr className="text-left text-gray-500 text-xs border-b border-gray-200">
                  <th className="pb-1 pr-4">Test</th><th className="pb-1 pr-4">Value</th><th className="pb-1">Reference</th>
                </tr></thead>
                <tbody>{result.lab_results.map((l, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-1 pr-4 font-medium">{l.test}</td>
                    <td className="py-1 pr-4">{l.value} {l.unit}</td>
                    <td className="py-1 text-gray-500">{l.reference_range}</td>
                  </tr>
                ))}</tbody>
              </table>
            </Section>
          ) : null}
        </div>
      )}
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="font-medium text-gray-600 w-32 shrink-0">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
