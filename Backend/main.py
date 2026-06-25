from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
import uuid


from image_utils import (
    resize_image,
    compress_image,
    rotate_image,
    crop_image,
    scan_document_image,
    image_to_pdf,
    scanned_image_to_pdf,
    apply_filter_image,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
PROCESSED_DIR = "processed"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)


@app.get("/")
def home():
    return {"message": "Scanify AI backend is running"}


@app.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"

    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    return {
        "message": "Image uploaded successfully",
        "filename": unique_filename,
        "image_url": f"http://127.0.0.1:8000/image/{unique_filename}",
    }


@app.get("/image/{filename}")
def get_image(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)

    if not os.path.exists(file_path):
        return {"error": "File not found"}

    return FileResponse(file_path)


@app.post("/resize-image")
async def resize_uploaded_image(
    file: UploadFile = File(...),
    width: int = Form(...),
    height: int = Form(...),
):
    if width <= 0 or height <= 0:
        raise HTTPException(status_code=400, detail="Width and height must be positive")

    unique_filename = f"{uuid.uuid4()}.jpg"

    input_path = os.path.join(UPLOAD_DIR, unique_filename)
    output_path = os.path.join(PROCESSED_DIR, f"resized_{unique_filename}")

    with open(input_path, "wb") as f:
        content = await file.read()
        f.write(content)

    resize_image(input_path, output_path, width, height)

    return FileResponse(
        output_path,
        media_type="image/jpeg",
        filename="resized-image.jpg",
    )


@app.post("/compress-image")
async def compress_uploaded_image(
    file: UploadFile = File(...),
    quality: int = Form(60),
):
    if quality < 10 or quality > 100:
        raise HTTPException(status_code=400, detail="Quality must be between 10 and 100")

    unique_filename = f"{uuid.uuid4()}.jpg"

    input_path = os.path.join(UPLOAD_DIR, unique_filename)
    output_path = os.path.join(PROCESSED_DIR, f"compressed_{unique_filename}")

    with open(input_path, "wb") as f:
        content = await file.read()
        f.write(content)

    compress_image(input_path, output_path, quality)

    return FileResponse(
        output_path,
        media_type="image/jpeg",
        filename="compressed-image.jpg",
    )


@app.post("/rotate-image")
async def rotate_uploaded_image(
    file: UploadFile = File(...),
    angle: int = Form(90),
):
    unique_filename = f"{uuid.uuid4()}.jpg"

    input_path = os.path.join(UPLOAD_DIR, unique_filename)
    output_path = os.path.join(PROCESSED_DIR, f"rotated_{unique_filename}")

    with open(input_path, "wb") as f:
        content = await file.read()
        f.write(content)

    rotate_image(input_path, output_path, angle)

    return FileResponse(
        output_path,
        media_type="image/jpeg",
        filename="rotated-image.jpg",
    )


@app.post("/crop-image")
async def crop_uploaded_image(
    file: UploadFile = File(...),
    x: int = Form(...),
    y: int = Form(...),
    width: int = Form(...),
    height: int = Form(...),
):
    if width <= 0 or height <= 0:
        raise HTTPException(status_code=400, detail="Crop width and height must be positive")

    unique_filename = f"{uuid.uuid4()}.jpg"

    input_path = os.path.join(UPLOAD_DIR, unique_filename)
    output_path = os.path.join(PROCESSED_DIR, f"cropped_{unique_filename}")

    with open(input_path, "wb") as f:
        content = await file.read()
        f.write(content)

    crop_image(input_path, output_path, x, y, width, height)

    return FileResponse(
        output_path,
        media_type="image/jpeg",
        filename="cropped-image.jpg",
    )


@app.post("/scan-document")
async def scan_document(
    file: UploadFile = File(...),
    mode: str = Form("clean"),
):
    if mode not in ["clean", "bw", "gray", "color"]:
        raise HTTPException(status_code=400, detail="Invalid scan mode")

    unique_filename = f"{uuid.uuid4()}.jpg"

    input_path = os.path.join(UPLOAD_DIR, unique_filename)
    output_path = os.path.join(PROCESSED_DIR, f"scanned_{unique_filename}")

    with open(input_path, "wb") as f:
        content = await file.read()
        f.write(content)

    scan_document_image(input_path, output_path, mode, auto_crop=False)

    return FileResponse(
        output_path,
        media_type="image/jpeg",
        filename="scanned-document.jpg",
    )


@app.post("/auto-scan-document")
async def auto_scan_document(
    file: UploadFile = File(...),
    mode: str = Form("clean"),
):
    if mode not in ["clean", "bw", "gray", "color"]:
        raise HTTPException(status_code=400, detail="Invalid scan mode")

    unique_filename = f"{uuid.uuid4()}.jpg"

    input_path = os.path.join(UPLOAD_DIR, unique_filename)
    output_path = os.path.join(PROCESSED_DIR, f"auto_scanned_{unique_filename}")

    with open(input_path, "wb") as f:
        content = await file.read()
        f.write(content)

    scan_document_image(input_path, output_path, mode, auto_crop=True)

    return FileResponse(
        output_path,
        media_type="image/jpeg",
        filename="auto-scanned-document.jpg",
    )


@app.post("/image-to-pdf")
async def convert_image_to_pdf(
    file: UploadFile = File(...),
):
    unique_filename = f"{uuid.uuid4()}"

    input_path = os.path.join(UPLOAD_DIR, f"{unique_filename}.jpg")
    output_path = os.path.join(PROCESSED_DIR, f"{unique_filename}.pdf")

    with open(input_path, "wb") as f:
        content = await file.read()
        f.write(content)

    image_to_pdf(input_path, output_path)

    return FileResponse(
        output_path,
        media_type="application/pdf",
        filename="image-document.pdf",
    )


@app.post("/scan-to-pdf")
async def convert_scanned_image_to_pdf(
    file: UploadFile = File(...),
    mode: str = Form("clean"),
    auto_crop: bool = Form(False),
):
    if mode not in ["clean", "bw", "gray", "color"]:
        raise HTTPException(status_code=400, detail="Invalid scan mode")

    unique_filename = f"{uuid.uuid4()}"

    input_path = os.path.join(UPLOAD_DIR, f"{unique_filename}.jpg")
    temp_image_path = os.path.join(PROCESSED_DIR, f"{unique_filename}_scanned.jpg")
    output_pdf_path = os.path.join(PROCESSED_DIR, f"{unique_filename}_scanned.pdf")

    with open(input_path, "wb") as f:
        content = await file.read()
        f.write(content)

    scanned_image_to_pdf(
        input_path=input_path,
        temp_image_path=temp_image_path,
        output_pdf_path=output_pdf_path,
        mode=mode,
        auto_crop=auto_crop,
    )

    return FileResponse(
        output_pdf_path,
        media_type="application/pdf",
        filename="scanned-document.pdf",
    )


@app.post("/apply-filter")
async def apply_filter(
    file: UploadFile = File(...),
    filter_type: str = Form("grayscale"),
):
    allowed_filters = [
        "grayscale",
        "sepia",
        "negative",
        "sketch",
        "sharpen",
        "blur",
        "warm",
        "cool",
        "cartoon",
        "edge",
    ]

    if filter_type not in allowed_filters:
        raise HTTPException(status_code=400, detail="Invalid filter type")

    unique_filename = f"{uuid.uuid4()}.jpg"

    input_path = os.path.join(UPLOAD_DIR, unique_filename)
    output_path = os.path.join(PROCESSED_DIR, f"filtered_{unique_filename}")

    with open(input_path, "wb") as f:
        content = await file.read()
        f.write(content)

    apply_filter_image(input_path, output_path, filter_type)

    return FileResponse(
        output_path,
        media_type="image/jpeg",
        filename="filtered-image.jpg",
    )