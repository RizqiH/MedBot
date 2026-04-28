const HF_API_URL =
  "https://router.huggingface.co/hf-inference/models/BAAI/bge-m3/pipeline/feature-extraction";

function isNumberArray(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.every((v) => typeof v === "number" && Number.isFinite(v))
  );
}

function isNumberArrayArray(value: unknown): value is number[][] {
  return Array.isArray(value) && value.every((v) => isNumberArray(v));
}

function meanPool(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];
  const dim = vectors[0]?.length ?? 0;
  if (dim === 0) return [];
  const sum = new Array<number>(dim).fill(0);
  for (const vec of vectors) {
    if (vec.length !== dim) return [];
    for (let i = 0; i < dim; i++) sum[i] += vec[i]!;
  }
  for (let i = 0; i < dim; i++) sum[i] /= vectors.length;
  return sum;
}

function l2Normalize(vec: number[]): number[] {
  let s = 0;
  for (const v of vec) s += v * v;
  const norm = Math.sqrt(s);
  if (!Number.isFinite(norm) || norm === 0) return vec;
  return vec.map((v) => v / norm);
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error("Missing HUGGINGFACE_API_KEY");

  const payload = JSON.stringify({
    inputs: text.replace(/\n/g, " "),
  });

  const response = await fetch(HF_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-wait-for-model": "true",
    },
    body: payload,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Hugging Face API error: ${response.status} ${errorText}`);
  }

  const result: unknown = await response.json();

  if (isNumberArray(result)) return l2Normalize(result);

  if (isNumberArrayArray(result)) {
    const pooled = meanPool(result);
    if (pooled.length > 0) return l2Normalize(pooled);
  }

  throw new Error("Unexpected embedding response shape from Hugging Face");
}

