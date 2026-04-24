# LiteParse — Local Medical Record Extractor (HIPAA-safe)

A fully local, HIPAA-friendly pipeline for extracting structured clinical data from patient records, lab reports, and discharge summaries. No PHI leaves the premises.

## What it does
- Extracts: diagnoses (ICD-10), medications, allergies, lab values, visit dates
- Handles scanned records via built-in Tesseract.js OCR — no cloud OCR
- PII redaction mode for research / de-identified output
- FHIR R4 structured JSON output for EHR integration
- Audit trail: every extraction logged with timestamp and document hash

## Stack
- **Parser:** LiteParse (local, TS — Tesseract.js OCR)
- **Orchestration:** LlamaIndex.TS
- **LLM:** Local Ollama (zero external API calls) or Claude API
- **Vector store:** LanceDB (local, encrypted)
- **Output:** FHIR R4 JSON or de-identified CSV

## Quickstart

```bash
npm install
cp .env.example .env   # optional: ANTHROPIC_API_KEY (or use Ollama)
npx ts-node src/index.ts --input ./records/ --output fhir
```

## Project structure
```
.
├── src/
│   ├── index.ts         # CLI entry point
│   ├── extractor.ts     # Clinical NLP extraction agent
│   ├── fhir.ts          # FHIR R4 JSON builder
│   ├── redactor.ts      # PII redaction for research mode
│   └── audit.ts         # Extraction audit logger
├── records/             # Input medical record PDFs
├── package.json
├── tsconfig.json
└── .env.example
```

> **Note:** Always validate HIPAA compliance with your legal team before deploying in a clinical environment.
