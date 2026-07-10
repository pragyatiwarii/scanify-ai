import { useEffect, useState } from "react";
import axios from "axios";

import type { Session } from "@supabase/supabase-js";
import type { Area } from "react-easy-crop";

import "./App.css";

import type {
  Tool,
  ScanMode,
  FilterType,
} from "./types";

import { menuItems } from "./constants/tools";

import { supabase } from "./lib/supabaseClient";

import {
  uploadDocumentToCloud,
  listCloudDocuments,
  deleteCloudDocument,
  type CloudDocument,
} from "./api/storageApi";

import AuthPage from "./auth/AuthPage";

import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import ResultImage from "./components/ResultImage";


import UploadTool from "./tools/UploadTool";
import MyDocumentsTool from "./tools/MyDocumentsTool";
import ScannerTool from "./tools/ScannerTool";
import PdfTool from "./tools/PdfTool";
import OcrTool from "./tools/OcrTool";
import FilterTool from "./tools/FilterTool";
import CropTool from "./tools/CropTool";
import ResizeTool from "./tools/ResizeTool";
import CompressTool from "./tools/CompressTool";
import RotateTool from "./tools/RotateTool";

const API_BASE_URL = "http://127.0.0.1:8000";

function App() {
  // =========================
  // AUTHENTICATION
  // =========================

  const [session, setSession] =
    useState<Session | null>(null);

  const [authLoading, setAuthLoading] =
    useState(true);

  // =========================
  // MAIN TOOL STATE
  // =========================

  const [activeTool, setActiveTool] =
    useState<Tool>("upload");

  const [selectedImage, setSelectedImage] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState("");

  const [uploadedImageUrl, setUploadedImageUrl] =
    useState("");

  const [scannedImageUrl, setScannedImageUrl] =
    useState("");

  const [
    autoScannedImageUrl,
    setAutoScannedImageUrl,
  ] = useState("");

  const [imagePdfUrl, setImagePdfUrl] =
    useState("");

  const [scannedPdfUrl, setScannedPdfUrl] =
    useState("");

  const [
    autoScannedPdfUrl,
    setAutoScannedPdfUrl,
  ] = useState("");

  const [filteredImageUrl, setFilteredImageUrl] =
    useState("");

  const [croppedImageUrl, setCroppedImageUrl] =
    useState("");

  const [resizedImageUrl, setResizedImageUrl] =
    useState("");

  const [
    compressedImageUrl,
    setCompressedImageUrl,
  ] = useState("");

  const [rotatedImageUrl, setRotatedImageUrl] =
    useState("");

  const [message, setMessage] = useState("");

  // =========================
  // CLOUD UPLOAD STATE
  // =========================

  const [cloudSaving, setCloudSaving] =
    useState(false);

  const [cloudMessage, setCloudMessage] =
    useState("");

  // =========================
  // MY DOCUMENTS STATE
  // =========================

  const [
    cloudDocuments,
    setCloudDocuments,
  ] = useState<CloudDocument[]>([]);

  const [
    documentsLoading,
    setDocumentsLoading,
  ] = useState(false);

  const [
    documentsError,
    setDocumentsError,
  ] = useState("");

  const [
    deletingPath,
    setDeletingPath,
  ] = useState("");

  // =========================
  // TOOL SETTINGS
  // =========================

  const [scanMode, setScanMode] =
    useState<ScanMode>("clean");

  const [filterType, setFilterType] =
    useState<FilterType>("grayscale");

  const [width, setWidth] = useState(500);
  const [height, setHeight] = useState(500);
  const [quality, setQuality] = useState(60);
  const [angle, setAngle] = useState(90);

  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
  });

  const [zoom, setZoom] = useState(1);

  const [
    croppedAreaPixels,
    setCroppedAreaPixels,
  ] = useState<Area | null>(null);

  // =========================
  // LOAD AUTH SESSION
  // =========================

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const { data, error } =
          await supabase.auth.getSession();

        if (error) {
          console.error(
            "Error loading session:",
            error
          );
        }

        if (isMounted) {
          setSession(data.session);
          setAuthLoading(false);
        }
      } catch (error) {
        console.error(
          "Unexpected authentication error:",
          error
        );

        if (isMounted) {
          setSession(null);
          setAuthLoading(false);
        }
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setAuthLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // =========================
  // LOAD CLOUD DOCUMENTS
  // =========================

  const loadCloudDocuments = async () => {
    setDocumentsLoading(true);
    setDocumentsError("");

    try {
      const documents =
        await listCloudDocuments();

      setCloudDocuments(documents);
    } catch (error) {
      console.error(
        "Document loading error:",
        error
      );

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Could not load your documents.";

      setDocumentsError(errorMessage);
    } finally {
      setDocumentsLoading(false);
    }
  };

  // =========================
  // TOOL CHANGE
  // =========================

  const handleToolChange = (tool: Tool) => {
    setActiveTool(tool);

    if (tool === "documents") {
      void loadCloudDocuments();
    }
  };

  // =========================
  // DELETE CLOUD DOCUMENT
  // =========================

  const handleDeleteCloudDocument = async (
    document: CloudDocument
  ) => {
    const shouldDelete = window.confirm(
      "Delete this document permanently?"
    );

    if (!shouldDelete) {
      return;
    }

    setDeletingPath(document.path);
    setDocumentsError("");

    try {
      await deleteCloudDocument(document.path);

      setCloudDocuments(
        (currentDocuments) =>
          currentDocuments.filter(
            (item) =>
              item.path !== document.path
          )
      );

      setMessage(
        "Document deleted from cloud storage"
      );
    } catch (error) {
      console.error(
        "Cloud delete error:",
        error
      );

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Could not delete the document.";

      setDocumentsError(errorMessage);
    } finally {
      setDeletingPath("");
    }
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = async () => {
    const { error } =
      await supabase.auth.signOut({
        scope: "local",
      });

    if (error) {
      console.error("Logout error:", error);

      setMessage(
        "Could not log out. Please try again."
      );

      return;
    }

    setActiveTool("upload");

    setSelectedImage(null);

    setPreviewUrl("");
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

    setCloudSaving(false);
    setCloudMessage("");

    setCloudDocuments([]);
    setDocumentsLoading(false);
    setDocumentsError("");
    setDeletingPath("");

    setMessage("");

    setCrop({
      x: 0,
      y: 0,
    });

    setZoom(1);
    setCroppedAreaPixels(null);
  };

  // =========================
  // AUTH LOADING SCREEN
  // =========================

  if (authLoading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-brand">
            <h1>Scanify AI</h1>

            <p>
              Loading your workspace...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // LOGIN SCREEN
  // =========================

  if (!session) {
    return <AuthPage />;
  }

  // =========================
  // IMAGE SELECTION
  // =========================

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedImage(file);

    setPreviewUrl(
      URL.createObjectURL(file)
    );

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

    setCloudMessage("");
    setMessage("");

    setCrop({
      x: 0,
      y: 0,
    });

    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const requireImage = () => {
    if (!selectedImage) {
      alert(
        "Please select an image first"
      );

      setActiveTool("upload");

      return false;
    }

    return true;
  };

  const onCropComplete = (
    _croppedArea: Area,
    croppedAreaPixelsValue: Area
  ) => {
    setCroppedAreaPixels(
      croppedAreaPixelsValue
    );
  };

  // =========================
  // SAVE ORIGINAL TO CLOUD
  // =========================

  const handleSaveToCloud = async () => {
    if (!requireImage()) {
      return;
    }

    const file = selectedImage;

    if (!file) {
      return;
    }

    setCloudSaving(true);
    setCloudMessage("");

    try {
      const result =
        await uploadDocumentToCloud(file);

      setCloudMessage(
        `Saved privately as ${result.fileName}`
      );

      setMessage(
        "Original image saved to your private cloud storage"
      );
    } catch (error) {
      console.error(
        "Cloud upload error:",
        error
      );

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong while saving to cloud.";

      setCloudMessage(
        `Cloud save failed: ${errorMessage}`
      );

      setMessage(
        "Could not save image to cloud"
      );
    } finally {
      setCloudSaving(false);
    }
  };

  // =========================
  // NORMAL UPLOAD
  // =========================

  const handleUpload = async () => {
    if (!requireImage()) {
      return;
    }

    const formData = new FormData();

    formData.append(
      "file",
      selectedImage as File
    );

    try {
      const response = await axios.post(
        `${API_BASE_URL}/upload-image`,
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      setUploadedImageUrl(
        response.data.image_url
      );

      setMessage(response.data.message);
    } catch (error) {
      console.error(error);

      setMessage(
        "Something went wrong while uploading image"
      );
    }
  };

  // =========================
  // DOCUMENT SCANNER
  // =========================

  const handleScanDocument = async () => {
    if (!requireImage()) {
      return;
    }

    const formData = new FormData();

    formData.append(
      "file",
      selectedImage as File
    );

    formData.append(
      "mode",
      scanMode
    );

    try {
      const response = await axios.post(
        `${API_BASE_URL}/scan-document`,
        formData,
        {
          responseType: "blob",
        }
      );

      const scannedUrl =
        URL.createObjectURL(response.data);

      setScannedImageUrl(scannedUrl);

      setMessage(
        "Document scanned successfully"
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "Something went wrong while scanning document"
      );
    }
  };

  const handleAutoScanDocument =
    async () => {
      if (!requireImage()) {
        return;
      }

      const formData = new FormData();

      formData.append(
        "file",
        selectedImage as File
      );

      formData.append(
        "mode",
        scanMode
      );

      try {
        const response = await axios.post(
          `${API_BASE_URL}/auto-scan-document`,
          formData,
          {
            responseType: "blob",
          }
        );

        const autoScannedUrl =
          URL.createObjectURL(
            response.data
          );

        setAutoScannedImageUrl(
          autoScannedUrl
        );

        setMessage(
          "Document auto-cropped and scanned successfully"
        );
      } catch (error) {
        console.error(error);

        setMessage(
          "Something went wrong while auto-scanning document"
        );
      }
    };

  // =========================
  // PDF TOOLS
  // =========================

  const handleImageToPdf = async () => {
    if (!requireImage()) {
      return;
    }

    const formData = new FormData();

    formData.append(
      "file",
      selectedImage as File
    );

    try {
      const response = await axios.post(
        `${API_BASE_URL}/image-to-pdf`,
        formData,
        {
          responseType: "blob",
        }
      );

      const pdfUrl =
        URL.createObjectURL(response.data);

      setImagePdfUrl(pdfUrl);

      setMessage(
        "Image converted to PDF successfully"
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "Something went wrong while converting image to PDF"
      );
    }
  };

  const handleScanToPdf = async (
    autoCrop: boolean
  ) => {
    if (!requireImage()) {
      return;
    }

    const formData = new FormData();

    formData.append(
      "file",
      selectedImage as File
    );

    formData.append(
      "mode",
      scanMode
    );

    formData.append(
      "auto_crop",
      String(autoCrop)
    );

    try {
      const response = await axios.post(
        `${API_BASE_URL}/scan-to-pdf`,
        formData,
        {
          responseType: "blob",
        }
      );

      const pdfUrl =
        URL.createObjectURL(response.data);

      if (autoCrop) {
        setAutoScannedPdfUrl(pdfUrl);

        setMessage(
          "Auto-cropped scanned PDF created successfully"
        );
      } else {
        setScannedPdfUrl(pdfUrl);

        setMessage(
          "Scanned PDF created successfully"
        );
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "Something went wrong while creating scanned PDF"
      );
    }
  };

  // =========================
  // FILTERS
  // =========================

  const handleApplyFilter = async () => {
    if (!requireImage()) {
      return;
    }

    const formData = new FormData();

    formData.append(
      "file",
      selectedImage as File
    );

    formData.append(
      "filter_type",
      filterType
    );

    try {
      const response = await axios.post(
        `${API_BASE_URL}/apply-filter`,
        formData,
        {
          responseType: "blob",
        }
      );

      const filteredUrl =
        URL.createObjectURL(response.data);

      setFilteredImageUrl(filteredUrl);

      setMessage(
        "Filter applied successfully"
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "Something went wrong while applying filter"
      );
    }
  };

  // =========================
  // CROP
  // =========================

  const handleCrop = async () => {
    if (!requireImage()) {
      return;
    }

    if (!croppedAreaPixels) {
      alert(
        "Please adjust the crop area first"
      );

      return;
    }

    const formData = new FormData();

    formData.append(
      "file",
      selectedImage as File
    );

    formData.append(
      "x",
      String(
        Math.round(
          croppedAreaPixels.x
        )
      )
    );

    formData.append(
      "y",
      String(
        Math.round(
          croppedAreaPixels.y
        )
      )
    );

    formData.append(
      "width",
      String(
        Math.round(
          croppedAreaPixels.width
        )
      )
    );

    formData.append(
      "height",
      String(
        Math.round(
          croppedAreaPixels.height
        )
      )
    );

    try {
      const response = await axios.post(
        `${API_BASE_URL}/crop-image`,
        formData,
        {
          responseType: "blob",
        }
      );

      const croppedUrl =
        URL.createObjectURL(response.data);

      setCroppedImageUrl(croppedUrl);

      setMessage(
        "Image cropped successfully"
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "Something went wrong while cropping image"
      );
    }
  };

  // =========================
  // RESIZE
  // =========================

  const handleResize = async () => {
    if (!requireImage()) {
      return;
    }

    if (
      width <= 0 ||
      height <= 0
    ) {
      alert(
        "Width and height must be greater than 0"
      );

      return;
    }

    const formData = new FormData();

    formData.append(
      "file",
      selectedImage as File
    );

    formData.append(
      "width",
      String(width)
    );

    formData.append(
      "height",
      String(height)
    );

    try {
      const response = await axios.post(
        `${API_BASE_URL}/resize-image`,
        formData,
        {
          responseType: "blob",
        }
      );

      const resizedUrl =
        URL.createObjectURL(response.data);

      setResizedImageUrl(resizedUrl);

      setMessage(
        "Image resized successfully"
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "Something went wrong while resizing image"
      );
    }
  };

  // =========================
  // COMPRESS
  // =========================

  const handleCompress = async () => {
    if (!requireImage()) {
      return;
    }

    if (
      quality < 10 ||
      quality > 100
    ) {
      alert(
        "Quality must be between 10 and 100"
      );

      return;
    }

    const formData = new FormData();

    formData.append(
      "file",
      selectedImage as File
    );

    formData.append(
      "quality",
      String(quality)
    );

    try {
      const response = await axios.post(
        `${API_BASE_URL}/compress-image`,
        formData,
        {
          responseType: "blob",
        }
      );

      const compressedUrl =
        URL.createObjectURL(response.data);

      setCompressedImageUrl(
        compressedUrl
      );

      setMessage(
        "Image compressed successfully"
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "Something went wrong while compressing image"
      );
    }
  };

  // =========================
  // ROTATE
  // =========================

  const handleRotate = async () => {
    if (!requireImage()) {
      return;
    }

    const formData = new FormData();

    formData.append(
      "file",
      selectedImage as File
    );

    formData.append(
      "angle",
      String(angle)
    );

    try {
      const response = await axios.post(
        `${API_BASE_URL}/rotate-image`,
        formData,
        {
          responseType: "blob",
        }
      );

      const rotatedUrl =
        URL.createObjectURL(response.data);

      setRotatedImageUrl(rotatedUrl);

      setMessage(
        "Image rotated successfully"
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "Something went wrong while rotating image"
      );
    }
  };

  // =========================
  // TOOL PANEL
  // =========================

  const renderTool = () => {
    switch (activeTool) {
      case "upload":
        return (
          <UploadTool
            onImageChange={
              handleImageChange
            }
            onUpload={handleUpload}
            onSaveToCloud={
              handleSaveToCloud
            }
            uploadedImageUrl={
              uploadedImageUrl
            }
            cloudSaving={
              cloudSaving
            }
            cloudMessage={
              cloudMessage
            }
          />
        );

      case "documents":
        return (
          <MyDocumentsTool
            documents={
              cloudDocuments
            }
            loading={
              documentsLoading
            }
            errorMessage={
              documentsError
            }
            deletingPath={
              deletingPath
            }
            onRefresh={
              loadCloudDocuments
            }
            onDelete={
              handleDeleteCloudDocument
            }
          />
        );

      case "scanner":
        return (
          <ScannerTool
            scanMode={scanMode}
            onScanModeChange={
              setScanMode
            }
            onScanDocument={
              handleScanDocument
            }
            onAutoScanDocument={
              handleAutoScanDocument
            }
          />
        );

      case "pdf":
        return (
          <PdfTool
            scanMode={scanMode}
            imagePdfUrl={
              imagePdfUrl
            }
            scannedPdfUrl={
              scannedPdfUrl
            }
            autoScannedPdfUrl={
              autoScannedPdfUrl
            }
            onScanModeChange={
              setScanMode
            }
            onImageToPdf={
              handleImageToPdf
            }
            onScanToPdf={
              handleScanToPdf
            }
          />
        );

        case "ocr":
  return (
    <OcrTool
      selectedImage={selectedImage}
    />
  );

      case "filters":
        return (
          <FilterTool
            filterType={
              filterType
            }
            onFilterTypeChange={
              setFilterType
            }
            onApplyFilter={
              handleApplyFilter
            }
          />
        );

      case "crop":
        return (
          <CropTool
            previewUrl={
              previewUrl
            }
            crop={crop}
            zoom={zoom}
            onCropChange={
              setCrop
            }
            onZoomChange={
              setZoom
            }
            onCropComplete={
              onCropComplete
            }
            onCropImage={
              handleCrop
            }
          />
        );

      case "resize":
        return (
          <ResizeTool
            width={width}
            height={height}
            onWidthChange={
              setWidth
            }
            onHeightChange={
              setHeight
            }
            onResize={
              handleResize
            }
          />
        );

      case "compress":
        return (
          <CompressTool
            quality={quality}
            onQualityChange={
              setQuality
            }
            onCompress={
              handleCompress
            }
          />
        );

      case "rotate":
        return (
          <RotateTool
            angle={angle}
            onAngleChange={
              setAngle
            }
            onRotate={
              handleRotate
            }
          />
        );

      default:
        return null;
    }
  };

  // =========================
  // RESULT PANEL
  // =========================

  const renderResult = () => {
    if (
      activeTool === "scanner"
    ) {
      return (
        <>
          {scannedImageUrl && (
            <ResultImage
              title="Scanned Document"
              imageUrl={
                scannedImageUrl
              }
              downloadName="scanned-document.jpg"
            />
          )}

          {autoScannedImageUrl && (
            <ResultImage
              title="Auto-Cropped Scanned Document"
              imageUrl={
                autoScannedImageUrl
              }
              downloadName="auto-scanned-document.jpg"
            />
          )}

          {!scannedImageUrl &&
            !autoScannedImageUrl && (
              <EmptyResult />
            )}
        </>
      );
    }

    if (
      activeTool === "filters"
    ) {
      return filteredImageUrl ? (
        <ResultImage
          title="Filtered Image"
          imageUrl={
            filteredImageUrl
          }
          downloadName="filtered-image.jpg"
        />
      ) : (
        <EmptyResult />
      );
    }

    if (
      activeTool === "crop"
    ) {
      return croppedImageUrl ? (
        <ResultImage
          title="Cropped Image"
          imageUrl={
            croppedImageUrl
          }
          downloadName="cropped-image.jpg"
        />
      ) : (
        <EmptyResult />
      );
    }

    if (
      activeTool === "resize"
    ) {
      return resizedImageUrl ? (
        <ResultImage
          title="Resized Image"
          imageUrl={
            resizedImageUrl
          }
          downloadName="resized-image.jpg"
        />
      ) : (
        <EmptyResult />
      );
    }

    if (
      activeTool === "compress"
    ) {
      return compressedImageUrl ? (
        <ResultImage
          title="Compressed Image"
          imageUrl={
            compressedImageUrl
          }
          downloadName="compressed-image.jpg"
        />
      ) : (
        <EmptyResult />
      );
    }

    if (
      activeTool === "rotate"
    ) {
      return rotatedImageUrl ? (
        <ResultImage
          title="Rotated Image"
          imageUrl={
            rotatedImageUrl
          }
          downloadName="rotated-image.jpg"
        />
      ) : (
        <EmptyResult />
      );
    }

    return <EmptyResult />;
  };

  const activeToolLabel =
    menuItems.find(
      (item) =>
        item.key === activeTool
    )?.label || "Upload";

  // =========================
  // MAIN DASHBOARD
  // =========================

  return (
    <div className="app-shell">
      <Sidebar
        activeTool={activeTool}
        menuItems={menuItems}
        onToolChange={
          handleToolChange
        }
      />

      <main className="main-area">
        <TopBar
          activeToolLabel={
            activeToolLabel
          }
          selectedImage={
            selectedImage
          }
          onImageChange={
            handleImageChange
          }
          userEmail={
            session.user.email ||
            "User"
          }
          onLogout={
            handleLogout
          }
          showImagePicker={
            activeTool !==
            "documents"
          }
        />

        {message && (
          <p className="message">
            {message}
          </p>
        )}

        {activeTool ===
        "documents" ? (
          <div className="documents-workspace">
            {renderTool()}
          </div>
        ) : (
          <div className="workspace">
            <div className="left-panel">
              {renderTool()}
            </div>

            <div className="right-panel">
              <section className="preview-card">
                <h3>
                  Original Preview
                </h3>

                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Original preview"
                    className="preview-image"
                  />
                ) : (
                  <div className="empty-preview">
                    <p>
                      Select an image
                      to start editing.
                    </p>
                  </div>
                )}
              </section>

              <section className="preview-card">
                <h3>
                  Output Preview
                </h3>

                {renderResult()}
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyResult() {
  return (
    <div className="empty-result">
      <p>
        Your processed output will
        appear here.
      </p>
    </div>
  );
}

export default App;