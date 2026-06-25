import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

type CropPosition = {
  x: number;
  y: number;
};

type CropToolProps = {
  previewUrl: string;
  crop: CropPosition;
  zoom: number;
  onCropChange: (crop: CropPosition) => void;
  onZoomChange: (zoom: number) => void;
  onCropComplete: (croppedArea: Area, croppedAreaPixels: Area) => void;
  onCropImage: () => void;
};

function CropTool({
  previewUrl,
  crop,
  zoom,
  onCropChange,
  onZoomChange,
  onCropComplete,
  onCropImage,
}: CropToolProps) {
  return (
    <section className="tool-card">
      <h2>Crop Image</h2>

      <p className="tool-description">
        Drag and zoom the image to select the crop area.
      </p>

      {previewUrl ? (
        <>
          <div className="cropper-wrapper">
            <Cropper
              image={previewUrl}
              crop={crop}
              zoom={zoom}
              aspect={4 / 3}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropComplete}
            />
          </div>

          <label>Zoom: {zoom.toFixed(1)}</label>
          <input
            type="range"
            min="1"
            max="3"
            step="0.1"
            value={zoom}
            onChange={(event) => onZoomChange(Number(event.target.value))}
          />

          <button onClick={onCropImage}>Crop Image</button>
        </>
      ) : (
        <p className="helper-text">Select an image first.</p>
      )}
    </section>
  );
}

export default CropTool;