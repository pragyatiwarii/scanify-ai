type TopBarProps = {
  activeToolLabel: string;
  selectedImage: File | null;
  onImageChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;

  userEmail?: string;
  onLogout?: () => void;
};

function TopBar({
  activeToolLabel,
  selectedImage,
  onImageChange,
  userEmail,
  onLogout,
}: TopBarProps) {
  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <h2>{activeToolLabel}</h2>

        <div className="file-status-row">
          <p>
            {selectedImage
              ? `Selected file: ${selectedImage.name}`
              : "No image selected yet"}
          </p>

          <label className="quick-upload">
            {selectedImage ? "Change Image" : "Choose Image"}

            <input
              type="file"
              accept="image/*"
              onChange={onImageChange}
            />
          </label>
        </div>
      </div>

      {userEmail && onLogout && (
        <div className="user-box">
          <div
            className="profile-icon"
            title={userEmail}
            aria-label={`Logged in as ${userEmail}`}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5Zm0 2c-4.42 0-8 2.24-8 5v1c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-1c0-2.76-3.58-5-8-5Z"
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