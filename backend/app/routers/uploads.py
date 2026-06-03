import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from ..auth import get_current_user
from ..rate_limit import check_rate_limit
from ..sanitize import sanitize_svg, validate_image
from ..schemas import SvgUploadResponse, UploadResponse
from ..upload_config import UPLOAD_DIR

router = APIRouter()


@router.post("/upload/image", response_model=UploadResponse, status_code=201)
async def upload_image(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    check_rate_limit(current_user.id, "upload_image", 10, 3600)
    try:
        data, media_type = await validate_image(file)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    ext = media_type.split("/")[1]
    if ext == "jpeg":
        ext = "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    (UPLOAD_DIR / "images" / filename).write_bytes(data)
    return {"url": f"/uploads/images/{filename}"}


@router.post("/upload/svg", response_model=SvgUploadResponse, status_code=201)
async def upload_svg(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    check_rate_limit(current_user.id, "upload_svg", 10, 3600)
    if file.content_type != "image/svg+xml":
        raise HTTPException(status_code=400, detail="Only SVG files are accepted")
    try:
        svg_content = await sanitize_svg(file)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    filename = f"{uuid.uuid4()}.svg"
    (UPLOAD_DIR / "svgs" / filename).write_text(svg_content, encoding="utf-8")
    return {"svg_content": svg_content}
