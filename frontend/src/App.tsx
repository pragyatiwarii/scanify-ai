import { useState } from "react";
import axios from "axios";
import type { Area } from "react-easy-crop";

import "./App.css";

import type { Tool, ScanMode, FilterType } from "./types";
import { menuItems } from "./constants/tools";

import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import ResultImage from "./components/ResultImage";

import UploadTool from "./tools/UploadTool";
import ScannerTool from "./tools/ScannerTool";
import PdfTool from "./tools/PdfTool";
import FilterTool from "./tools/FilterTool";
import CropTool from "./tools/CropTool";
import ResizeTool from "./tools/ResizeTool";
import CompressTool from "./tools/CompressTool";
import RotateTool from "./tools/RotateTool";

const API_BASE_URL = "http://127.0.0.1:8000";

function App() {
  const [activeTool, setActiveTool] = useState<Tool>("upload");

  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");

  const [scannedImageUrl, setScannedImageUrl] = useState<string>("");
  const [autoScannedImageUrl, setAutoScannedImageUrl] = useState<string>("");

  const [imagePdfUrl, setImagePdfUrl] = useState<string>("");
  const [scannedPdfUrl, setScannedPdfUrl] = useState<string>("");
  const [autoScannedPdfUrl, setAutoScannedPdfUrl] = useState<string>("");

  const [filteredImageUrl, setFilteredImageUrl] = useState<string>("");
  const [croppedImageUrl, setCroppedImageUrl] = useState<string>("");
  const [resizedImageUrl, setResizedImageUrl] = useState<string>("");
  const [compressedImageUrl, setCompressedImageUrl] = useState<string>("");
  const [rotatedImageUrl, setRotatedImageUrl] = useState<string>("");

  const [message, setMessage] = useState<string>("");

  const [scanMode, setScanMode] = useState<ScanMode>("clean");
  const [filterType, setFilterType] = useState<FilterType>("grayscale");

  const [width, setWidth] = useState<number>(500);
  const [height, setHeight] = useState<number>(500);
  const [quality, setQuality] = useState<number>(60);
  const [angle, setAngle] = useState<number>(90);

  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));

    setUploadedImageUrl("");

    setScannedImageUrl("");
    setAutoScannedImageUrl("");

    setImagePdfUrl("");
    setScannedPdfUrl("");
    setAutoScannedPdfUrl("");

    setFilteredImageUrl("");
    setCroppedImageUrl("");
    setResizedImageUrl("");
    setCompressedImageUrl("");
    setRotatedImageUrl("");

    setMessage("");

    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const requireImage = () => {
    if (!selectedImage) {
      alert("Please select an image first");
      setActiveTool("upload");
      return false;
    }

    return true;
  };

  const onCropComplete = (_croppedArea: Area, croppedAreaPixelsValue: Area) => {
    setCroppedAreaPixels(croppedAreaPixelsValue);
  };

  const handleUpload = async () => {
    if (!requireImage()) return;

    const formData = new FormData();
    formData.append("file", selectedImage as File);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/upload-image`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setUploadedImageUrl(response.data.image_url);
      setMessage(response.data.message);
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong while uploading image");
    }
  };

  const handleScanDocument = async () => {
    if (!requireImage()) return;

    const formData = new FormData();
    formData.append("file", selectedImage as File);
    formData.append("mode", scanMode);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/scan-document`,
        formData,
        {
          responseType: "blob",
        }
      );

      const scannedUrl = URL.createObjectURL(response.data);
      setScannedImageUrl(scannedUrl);
      setMessage("Document scanned successfully");
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong while scanning document");
    }
  };

  const handleAutoScanDocument = async () => {
    if (!requireImage()) return;

    const formData = new FormData();
    formData.append("file", selectedImage as File);
    formData.append("mode", scanMode);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auto-scan-document`,
        formData,
        {
          responseType: "blob",
        }
      );

      const autoScannedUrl = URL.createObjectURL(response.data);
      setAutoScannedImageUrl(autoScannedUrl);
      setMessage("Document auto-cropped and scanned successfully");
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong while auto-scanning document");
    }
  };

  const handleImageToPdf = async () => {
    if (!requireImage()) return;

    const formData = new FormData();
    formData.append("file", selectedImage as File);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/image-to-pdf`,
        formData,
        {
          responseType: "blob",
        }
      );

      const pdfUrl = URL.createObjectURL(response.data);
      setImagePdfUrl(pdfUrl);
      setMessage("Image converted to PDF successfully");
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong while converting image to PDF");
    }
  };

  const handleScanToPdf = async (autoCrop: boolean) => {
    if (!requireImage()) return;

    const formData = new FormData();
    formData.append("file", selectedImage as File);
    formData.append("mode", scanMode);
    formData.append("auto_crop", String(autoCrop));

    try {
      const response = await axios.post(
        `${API_BASE_URL}/scan-to-pdf`,
        formData,
        {
          responseType: "blob",
        }
      );

      const pdfUrl = URL.createObjectURL(response.data);

      if (autoCrop) {
        setAutoScannedPdfUrl(pdfUrl);
        setMessage("Auto-cropped scanned PDF created successfully");
      } else {
        setScannedPdfUrl(pdfUrl);
        setMessage("Scanned PDF created successfully");
      }
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong while creating scanned PDF");
    }
  };

  const handleApplyFilter = async () => {
    if (!requireImage()) return;

    const formData = new FormData();
    formData.append("file", selectedImage as File);
    formData.append("filter_type", filterType);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/apply-filter`,
        formData,
        {
          responseType: "blob",
        }
      );

      const filteredUrl = URL.createObjectURL(response.data);
      setFilteredImageUrl(filteredUrl);
      setMessage("Filter applied successfully");
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong while applying filter");
    }
  };

  const handleCrop = async () => {
    if (!requireImage()) return;

    if (!croppedAreaPixels) {
      alert("Please adjust the crop area first");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedImage as File);
    formData.append("x", String(Math.round(croppedAreaPixels.x)));
    formData.append("y", String(Math.round(croppedAreaPixels.y)));
    formData.append("width", String(Math.round(croppedAreaPixels.width)));
    formData.append("height", String(Math.round(croppedAreaPixels.height)));

    try {
      const response = await axios.post(
        `${API_BASE_URL}/crop-image`,
        formData,
        {
          responseType: "blob",
        }
      );

      const croppedUrl = URL.createObjectURL(response.data);
      setCroppedImageUrl(croppedUrl);
      setMessage("Image cropped successfully");
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong while cropping image");
    }
  };

  const handleResize = async () => {
    if (!requireImage()) return;

    if (width <= 0 || height <= 0) {
      alert("Width and height must be greater than 0");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedImage as File);
    formData.append("width", String(width));
    formData.append("height", String(height));

    try {
      const response = await axios.post(
        `${API_BASE_URL}/resize-image`,
        formData,
        {
          responseType: "blob",
        }
      );

      const resizedUrl = URL.createObjectURL(response.data);
      setResizedImageUrl(resizedUrl);
      setMessage("Image resized successfully");
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong while resizing image");
    }
  };

  const handleCompress = async () => {
    if (!requireImage()) return;

    if (quality < 10 || quality > 100) {
      alert("Quality must be between 10 and 100");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedImage as File);
    formData.append("quality", String(quality));

    try {
      const response = await axios.post(
        `${API_BASE_URL}/compress-image`,
        formData,
        {
          responseType: "blob",
        }
      );

      const compressedUrl = URL.createObjectURL(response.data);
      setCompressedImageUrl(compressedUrl);
      setMessage("Image compressed successfully");
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong while compressing image");
    }
  };

  const handleRotate = async () => {
    if (!requireImage()) return;

    const formData = new FormData();
    formData.append("file", selectedImage as File);
    formData.append("angle", String(angle));

    try {
      const response = await axios.post(
        `${API_BASE_URL}/rotate-image`,
        formData,
        {
          responseType: "blob",
        }
      );

      const rotatedUrl = URL.createObjectURL(response.data);
      setRotatedImageUrl(rotatedUrl);
      setMessage("Image rotated successfully");
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong while rotating image");
    }
  };

  const renderTool = () => {
    switch (activeTool) {
      case "upload":
        return (
          <UploadTool
            onImageChange={handleImageChange}
            onUpload={handleUpload}
            uploadedImageUrl={uploadedImageUrl}
          />
        );

      case "scanner":
        return (
          <ScannerTool
            scanMode={scanMode}
            onScanModeChange={setScanMode}
            onScanDocument={handleScanDocument}
            onAutoScanDocument={handleAutoScanDocument}
          />
        );

      case "pdf":
        return (
          <PdfTool
            scanMode={scanMode}
            imagePdfUrl={imagePdfUrl}
            scannedPdfUrl={scannedPdfUrl}
            autoScannedPdfUrl={autoScannedPdfUrl}
            onScanModeChange={setScanMode}
            onImageToPdf={handleImageToPdf}
            onScanToPdf={handleScanToPdf}
          />
        );

      case "filters":
        return (
          <FilterTool
            filterType={filterType}
            onFilterTypeChange={setFilterType}
            onApplyFilter={handleApplyFilter}
          />
        );

      case "crop":
        return (
          <CropTool
            previewUrl={previewUrl}
            crop={crop}
            zoom={zoom}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            onCropImage={handleCrop}
          />
        );

      case "resize":
        return (
          <ResizeTool
            width={width}
            height={height}
            onWidthChange={setWidth}
            onHeightChange={setHeight}
            onResize={handleResize}
          />
        );

      case "compress":
        return (
          <CompressTool
            quality={quality}
            onQualityChange={setQuality}
            onCompress={handleCompress}
          />
        );

      case "rotate":
        return (
          <RotateTool
            angle={angle}
            onAngleChange={setAngle}
            onRotate={handleRotate}
          />
        );

      default:
        return null;
    }
  };

  const renderResult = () => {
    if (activeTool === "scanner") {
      return (
        <>
          {scannedImageUrl && (
            <ResultImage
              title="Scanned Document"
              imageUrl={scannedImageUrl}
              downloadName="scanned-document.jpg"
            />
          )}

          {autoScannedImageUrl && (
            <ResultImage
              title="Auto-Cropped Scanned Document"
              imageUrl={autoScannedImageUrl}
              downloadName="auto-scanned-document.jpg"
            />
          )}

          {!scannedImageUrl && !autoScannedImageUrl && <EmptyResult />}
        </>
      );
    }

    if (activeTool === "filters") {
      return filteredImageUrl ? (
        <ResultImage
          title="Filtered Image"
          imageUrl={filteredImageUrl}
          downloadName="filtered-image.jpg"
        />
      ) : (
        <EmptyResult />
      );
    }

    if (activeTool === "crop") {
      return croppedImageUrl ? (
        <ResultImage
          title="Cropped Image"
          imageUrl={croppedImageUrl}
          downloadName="cropped-image.jpg"
        />
      ) : (
        <EmptyResult />
      );
    }

    if (activeTool === "resize") {
      return resizedImageUrl ? (
        <ResultImage
          title="Resized Image"
          imageUrl={resizedImageUrl}
          downloadName="resized-image.jpg"
        />
      ) : (
        <EmptyResult />
      );
    }

    if (activeTool === "compress") {
      return compressedImageUrl ? (
        <ResultImage
          title="Compressed Image"
          imageUrl={compressedImageUrl}
          downloadName="compressed-image.jpg"
        />
      ) : (
        <EmptyResult />
      );
    }

    if (activeTool === "rotate") {
      return rotatedImageUrl ? (
        <ResultImage
          title="Rotated Image"
          imageUrl={rotatedImageUrl}
          downloadName="rotated-image.jpg"
        />
      ) : (
        <EmptyResult />
      );
    }

    return <EmptyResult />;
  };

  const activeToolLabel =
    menuItems.find((item) => item.key === activeTool)?.label || "Upload";

  return (
    <div className="app-shell">
      <Sidebar
        activeTool={activeTool}
        menuItems={menuItems}
        onToolChange={setActiveTool}
      />

      <main className="main-area">
        <TopBar
          activeToolLabel={activeToolLabel}
          selectedImage={selectedImage}
          onImageChange={handleImageChange}
        />

        {message && <p className="message">{message}</p>}

        <div className="workspace">
          <div className="left-panel">{renderTool()}</div>

          <div className="right-panel">
            <section className="preview-card">
              <h3>Original Preview</h3>

              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Original preview"
                  className="preview-image"
                />
              ) : (
                <div className="empty-preview">
                  <p>Select an image to start editing.</p>
                </div>
              )}
            </section>

            <section className="preview-card">
              <h3>Output Preview</h3>
              {renderResult()}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function EmptyResult() {
  return (
    <div className="empty-result">
      <p>Your processed output will appear here.</p>
    </div>
  );
}

export default App;