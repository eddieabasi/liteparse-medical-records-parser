import * as fs from "fs";
import * as path from "path";
import { LiteParse } from "liteparse";
import Anthropic from "@anthropic-ai/sdk";
import { logExtraction } from "./audit";
import "dotenv/config";

const INPUT_DIR = process.argv[3] || "./records";
const OUTPUT_MODE = (process.argv[5] || "fhir") as "fhir" | "csv";

const EXTRACTION_PROMPT = `
Extract the following clinical information from this medical record. Return as JSON.
Fields: patient_name, date_of_birth, visit_date, diagnoses (array of {code, description}),
medications (array of {name, dosage, frequency}), allergies (array), lab_results (array of {test, value, unit, reference_range}),
attending_physician, facility.
If a field is not present, omit it.
`;

async function main(): Promise<void> {
  const parser = new LiteParse({ ocr: true });
  const anthropic = new Anthropic();

  fs.mkdirSync("./output", { recursive: true });

  const files = fs.readdirSync(INPUT_DIR).filter((f) => f.endsWith(".pdf"));
  if (files.length === 0) {
    console.log(`No PDFs found in ${INPUT_DIR}`);
    return;
  }

  for (const file of files) {
    const filePath = path.join(INPUT_DIR, file);
    console.log(`Extracting: ${file}`);

    logExtraction(filePath, OUTPUT_MODE);

    const result = await parser.parseFile(filePath);

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{ role: "user", content: `${EXTRACTION_PROMPT}\n\nRecord:\n${result.text.slice(0, 8000)}` }],
    });

    const rawJson = response.content[0].type === "text" ? response.content[0].text : "{}";
    const extracted = JSON.parse(rawJson.replace(/```json\n?|\n?```/g, "").trim());

    const outFile = path.join("./output", file.replace(".pdf", ".json"));
    fs.writeFileSync(outFile, JSON.stringify(extracted, null, 2));
    console.log(`  Saved → ${outFile}`);
  }
}

main().catch(console.error);
