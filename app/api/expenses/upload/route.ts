import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { utapi } from "@/lib/uploadthing";
import { PDFDocument } from "pdf-lib";
import { UTFile } from "uploadthing/server";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/jpg"];
const ALLOWED_TYPES = [...IMAGE_TYPES, "application/pdf"];
const MAX_SIZE = 8 * 1024 * 1024; // 8MB

async function imageToPdf(
  imageBytes: Uint8Array,
  mimeType: string
): Promise<ArrayBuffer> {
  const pdf = await PDFDocument.create();

  const embed =
    mimeType === "image/png"
      ? pdf.embedPng(imageBytes)
      : pdf.embedJpg(imageBytes);

  const image = await embed;
  const { width, height } = image.scaleToFit(595, 842); // A4 bounds

  const page = pdf.addPage([width, height]);
  page.drawImage(image, { x: 0, y: 0, width, height });

  const bytes = await pdf.save();
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPG, PNG and PDF files are allowed" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File must be smaller than 8MB" },
      { status: 400 }
    );
  }

  const originalName = file.name.replace(/\.[^.]+$/, "");
  let fileToUpload: UTFile;

  if (IMAGE_TYPES.includes(file.type)) {
    const imageBytes = new Uint8Array(await file.arrayBuffer());
    const pdfArrayBuffer = await imageToPdf(imageBytes, file.type);
    fileToUpload = new UTFile([pdfArrayBuffer], `${originalName}.pdf`, {
      type: "application/pdf",
    });
  } else {
    const arrayBuffer = await file.arrayBuffer();
    fileToUpload = new UTFile([arrayBuffer], file.name, {
      type: "application/pdf",
    });
  }

  const uploaded = await utapi.uploadFiles(fileToUpload);

  if (uploaded.error) {
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    fileUrl: uploaded.data.ufsUrl,
    fileKey: uploaded.data.key,
    fileName: fileToUpload.name,
  });
}
