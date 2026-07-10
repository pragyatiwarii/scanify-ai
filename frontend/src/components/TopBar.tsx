type TopBarProps = {
  activeToolLabel: string;

  selectedImage: File | null;

  onImageChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;

  userEmail?: string;
  onLogout?: () => void;

  showImagePicker?: boolean;
};

function TopBar({
  activeToolLabel,
  selectedImage,
  onImageChange,
  userEmail,
  onLogout,
  showImagePicker = true,
}: TopBarProps) {
  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <h2>{activeToolLabel}</h2>

        {showImagePicker && (
          <div className="file-status-row">
            <p>
              {selectedImage
                ? `Selected file: ${selectedImage.name}`
                : "No image selected yet"}
            </p>

            <label className="quick-upload">
              {selectedImage
                ? "Change Image"
                : "Choose Image"}

              <input
                type="file"
                accept="image/*"
                onChange={onImageChange}
              />
            </label>
          </div>
        )}

        {!showImagePicker && (
          <p>
            Access and manage your privately saved files.
          </p>
        )}
      </div>

      {userEmail && onLogout && (
        <div className="user-box">
          <div
            className="profile-icon"
            title={userEmail}
            aria-label={`Logged in as ${userEmail}`}
          ><svg
  viewBox="0 0 24 24"
  aria-hidden="true"
>
  <circle
    cx="12"
    cy="8"
    r="4"
  />

  <path
    d="M4 21c0-4.42 3.58-8 8-8s8 3.58 8 8"
  />
</svg>
          </div>

          <button
            type="button"
            className="logout-btn"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
}

export default TopBar;