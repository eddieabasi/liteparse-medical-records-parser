import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { LiteParse } from "liteparse";
import Anthropic from "@anthropic-ai/sdk";

const parser = new LiteParse({ ocr: true });
const anthropic = new Anthropic();

const PROMPT = `Extract the following clinical information from this medical record. Return valid JSON only.
Fields: patient_name, date_of_birth, visit_date, diagnoses (array of {code, description}),
medications (array of {name, dosage, frequency}), allergies (array of strings),
lab_results (array of {test, value, unit, reference_range}), attending_physician, facility.
Omit fields that are not present in the record.`;

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File;
  const mode = (form.get("mode") as string) ?? "fhir";

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  mkdirSync("/tmp/medrecs", { recursive: true });
  const path = join("/tmp/medrecs", file.name);
  writeFileSync(path, Buffer.from(await file.arrayBuffer()));

  const result = await parser.parseFile(path);

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [{ role: "user", content: `${PROMPT}\n\nRecord:\n${result.text.slice(0, 8000)}` }],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "{}";
  const extraction = JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim());

  if (mode === "deidentified") {
    delete extraction.patient_name;
    delete extraction.date_of_birth;
    delete extraction.attending_physician;
  }

  return NextResponse.json({ extraction });
}
