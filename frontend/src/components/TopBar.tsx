type TopBarProps = {
  activeToolLabel: string;
  selectedImage: File | null;
  onImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

function TopBar({
  activeToolLabel,
  selectedImage,
  onImageChange,
}: TopBarProps) {
  return (
    <header className="top-bar">
      <div>
        <h2>{activeToolLabel}</h2>
        <p>
          {selectedImage
            ? `Selected file: ${selectedImage.name}`
            : "No image selected yet"}
        </p>
      </div>

      <label className="quick-upload">
        Choose Image
        <input type="file" accept="image/*" onChange={onImageChange} />
      </label>
    </header>
  );
}

export default TopBar;