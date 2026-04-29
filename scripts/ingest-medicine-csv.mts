import "dotenv/config";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";

const INGEST_URL = process.env.INGEST_URL ?? "http://localhost:3000/api/ingest";
const INGEST_SECRET = process.env.INGEST_SECRET;
if (!INGEST_SECRET) throw new Error("Missing INGEST_SECRET");

const BATCH_SIZE = 20;
const DELAY_MS = 2000;
const MAX_RETRIES = 3;

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function buildMedicineText(fields: string[]): string {
  const [name, composition, uses, sideEffects, , manufacturer] = fields;
  if (!name || !composition) return "";

  const parts: string[] = [
    `Nama Obat: ${name}`,
    `Komposisi: ${composition}`,
  ];

  if (uses) parts.push(`Kegunaan: ${uses}`);
  if (sideEffects) parts.push(`Efek Samping: ${sideEffects}`);
  if (manufacturer) parts.push(`Produsen: ${manufacturer}`);

  return parts.join("\n");
}

async function ingest(text: string, source: string): Promise<number> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(INGEST_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-ingest-secret": INGEST_SECRET!,
        },
        body: JSON.stringify({ text, source }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Ingest failed (${res.status}): ${body}`);
      }

      const json = (await res.json()) as { inserted?: number };
      return json.inserted ?? 0;
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      const waitMs = attempt * 3000;
      console.log(`  Retry ${attempt}/${MAX_RETRIES} in ${waitMs / 1000}s...`);
      await sleep(waitMs);
    }
  }
  return 0;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const csvPath = process.argv[2] ?? "Medicine_Details.csv";

  const rl = createInterface({
    input: createReadStream(csvPath, "utf-8"),
    crlfDelay: Infinity,
  });

  const medicines: string[] = [];
  let isHeader = true;

  for await (const line of rl) {
    if (isHeader) {
      isHeader = false;
      continue;
    }
    const fields = parseCsvLine(line);
    const text = buildMedicineText(fields);
    if (text) medicines.push(text);
  }

  console.log(`Parsed ${medicines.length} medicines from CSV`);

  let totalInserted = 0;

  for (let i = 0; i < medicines.length; i += BATCH_SIZE) {
    const batch = medicines.slice(i, i + BATCH_SIZE);
    const batchText = batch.join("\n\n---\n\n");
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const source = `medicine-database-batch-${batchNum}`;

    try {
      const inserted = await ingest(batchText, source);
      totalInserted += inserted;
      console.log(
        `Batch ${batchNum}: ${batch.length} medicines -> ${inserted} chunks inserted`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Batch ${batchNum} failed: ${msg}`);
    }

    if (i + BATCH_SIZE < medicines.length) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`Done. Total chunks inserted: ${totalInserted}`);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`Fatal: ${message}`);
  process.exitCode = 1;
});
