import { supabase } from "../lib/supabaseClient";

const BUCKET_NAME = "scanify-documents";
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60;

export type CloudUploadResult = {
  path: string;
  fileName: string;
};

export type CloudDocument = {
  name: string;
  path: string;

  size: number;
  mimeType: string;

  createdAt: string | null;
  updatedAt: string | null;

  signedUrl: string;
};

// =========================
// GET CURRENT USER
// =========================

async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  if (!user) {
    throw new Error(
      "You must be logged in to access cloud documents."
    );
  }

  return user;
}

// =========================
// UPLOAD DOCUMENT
// =========================

export async function uploadDocumentToCloud(
  file: File
): Promise<CloudUploadResult> {
  const user = await getCurrentUser();

  const safeFileName = file.name.replace(
    /[^a-zA-Z0-9._-]/g,
    "_"
  );

  const uniqueFileName =
    `${Date.now()}-${safeFileName}`;

  const filePath =
    `${user.id}/${uniqueFileName}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType:
        file.type || "application/octet-stream",
    });

  if (error) {
    throw new Error(error.message);
  }

  return {
    path: filePath,
    fileName: uniqueFileName,
  };
}

// =========================
// LIST USER DOCUMENTS
// =========================

export async function listCloudDocuments():
  Promise<CloudDocument[]> {
  const user = await getCurrentUser();

  const { data: files, error } =
    await supabase.storage
      .from(BUCKET_NAME)
      .list(user.id, {
        limit: 100,
        offset: 0,

        // File names begin with timestamps,
        // so descending order shows newest first.
        sortBy: {
          column: "name",
          order: "desc",
        },
      });

  if (error) {
    throw new Error(error.message);
  }

  if (!files) {
    return [];
  }

  const realFiles = files.filter(
    (file) =>
      file.id !== null &&
      file.name !== ".emptyFolderPlaceholder"
  );

  const documents = await Promise.all(
    realFiles.map(async (file) => {
      const filePath =
        `${user.id}/${file.name}`;

      const {
        data: signedData,
        error: signedError,
      } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(
          filePath,
          SIGNED_URL_EXPIRY_SECONDS
        );

      if (signedError) {
        throw new Error(signedError.message);
      }

      const metadata = file.metadata as {
        size?: number;
        mimetype?: string;
      } | null;

      return {
        name: file.name,
        path: filePath,

        size: Number(metadata?.size ?? 0),

        mimeType:
          metadata?.mimetype ||
          "application/octet-stream",

        createdAt: file.created_at ?? null,
        updatedAt: file.updated_at ?? null,

        signedUrl: signedData.signedUrl,
      };
    })
  );

  return documents;
}

// =========================
// DELETE DOCUMENT
// =========================

export async function deleteCloudDocument(
  filePath: string
): Promise<void> {
  const user = await getCurrentUser();

  const userFolderPrefix = `${user.id}/`;

  if (!filePath.startsWith(userFolderPrefix)) {
    throw new Error(
      "You cannot delete another user's document."
    );
  }

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    throw new Error(error.message);
  }
}


// =========================
// DOWNLOAD DOCUMENT
// =========================

export async function downloadCloudDocument(
  filePath: string
): Promise<Blob> {
  const user = await getCurrentUser();

  const userFolderPrefix = `${user.id}/`;

  if (!filePath.startsWith(userFolderPrefix)) {
    throw new Error(
      "You cannot download another user's document."
    );
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(filePath);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}