from typing import List
import os
import uuid

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from PIL import Image, ImageOps, UnidentifiedImageError

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


# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# DIRECTORIES
# =========================

UPLOAD_DIR = "uploads"
PROCESSED_DIR = "processed"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)


# =========================
# HELPER FUNCTIONS
# =========================

def prepare_image_for_pdf(image: Image.Image) -> Image.Image:
    """
    Prepare an image safely for PDF conversion.

    - Corrects phone-camera EXIF rotation
    - Converts transparent images onto a white background
    - Converts every image to RGB
    """

    corrected_image = ImageOps.exif_transpose(image)

    has_transparency = (
        corrected_image.mode in ("RGBA", "LA")
        or "transparency" in corrected_image.info
    )

    if has_transparency:
        rgba_image = corrected_image.convert("RGBA")

        white_background = Image.new(
            "RGB",
            rgba_image.size,
            "white",
        )

        white_background.paste(
            rgba_image,
            mask=rgba_image.getchannel("A"),
        )

        return white_background

    return corrected_image.convert("RGB")


# =========================
# HOME
# =========================

@app.get("/")
def home():
    return {
        "message": "Scanify AI backend is running"
    }


# =========================
# UPLOAD IMAGE
# =========================

@app.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...)
):
    file_extension = file.filename.split(".")[-1]

    unique_filename = (
        f"{uuid.uuid4()}.{file_extension}"
    )

    file_path = os.path.join(
        UPLOAD_DIR,
        unique_filename,
    )

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    return {
        "message": "Image uploaded successfully",
        "filename": unique_filename,
        "image_url": (
            "http://127.0.0.1:8000/"
            f"image/{unique_filename}"
        ),
    }


# =========================
# GET IMAGE
# =========================

@app.get("/image/{filename}")
def get_image(filename: str):
    file_path = os.path.join(
        UPLOAD_DIR,
        filename,
    )

    if not os.path.exists(file_path):
        return {
            "error": "File not found"
        }

    return FileResponse(file_path)


# =========================
# RESIZE IMAGE
# =========================

@app.post("/resize-image")
async def resize_uploaded_image(
    file: UploadFile = File(...),
    width: int = Form(...),
    height: int = Form(...),
):
    if width <= 0 or height <= 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "Width and height must be positive"
            ),
        )

    unique_filename = (
        f"{uuid.uuid4()}.jpg"
    )

    input_path = os.path.join(
        UPLOAD_DIR,
        unique_filename,
    )

    output_path = os.path.join(
        PROCESSED_DIR,
        f"resized_{unique_filename}",
    )

    with open(input_path, "wb") as f:
        content = await file.read()
        f.write(content)

    resize_image(
        input_path,
        output_path,
        width,
        height,
    )

    return FileResponse(
        output_path,
        media_type="image/jpeg",
        filename="resized-image.jpg",
    )


# =========================
# COMPRESS IMAGE
# =========================

@app.post("/compress-image")
async def compress_uploaded_image(
    file: UploadFile = File(...),
    quality: int = Form(60),
):
    if quality < 10 or quality > 100:
        raise HTTPException(
            status_code=400,
            detail=(
                "Quality must be between "
                "10 and 100"
            ),
        )

    unique_filename = (
        f"{uuid.uuid4()}.jpg"
    )

    input_path = os.path.join(
        UPLOAD_DIR,
        unique_filename,
    )

    output_path = os.path.join(
        PROCESSED_DIR,
        f"compressed_{unique_filename}",
    )

    with open(input_path, "wb") as f:
        content = await file.read()
        f.write(content)

    compress_image(
        input_path,
        output_path,
        quality,
    )

    return FileResponse(
        output_path,
        media_type="image/jpeg",
        filename="compressed-image.jpg",
    )


# =========================
# ROTATE IMAGE
# =========================

@app.post("/rotate-image")
async def rotate_uploaded_image(
    file: UploadFile = File(...),
    angle: int = Form(90),
):
    unique_filename = (
        f"{uuid.uuid4()}.jpg"
    )

    input_path = os.path.join(
        UPLOAD_DIR,
        unique_filename,
    )

    output_path = os.path.join(
        PROCESSED_DIR,
        f"rotated_{unique_filename}",
    )

    with open(input_path, "wb") as f:
        content = await file.read()
        f.write(content)

    rotate_image(
        input_path,
        output_path,
        angle,
    )

    return FileResponse(
        output_path,
        media_type="image/jpeg",
        filename="rotated-image.jpg",
    )


# =========================
# CROP IMAGE
# =========================

@app.post("/crop-image")
async def crop_uploaded_image(
    file: UploadFile = File(...),
    x: int = Form(...),
    y: int = Form(...),
    width: int = Form(...),
    height: int = Form(...),
):
    if width <= 0 or height <= 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "Crop width and height "
                "must be positive"
            ),
        )

    unique_filename = (
        f"{uuid.uuid4()}.jpg"
    )

    input_path = os.path.join(
        UPLOAD_DIR,
        unique_filename,
    )

    output_path = os.path.join(
        PROCESSED_DIR,
        f"cropped_{unique_filename}",
    )

    with open(input_path, "wb") as f:
        content = await file.read()
        f.write(content)

    crop_image(
        input_path,
        output_path,
        x,
        y,
        width,
        height,
    )

    return FileResponse(
        output_path,
        media_type="image/jpeg",
        filename="cropped-image.jpg",
    )


# =========================
# SCAN DOCUMENT
# =========================

@app.post("/scan-document")
async def scan_document(
    file: UploadFile = File(...),
    mode: str = Form("clean"),
):
    if mode not in [
        "clean",
        "bw",
        "gray",
        "color",
    ]:
        raise HTTPException(
            status_code=400,
            detail="Invalid scan mode",
        )

    unique_filename = (
        f"{uuid.uuid4()}.jpg"
    )

    input_path = os.path.join(
        UPLOAD_DIR,
        unique_filename,
    )

    output_path = os.path.join(
        PROCESSED_DIR,
        f"scanned_{unique_filename}",
    )

    with open(input_path, "wb") as f:
        content = await file.read()
        f.write(content)

    scan_document_image(
        input_path,
        output_path,
        mode,
        auto_crop=False,
    )

    return FileResponse(
        output_path,
        media_type="image/jpeg",
        filename="scanned-document.jpg",
    )


# =========================
# AUTO SCAN DOCUMENT
# =========================

@app.post("/auto-scan-document")
async def auto_scan_document(
    file: UploadFile = File(...),
    mode: str = Form("clean"),
):
    if mode not in [
        "clean",
        "bw",
        "gray",
        "color",
    ]:
        raise HTTPException(
            status_code=400,
            detail="Invalid scan mode",
        )

    unique_filename = (
        f"{uuid.uuid4()}.jpg"
    )

    input_path = os.path.join(
        UPLOAD_DIR,
        unique_filename,
    )

    output_path = os.path.join(
        PROCESSED_DIR,
        f"auto_scanned_{unique_filename}",
    )

    with open(input_path, "wb") as f:
        content = await file.read()
        f.write(content)

    scan_document_image(
        input_path,
        output_path,
        mode,
        auto_crop=True,
    )

    return FileResponse(
        output_path,
        media_type="image/jpeg",
        filename="auto-scanned-document.jpg",
    )


# =========================
# SINGLE IMAGE TO PDF
# =========================

@app.post("/image-to-pdf")
async def convert_image_to_pdf(
    file: UploadFile = File(...),
):
    unique_filename = str(uuid.uuid4())

    input_path = os.path.join(
        UPLOAD_DIR,
        f"{unique_filename}.jpg",
    )

    output_path = os.path.join(
        PROCESSED_DIR,
        f"{unique_filename}.pdf",
    )

    with open(input_path, "wb") as f:
        content = await file.read()
        f.write(content)

    image_to_pdf(
        input_path,
        output_path,
    )

    return FileResponse(
        output_path,
        media_type="application/pdf",
        filename="image-document.pdf",
    )


# =========================
# MULTI-PAGE PDF
# =========================

@app.post("/multi-page-pdf")
async def create_multi_page_pdf(
    files: List[UploadFile] = File(...)
):
    if len(files) == 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "Please upload at least one image"
            ),
        )

    pdf_id = str(uuid.uuid4())

    output_pdf_path = os.path.join(
        PROCESSED_DIR,
        f"{pdf_id}_multi_page.pdf",
    )

    temporary_input_paths: List[str] = []
    pdf_pages: List[Image.Image] = []

    try:
        for index, uploaded_file in enumerate(files):
            original_name = (
                uploaded_file.filename
                or f"page-{index + 1}"
            )

            extension = os.path.splitext(
                original_name
            )[1]

            if not extension:
                extension = ".img"

            temporary_input_path = os.path.join(
                UPLOAD_DIR,
                (
                    f"{pdf_id}_"
                    f"{index + 1}"
                    f"{extension}"
                ),
            )

            content = await uploaded_file.read()

            if not content:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Page {index + 1} "
                        "is empty"
                    ),
                )

            with open(
                temporary_input_path,
                "wb",
            ) as f:
                f.write(content)

            temporary_input_paths.append(
                temporary_input_path
            )

            try:
                with Image.open(
                    temporary_input_path
                ) as source_image:
                    prepared_page = (
                        prepare_image_for_pdf(
                            source_image
                        )
                    )

                    pdf_pages.append(
                        prepared_page.copy()
                    )

                    prepared_page.close()

            except UnidentifiedImageError:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Page {index + 1} "
                        "is not a valid image"
                    ),
                )

        if not pdf_pages:
            raise HTTPException(
                status_code=400,
                detail=(
                    "No valid images were provided"
                ),
            )

        first_page = pdf_pages[0]
        remaining_pages = pdf_pages[1:]

        first_page.save(
            output_pdf_path,
            format="PDF",
            save_all=True,
            append_images=remaining_pages,
            resolution=100.0,
        )

    except HTTPException:
        raise

    except Exception as error:
        print(
            "Multi-page PDF error:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Could not create "
                "multi-page PDF"
            ),
        )

    finally:
        for temporary_path in (
            temporary_input_paths
        ):
            if os.path.exists(temporary_path):
                os.remove(temporary_path)

        for page in pdf_pages:
            page.close()

    return FileResponse(
        output_pdf_path,
        media_type="application/pdf",
        filename="scanify-multi-page.pdf",
    )


# =========================
# SCANNED IMAGE TO PDF
# =========================

@app.post("/scan-to-pdf")
async def convert_scanned_image_to_pdf(
    file: UploadFile = File(...),
    mode: str = Form("clean"),
    auto_crop: bool = Form(False),
):
    if mode not in [
        "clean",
        "bw",
        "gray",
        "color",
    ]:
        raise HTTPException(
            status_code=400,
            detail="Invalid scan mode",
        )

    unique_filename = str(uuid.uuid4())

    input_path = os.path.join(
        UPLOAD_DIR,
        f"{unique_filename}.jpg",
    )

    temp_image_path = os.path.join(
        PROCESSED_DIR,
        (
            f"{unique_filename}"
            "_scanned.jpg"
        ),
    )

    output_pdf_path = os.path.join(
        PROCESSED_DIR,
        (
            f"{unique_filename}"
            "_scanned.pdf"
        ),
    )

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


# =========================
# APPLY FILTER
# =========================

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
        raise HTTPException(
            status_code=400,
            detail="Invalid filter type",
        )

    unique_filename = (
        f"{uuid.uuid4()}.jpg"
    )

    input_path = os.path.join(
        UPLOAD_DIR,
        unique_filename,
    )

    output_path = os.path.join(
        PROCESSED_DIR,
        f"filtered_{unique_filename}",
    )

    with open(input_path, "wb") as f:
        content = await file.read()
        f.write(content)

    apply_filter_image(
        input_path,
        output_path,
        filter_type,
    )

    return FileResponse(
        output_path,
        media_type="image/jpeg",
        filename="filtered-image.jpg",
    )