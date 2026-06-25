from PIL import Image, ImageOps
import cv2
import numpy as np


def open_image_correctly(input_path: str):
    image = Image.open(input_path)
    image = ImageOps.exif_transpose(image)

    if image.mode in ("RGBA", "P"):
        image = image.convert("RGB")

    return image


def resize_image(input_path: str, output_path: str, width: int, height: int):
    image = open_image_correctly(input_path)
    resized_image = image.resize((width, height))
    resized_image.save(output_path, "JPEG", quality=90)


def compress_image(input_path: str, output_path: str, quality: int):
    image = open_image_correctly(input_path)
    image.save(output_path, "JPEG", quality=quality, optimize=True)


def rotate_image(input_path: str, output_path: str, angle: int):
    image = open_image_correctly(input_path)
    rotated_image = image.rotate(-angle, expand=True)
    rotated_image.save(output_path, "JPEG", quality=90)


def crop_image(
    input_path: str,
    output_path: str,
    x: int,
    y: int,
    width: int,
    height: int,
):
    image = open_image_correctly(input_path)

    image_width, image_height = image.size

    left = max(0, x)
    top = max(0, y)
    right = min(image_width, x + width)
    bottom = min(image_height, y + height)

    cropped_image = image.crop((left, top, right, bottom))
    cropped_image.save(output_path, "JPEG", quality=90)


def sharpen_image(image):
    blurred = cv2.GaussianBlur(image, (0, 0), 1.2)
    sharpened = cv2.addWeighted(image, 1.5, blurred, -0.5, 0)
    return sharpened


def clean_paper_scan(image_cv):
    background = cv2.GaussianBlur(image_cv, (0, 0), 35)
    corrected = cv2.divide(image_cv, background, scale=255)

    lab = cv2.cvtColor(corrected, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)

    clahe = cv2.createCLAHE(clipLimit=1.8, tileGridSize=(8, 8))
    enhanced_l = clahe.apply(l_channel)

    enhanced_lab = cv2.merge((enhanced_l, a_channel, b_channel))
    enhanced_bgr = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

    denoised = cv2.bilateralFilter(enhanced_bgr, 7, 50, 50)
    sharpened = sharpen_image(denoised)

    final = cv2.convertScaleAbs(sharpened, alpha=1.08, beta=8)

    return final


def enhanced_color_scan(image_cv):
    lab = cv2.cvtColor(image_cv, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced_l = clahe.apply(l_channel)

    enhanced_lab = cv2.merge((enhanced_l, a_channel, b_channel))
    enhanced_bgr = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

    denoised = cv2.bilateralFilter(enhanced_bgr, 9, 75, 75)
    sharpened = sharpen_image(denoised)

    return sharpened


def grayscale_soft_scan(image_cv):
    gray = cv2.cvtColor(image_cv, cv2.COLOR_BGR2GRAY)

    background = cv2.GaussianBlur(gray, (0, 0), 35)
    corrected = cv2.divide(gray, background, scale=255)

    clahe = cv2.createCLAHE(clipLimit=1.8, tileGridSize=(8, 8))
    enhanced_gray = clahe.apply(corrected)

    denoised = cv2.bilateralFilter(enhanced_gray, 7, 50, 50)
    sharpened = sharpen_image(denoised)

    return sharpened


def black_white_text_scan(image_cv):
    gray = cv2.cvtColor(image_cv, cv2.COLOR_BGR2GRAY)

    background = cv2.GaussianBlur(gray, (0, 0), 35)
    corrected = cv2.divide(gray, background, scale=255)

    blurred = cv2.GaussianBlur(corrected, (3, 3), 0)

    scanned = cv2.adaptiveThreshold(
        blurred,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        41,
        12,
    )

    return scanned


def order_points(points):
    rect = np.zeros((4, 2), dtype="float32")

    s = points.sum(axis=1)
    rect[0] = points[np.argmin(s)]
    rect[2] = points[np.argmax(s)]

    diff = np.diff(points, axis=1)
    rect[1] = points[np.argmin(diff)]
    rect[3] = points[np.argmax(diff)]

    return rect


def four_point_transform(image, points):
    rect = order_points(points)
    top_left, top_right, bottom_right, bottom_left = rect

    width_a = np.linalg.norm(bottom_right - bottom_left)
    width_b = np.linalg.norm(top_right - top_left)
    max_width = int(max(width_a, width_b))

    height_a = np.linalg.norm(top_right - bottom_right)
    height_b = np.linalg.norm(top_left - bottom_left)
    max_height = int(max(height_a, height_b))

    if max_width <= 0 or max_height <= 0:
        return image

    destination = np.array(
        [
            [0, 0],
            [max_width - 1, 0],
            [max_width - 1, max_height - 1],
            [0, max_height - 1],
        ],
        dtype="float32",
    )

    matrix = cv2.getPerspectiveTransform(rect, destination)
    warped = cv2.warpPerspective(image, matrix, (max_width, max_height))

    return warped


def find_document_contour(image_cv):
    original_height, original_width = image_cv.shape[:2]

    max_dimension = 1200
    scale = 1.0

    if max(original_width, original_height) > max_dimension:
        scale = max_dimension / max(original_width, original_height)
        resized_width = int(original_width * scale)
        resized_height = int(original_height * scale)
        resized = cv2.resize(image_cv, (resized_width, resized_height))
    else:
        resized = image_cv.copy()

    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    edges = cv2.Canny(blurred, 50, 150)

    kernel = np.ones((5, 5), np.uint8)
    edges = cv2.dilate(edges, kernel, iterations=1)
    edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)

    contours, _ = cv2.findContours(
        edges,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE,
    )

    contours = sorted(contours, key=cv2.contourArea, reverse=True)

    image_area = resized.shape[0] * resized.shape[1]

    for contour in contours[:10]:
        area = cv2.contourArea(contour)

        if area < image_area * 0.15:
            continue

        perimeter = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.02 * perimeter, True)

        if len(approx) == 4:
            points = approx.reshape(4, 2).astype("float32")
            points = points / scale
            return points

    return None


def auto_crop_document(image_cv):
    document_points = find_document_contour(image_cv)

    if document_points is None:
        return image_cv

    warped = four_point_transform(image_cv, document_points)
    return warped


def apply_scan_mode(image_cv, mode: str):
    if mode == "clean":
        return clean_paper_scan(image_cv)

    if mode == "color":
        return enhanced_color_scan(image_cv)

    if mode == "gray":
        return grayscale_soft_scan(image_cv)

    if mode == "bw":
        return black_white_text_scan(image_cv)

    return clean_paper_scan(image_cv)


def scan_document_image(
    input_path: str,
    output_path: str,
    mode: str = "clean",
    auto_crop: bool = False,
):
    image = open_image_correctly(input_path)

    image_np = np.array(image)
    image_cv = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)

    if auto_crop:
        image_cv = auto_crop_document(image_cv)

    output = apply_scan_mode(image_cv, mode)

    cv2.imwrite(output_path, output)


def image_to_pdf(input_path: str, output_path: str):
    image = open_image_correctly(input_path)
    image.save(output_path, "PDF", resolution=100.0)


def scanned_image_to_pdf(
    input_path: str,
    temp_image_path: str,
    output_pdf_path: str,
    mode: str = "clean",
    auto_crop: bool = False,
):
    scan_document_image(
        input_path=input_path,
        output_path=temp_image_path,
        mode=mode,
        auto_crop=auto_crop,
    )

    image = open_image_correctly(temp_image_path)
    image.save(output_pdf_path, "PDF", resolution=100.0)


def apply_filter_image(input_path: str, output_path: str, filter_type: str):
    image = open_image_correctly(input_path)

    image_np = np.array(image)
    image_cv = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)

    if filter_type == "grayscale":
        gray = cv2.cvtColor(image_cv, cv2.COLOR_BGR2GRAY)
        output = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)

    elif filter_type == "sepia":
        sepia_matrix = np.array(
            [
                [0.272, 0.534, 0.131],
                [0.349, 0.686, 0.168],
                [0.393, 0.769, 0.189],
            ]
        )
        output = cv2.transform(image_cv, sepia_matrix)
        output = np.clip(output, 0, 255).astype(np.uint8)

    elif filter_type == "negative":
        output = 255 - image_cv

    elif filter_type == "sketch":
        gray = cv2.cvtColor(image_cv, cv2.COLOR_BGR2GRAY)
        inverted = 255 - gray
        blurred = cv2.GaussianBlur(inverted, (21, 21), 0)
        inverted_blur = 255 - blurred
        sketch = cv2.divide(gray, inverted_blur, scale=256.0)
        output = cv2.cvtColor(sketch, cv2.COLOR_GRAY2BGR)

    elif filter_type == "sharpen":
        kernel = np.array(
            [
                [0, -1, 0],
                [-1, 5, -1],
                [0, -1, 0],
            ]
        )
        output = cv2.filter2D(image_cv, -1, kernel)

    elif filter_type == "blur":
        output = cv2.GaussianBlur(image_cv, (15, 15), 0)

    elif filter_type == "warm":
        output = image_cv.copy()
        output[:, :, 2] = cv2.add(output[:, :, 2], 25)
        output[:, :, 0] = cv2.subtract(output[:, :, 0], 10)

    elif filter_type == "cool":
        output = image_cv.copy()
        output[:, :, 0] = cv2.add(output[:, :, 0], 25)
        output[:, :, 2] = cv2.subtract(output[:, :, 2], 10)

    elif filter_type == "cartoon":
        gray = cv2.cvtColor(image_cv, cv2.COLOR_BGR2GRAY)
        gray = cv2.medianBlur(gray, 5)

        edges = cv2.adaptiveThreshold(
            gray,
            255,
            cv2.ADAPTIVE_THRESH_MEAN_C,
            cv2.THRESH_BINARY,
            9,
            9,
        )

        color = cv2.bilateralFilter(image_cv, 9, 250, 250)
        edges_colored = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)
        output = cv2.bitwise_and(color, edges_colored)

    elif filter_type == "edge":
        gray = cv2.cvtColor(image_cv, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 80, 160)
        edges = 255 - edges
        output = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)

    else:
        output = image_cv

    cv2.imwrite(output_path, output)