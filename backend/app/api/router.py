from fastapi import APIRouter

from app.api.routes import app_meta, auth, blocks, files, pages, search


api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(app_meta.router, prefix="/app", tags=["app"])
api_router.include_router(pages.router, prefix="/pages", tags=["pages"])
api_router.include_router(blocks.router, tags=["blocks"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
