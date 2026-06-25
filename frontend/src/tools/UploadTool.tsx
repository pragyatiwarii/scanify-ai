type UploadToolProps = {
  onImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  uploadedImageUrl: string;
};

function UploadTool({
  onImageChange,
  onUpload,
  uploadedImageUrl,
}: UploadToolProps) {
  return (
    <section className="tool-card">
      <h2>Upload Image</h2>

      <p className="tool-description">
        Start by selecting an image from your device.
      </p>

      <input type="file" accept="image/*" onChange={onImageChange} />

      <button onClick={onUpload}>Upload Image</button>

      {uploadedImageUrl && (
        <a href={uploadedImageUrl} target="_blank" rel="noreferrer">
          Open Uploaded Image
        </a>
      )}
    </section>
  );
}

export default UploadTool;