import { useState } from "react";

import {
  downloadCloudDocument,
  type CloudDocument,
} from "../api/storageApi";

type MyDocumentsToolProps = {
  documents: CloudDocument[];
  loading: boolean;
  errorMessage: string;
  deletingPath: string;

  onRefresh: () => void;
  onDelete: (document: CloudDocument) => void;
};

function MyDocumentsTool({
  documents,
  loading,
  errorMessage,
  deletingPath,
  onRefresh,
  onDelete,
}: MyDocumentsToolProps) {
  const [downloadingPath, setDownloadingPath] =
    useState("");

  const handleDownload = async (
    cloudDocument: CloudDocument
  ) => {
    setDownloadingPath(cloudDocument.path);

    try {
      const fileBlob = await downloadCloudDocument(
        cloudDocument.path
      );

      const objectUrl =
        URL.createObjectURL(fileBlob);

      const downloadLink =
        window.document.createElement("a");

      downloadLink.href = objectUrl;

      downloadLink.download =
        getDisplayName(cloudDocument.name);

      window.document.body.appendChild(
        downloadLink
      );

      downloadLink.click();

      downloadLink.remove();

      setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 1000);
    } catch (error) {
      console.error(
        "Document download error:",
        error
      );

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Could not download this document.";

      window.alert(errorMessage);
    } finally {
      setDownloadingPath("");
    }
  };

  return (
    <section className="documents-section">
      <div className="documents-header">
  <div>
    <p>
      Your private cloud library — view, download, or manage saved files.
    </p>
  </div>

        <button
          type="button"
          className="documents-refresh-btn"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {errorMessage && (
        <div className="documents-error">
          {errorMessage}
        </div>
      )}

      {loading &&
        documents.length === 0 && (
          <div className="documents-empty">
            <div className="documents-empty-icon">
              ☁
            </div>

            <h3>
              Loading your documents...
            </h3>

            <p>
              Please wait while Scanify securely
              loads your files.
            </p>
          </div>
        )}

      {!loading &&
        !errorMessage &&
        documents.length === 0 && (
          <div className="documents-empty">
            <div className="documents-empty-icon">
              📄
            </div>

            <h3>
              No documents saved yet
            </h3>

            <p>
              Save an image to the cloud and it
              will appear here.
            </p>
          </div>
        )}

      {documents.length > 0 && (
        <div className="documents-grid">
          {documents.map(
            (cloudDocument) => {
              const isImage =
                cloudDocument.mimeType.startsWith(
                  "image/"
                );

              const isPdf =
                cloudDocument.mimeType ===
                "application/pdf";

              const isDeleting =
                deletingPath ===
                cloudDocument.path;

              const isDownloading =
                downloadingPath ===
                cloudDocument.path;

              return (
                <article
                  className="document-card"
                  key={cloudDocument.path}
                >
                  <div className="document-preview">
                    {isImage ? (
                      <img
                        src={
                          cloudDocument.signedUrl
                        }
                        alt={getDisplayName(
                          cloudDocument.name
                        )}
                      />
                    ) : (
                      <div className="document-file-type">
                        <span>
                          {isPdf
                            ? "PDF"
                            : "FILE"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="document-info">
                    <h3
                      title={getDisplayName(
                        cloudDocument.name
                      )}
                    >
                      {getDisplayName(
                        cloudDocument.name
                      )}
                    </h3>

                    <div className="document-meta">
                      <span>
                        {formatFileSize(
                          cloudDocument.size
                        )}
                      </span>

                      <span>
                        {formatDate(
                          cloudDocument.createdAt
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="document-actions">
                    <a
                      href={
                        cloudDocument.signedUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="document-open-btn"
                    >
                      Open
                    </a>

                    <button
                      type="button"
                      className="document-download-btn"
                      onClick={() =>
                        handleDownload(
                          cloudDocument
                        )
                      }
                      disabled={isDownloading}
                    >
                      {isDownloading
                        ? "Downloading..."
                        : "Download"}
                    </button>

                    <button
                      type="button"
                      className="document-delete-btn"
                      onClick={() =>
                        onDelete(cloudDocument)
                      }
                      disabled={isDeleting}
                    >
                      {isDeleting
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}
    </section>
  );
}

// =========================
// HELPER FUNCTIONS
// =========================

function getDisplayName(fileName: string) {
  return fileName.replace(/^\d+-/, "");
}

function formatFileSize(bytes: number) {
  if (!bytes) {
    return "Unknown size";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function formatDate(
  dateValue: string | null
) {
  if (!dateValue) {
    return "Unknown date";
  }

  const date = new Date(dateValue);

  return date.toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

export default MyDocumentsTool;