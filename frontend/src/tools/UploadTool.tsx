type UploadToolProps = {
  onImageChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;

  onUpload: () => void;
  onSaveToCloud: () => void;

  uploadedImageUrl: string;

  cloudSaving: boolean;
  cloudMessage: string;
};

function UploadTool({
  onImageChange,
  onUpload,
  onSaveToCloud,
  uploadedImageUrl,
  cloudSaving,
  cloudMessage,
}: UploadToolProps) {
  return (
    <section className="tool-card">
      <h2>Upload Image</h2>

      <p className="tool-description">
        Start by selecting an image from your device.
      </p>

      <input
        type="file"
        accept="image/*"
        onChange={onImageChange}
      />

      <button onClick={onUpload}>
        Upload Image
      </button>

      <button
        onClick={onSaveToCloud}
        disabled={cloudSaving}
      >
        {cloudSaving
          ? "Saving..."
          : "Save Original to Cloud"}
      </button>

      {uploadedImageUrl && (
        <a
          href={uploadedImageUrl}
          target="_blank"
          rel="noreferrer"
        >
          Open Uploaded Image
        </a>
      )}

      {cloudMessage && (
        <p className="helper-text">
          {cloudMessage}
        </p>
      )}
    </section>
  );
}

export default UploadTool;