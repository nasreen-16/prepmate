/**
 * Client-side text extraction for resume uploads. Keeps parsing out of the
 * server (worker runtime) while the file itself is stored privately and the
 * analysis runs server-side.
 */

const MAX_CHARS = 15000;

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&amp;/g, "&");
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages = Math.min(doc.numPages, 15);
  const chunks: string[] = [];
  for (let i = 1; i <= pages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    chunks.push(
      content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    );
  }
  return chunks.join("\n\n");
}

async function extractDocx(file: File): Promise<string> {
  const { unzipSync, strFromU8 } = await import("fflate");
  const zip = unzipSync(new Uint8Array(await file.arrayBuffer()));
  const xml = zip["word/document.xml"];
  if (!xml) throw new Error("This DOCX file doesn't contain readable text.");
  const raw = strFromU8(xml);
  return decodeXmlEntities(
    raw
      .replace(/<w:p[ >]/g, "\n<w:p ")
      .replace(/<[^>]+>/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n"),
  ).trim();
}

export function validateResumeFile(file: File): string | null {
  const okTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  const okNames = /\.(pdf|docx)$/i;
  if (!okTypes.includes(file.type) && !okNames.test(file.name)) {
    return "Only PDF and DOCX resumes are supported.";
  }
  if (file.size > 10 * 1024 * 1024) return "Resume must be 10 MB or smaller.";
  if (file.size === 0) return "The file is empty.";
  return null;
}

export async function extractResumeText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  let text: string;
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    text = await extractPdf(file);
  } else {
    text = await extractDocx(file);
  }
  text = text.replace(/\n{3,}/g, "\n\n").trim();
  if (text.length < 80) {
    throw new Error("We couldn't read enough text from this file. Is it a text-based resume (not a scanned image)?");
  }
  return text.slice(0, MAX_CHARS);
}
