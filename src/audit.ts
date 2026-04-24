import * as fs from "fs";
import * as crypto from "crypto";

const AUDIT_LOG = "./audit.log";

export function logExtraction(filePath: string, outputMode: string): void {
  const hash = crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
  const entry = {
    timestamp: new Date().toISOString(),
    file: filePath,
    sha256: hash,
    outputMode,
    environment: "local",
  };
  fs.appendFileSync(AUDIT_LOG, JSON.stringify(entry) + "\n");
}
