import "dotenv/config";

import path from "node:path";
import { pathToFileURL } from "node:url";

import { chromium } from "playwright";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeUrl(href: string, base: string): string | null {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function normalizeDetailPath(href: string, baseUrl: string): string | null {
  try {
    const url = new URL(href, baseUrl);
    if (!url.pathname.startsWith("/documents/")) return null;
    if (url.pathname === "/documents") return null;

    const pathOnly = `${url.pathname}${url.search}`;
    return pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;
  } catch {
    return null;
  }
}

async function fetchPdfBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    headers: {
      "user-agent":
        "MedBotINA-JDIHFetcher/1.0 (+local dev; contact: maintainer)",
      accept: "application/pdf,*/*",
    },
  });

  if (!res.ok) {
    throw new Error(`PDF download failed (${res.status}) for ${url}`);
  }

  const ct = res.headers.get("content-type") ?? "";
  const buf = Buffer.from(await res.arrayBuffer());
  if (!ct.includes("pdf") && !buf.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
    throw new Error(`Not a PDF response from ${url} (content-type=${ct})`);
  }

  return buf;
}

function resolvePdfUrlFromBrowserLocation(pageHref: string): string | null {
  try {
    const docUrl = new URL(pageHref);
    const iframeSrc = docUrl.searchParams.get("iframe") ?? "";
    const viewerMarker = "/pdfjs/web/viewer.html";
    const viewerIdx = iframeSrc.indexOf(viewerMarker);
    if (viewerIdx === -1) return null;

    const qs = iframeSrc.slice(viewerIdx + viewerMarker.length);
    const viewerParams = new URLSearchParams(qs.startsWith("?") ? qs.slice(1) : qs);
    const file = viewerParams.get("file");
    if (!file) return null;

    return decodeURIComponent(file);
  } catch {
    return null;
  }
}

async function ingestChunked(args: {
  ingestUrl: string;
  ingestSecret: string;
  source: string;
  text: string;
  maxCharsPerRequest: number;
}): Promise<number> {
  const { ingestUrl, ingestSecret, source, text, maxCharsPerRequest } = args;

  let insertedTotal = 0;
  for (let i = 0; i < text.length; i += maxCharsPerRequest) {
    const chunk = text.slice(i, i + maxCharsPerRequest);
    const res = await fetch(ingestUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-ingest-secret": ingestSecret,
      },
      body: JSON.stringify({ text: chunk, source }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `Ingest failed (${res.status}) for ${source}: ${body || "unknown error"}`
      );
    }

    const json = (await res.json()) as { inserted?: unknown };
    const inserted =
      typeof json.inserted === "number" ? json.inserted : undefined;
    insertedTotal += inserted ?? 0;
  }

  return insertedTotal;
}

async function extractPdfText(args: {
  pdfBuffer: Buffer;
  standardFontDataUrl: string;
}): Promise<string> {
  const { pdfBuffer, standardFontDataUrl } = args;

  const data = new Uint8Array(pdfBuffer);
  const pdf = await getDocument({ data, standardFontDataUrl }).promise;

  const parts: string[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (pageText) parts.push(pageText);
  }

  return parts.join("\n\n").trim();
}

async function main() {
  const ingestUrl = process.env.INGEST_URL ?? "http://localhost:3000/api/ingest";
  const ingestSecret = process.env.INGEST_SECRET;
  if (!ingestSecret) {
    throw new Error("Missing INGEST_SECRET");
  }

  const startUrl =
    process.env.SCRAPE_START_URL ?? "https://jdih.kemkes.go.id/documents";
  const maxPages = Math.max(1, envInt("SCRAPE_MAX_PAGES", 1));
  const maxDocs = Math.max(1, envInt("SCRAPE_MAX_DOCS", 3));
  const delayMs = Math.max(0, envInt("SCRAPE_DELAY_MS", 1200));
  const maxCharsPerRequest = Math.max(
    20_000,
    envInt("INGEST_MAX_CHARS_PER_REQUEST", 120_000)
  );

  GlobalWorkerOptions.workerSrc = pathToFileURL(
    path.join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs")
  ).toString();

  const standardFontDataUrl = pathToFileURL(
    path.join(process.cwd(), "node_modules/pdfjs-dist/standard_fonts/")
  ).toString();

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      userAgent:
        "MedBotINA-JDIHFetcher/1.0 (+local dev; contact: maintainer)",
      locale: "id-ID",
    });

    const page = await context.newPage();
    await page.goto(startUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await page.waitForTimeout(Math.min(5000, Math.max(delayMs, 1000)));

    const detailPaths = new Set<string>();

    for (let pageIndex = 0; pageIndex < maxPages; pageIndex++) {
      await page.waitForTimeout(delayMs);

      const hrefs = await page.$$eval("a[href]", (anchors) =>
        anchors
          .map((a) => a.getAttribute("href"))
          .filter((href): href is string => typeof href === "string")
      );

      for (const href of hrefs) {
        const pathOnly = normalizeDetailPath(href, page.url());
        if (!pathOnly) continue;
        detailPaths.add(pathOnly);
      }

      if (detailPaths.size >= maxDocs) break;

      const next = page.locator(
        'a[rel="next"], button:has-text("Berikutnya"), button:has-text("Selanjutnya")'
      );
      if ((await next.count()) === 0) break;
      const first = next.first();
      const enabled = await first.isEnabled().catch(() => false);
      if (!enabled) break;

      await first.click({ timeout: 60_000 });
      await page.waitForLoadState("domcontentloaded", { timeout: 120_000 });
      await page.waitForTimeout(Math.min(5000, Math.max(delayMs, 1000)));
    }

    const selected = Array.from(detailPaths).slice(0, maxDocs);
    if (selected.length === 0) {
      throw new Error(
        "No /documents/* detail links found. The page structure may have changed."
      );
    }

    let grandTotalInserted = 0;

    for (const path of selected) {
      const url = normalizeUrl(path, startUrl);
      if (!url) continue;

      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120_000 });
      await page.waitForTimeout(delayMs);

      const title = await page.title();
      const pdfHref = await page.evaluate((pageHref: string) => {
        const extractPdfHrefFromDetailPageInner = (pageUrl: string) => {
          try {
            const docUrl = new URL(pageUrl);

            const iframeSrc = docUrl.searchParams.get("iframe") ?? "";
            const viewerMarker = "/pdfjs/web/viewer.html";
            const viewerIdx = iframeSrc.indexOf(viewerMarker);
            if (viewerIdx !== -1) {
              const qs = iframeSrc.slice(viewerIdx + viewerMarker.length);
              const viewerParams = new URLSearchParams(qs.startsWith("?") ? qs.slice(1) : qs);
              const file = viewerParams.get("file");
              if (file) return file;
            }

            const anchors = Array.from(document.querySelectorAll("iframe[src], a[href]"));
            for (const el of anchors) {
              const raw = el.getAttribute("src") ?? el.getAttribute("href") ?? "";
              if (!raw) continue;

              if (raw.includes("/pdfjs/web/viewer.html")) {
                const u = new URL(raw, pageUrl);
                const file = u.searchParams.get("file");
                if (file) return file;
              }

              const lower = raw.toLowerCase();
              if (lower.includes("/storage/documents/pdfs/") && lower.includes(".pdf")) {
                return raw;
              }
              if (lower.endsWith(".pdf")) {
                return raw;
              }
            }

            return null;
          } catch {
            return null;
          }
        };

        return extractPdfHrefFromDetailPageInner(pageHref);
      }, url);

      let resolvedHref = pdfHref;
      if (!resolvedHref) {
        resolvedHref = resolvePdfUrlFromBrowserLocation(page.url()) ?? "";
      }

      if (!resolvedHref) {
        throw new Error(`Could not find a PDF reference on ${url}`);
      }

      let pdfUrl = normalizeUrl(resolvedHref, url);
      try {
        const maybeDecoded = decodeURIComponent(resolvedHref);
        const normalizedDecoded = normalizeUrl(maybeDecoded, url);
        if (
          normalizedDecoded &&
          normalizedDecoded.toLowerCase().includes(".pdf")
        ) {
          pdfUrl = normalizedDecoded;
        }
      } catch {
        // ignore
      }

      if (!pdfUrl) {
        throw new Error(`Could not normalize PDF URL from ${resolvedHref}`);
      }

      const pdfBuf = await fetchPdfBuffer(pdfUrl);
      const text = await extractPdfText({ pdfBuffer: pdfBuf, standardFontDataUrl });
      if (!text) {
        throw new Error(`Empty PDF text for ${pdfUrl}`);
      }

      const source = `${title} | ${url} | ${pdfUrl}`;

      const inserted = await ingestChunked({
        ingestUrl,
        ingestSecret,
        source,
        text,
        maxCharsPerRequest,
      });
      grandTotalInserted += inserted;

      console.log(
        JSON.stringify(
          {
            ok: true,
            path,
            url,
            pdfUrl,
            inserted,
          },
          null,
          2
        )
      );
    }

    console.log(
      JSON.stringify(
        { ok: true, docs: selected.length, insertedRows: grandTotalInserted },
        null,
        2
      )
    );
  } finally {
    await browser.close();
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(JSON.stringify({ ok: false, error: message }, null, 2));
  process.exitCode = 1;
});
