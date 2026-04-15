# File Storage

Track Your Time uses [Uploadthing](https://uploadthing.com/) (free tier — 2 GB) to store expense receipt files. All files are stored as PDFs; uploaded images are automatically converted before storage.

## Setup

1. Create an account at [uploadthing.com](https://uploadthing.com/sign-in).
2. Copy the **token** from the [dashboard](https://uploadthing.com/dashboard).
3. Add it to your `.env`:

```env
UPLOADTHING_TOKEN="your-uploadthing-token"
```

No other configuration is needed — the SDK reads the token from the environment automatically.

## Architecture

```
Browser (file input)
  └─► POST /api/expenses/upload   (FormData with a single file)
        ├─ Auth check (Better Auth session)
        ├─ Validate type (JPG, PNG, PDF) and size (≤ 8 MB)
        ├─ If image → convert to PDF (pdf-lib)
        └─ Upload PDF to Uploadthing via UTApi
              └─► Returns { fileUrl, fileKey, fileName }
```

### Key files

| File | Purpose |
|---|---|
| `lib/uploadthing.ts` | Exports a shared `UTApi` singleton used by server-side code |
| `app/api/uploadthing/core.ts` | Uploadthing file router definition (auth middleware, allowed types) |
| `app/api/uploadthing/route.ts` | Next.js route handler that exposes the file router |
| `app/api/expenses/upload/route.ts` | Custom upload endpoint with image-to-PDF conversion |

### Database fields

The `Expense` model stores file metadata (not the file itself):

| Field | Type | Description |
|---|---|---|
| `fileUrl` | `String?` | Public URL of the uploaded file on Uploadthing |
| `fileKey` | `String?` | Uploadthing file key, used for deletion |
| `fileName` | `String?` | Display name shown in the UI |

## Image-to-PDF conversion

When a user uploads a JPG or PNG image, the server converts it to a single-page PDF before uploading to Uploadthing. This ensures all stored files are in a uniform PDF format.

### How it works

The conversion is implemented in `app/api/expenses/upload/route.ts` using the [`pdf-lib`](https://pdf-lib.js.org/) library:

1. **Read** the uploaded image bytes from the `FormData`.
2. **Create** a new empty PDF document with `PDFDocument.create()`.
3. **Embed** the image using `embedPng()` or `embedJpg()` depending on the MIME type.
4. **Scale** the image to fit within A4 bounds (595 × 842 points) while preserving the aspect ratio using `scaleToFit()`.
5. **Add a page** sized to the scaled image dimensions and draw the image at full size.
6. **Save** the PDF bytes and pass them to Uploadthing's `UTApi.uploadFiles()`.

```typescript
// Simplified flow
const pdf = await PDFDocument.create();
const image = await pdf.embedPng(imageBytes); // or embedJpg()
const { width, height } = image.scaleToFit(595, 842);

const page = pdf.addPage([width, height]);
page.drawImage(image, { x: 0, y: 0, width, height });

const pdfBytes = await pdf.save();
```

### Supported formats

| Input format | Stored as |
|---|---|
| JPEG / JPG | PDF (converted) |
| PNG | PDF (converted) |
| PDF | PDF (passed through) |

### Size limits

- Maximum file size: **8 MB** (enforced server-side before upload)
- Uploadthing free tier: **2 GB** total storage

## File lifecycle

| Event | What happens |
|---|---|
| **Create expense** with file | File uploaded to Uploadthing; `fileUrl`, `fileKey`, `fileName` saved on the expense |
| **Edit expense** — replace file | New file uploaded; old file deleted from Uploadthing via `UTApi.deleteFiles()` |
| **Edit expense** — remove file | File deleted from Uploadthing; fields set to `null` |
| **Delete expense** | File deleted from Uploadthing before the database record is removed |

## API reference

### Upload a file

```
POST /api/expenses/upload
Content-Type: multipart/form-data
```

**Form fields**

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | `File` | Yes | The file to upload (JPG, PNG, or PDF, max 8 MB) |

**Response `200`**
```json
{
  "fileUrl": "https://ufs.sh/f/abc123...",
  "fileKey": "abc123...",
  "fileName": "receipt.pdf"
}
```

**Error responses**

| Status | Condition |
|---|---|
| `400` | No file, unsupported type, or exceeds 8 MB |
| `401` | Not authenticated |
| `500` | Uploadthing upload failed |

The returned `fileUrl`, `fileKey`, and `fileName` are then passed alongside the other expense fields when creating or updating an expense via `POST /api/expenses` or `PATCH /api/expenses/:id`.
