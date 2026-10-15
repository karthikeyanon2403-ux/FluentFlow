from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import init_db
from app.routers.health import router as health_router
from app.routers.sessions import router as sessions_router
from app.routers.websocket import router as ws_router
from app.routers.preferences import router as preferences_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    print(f"[FluentFlow] Starting {settings.APP_NAME}...")
    await init_db()
    print("[FluentFlow] Database initialized.")
    yield
    print("[FluentFlow] Shutting down.")

app = FastAPI(
    title=settings.APP_NAME,
    description="Real-time AI English Communication Coach with low-latency spoken conversations.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"[Unhandled Error] {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again."}
    )

# Include Routers
app.include_router(health_router)
app.include_router(sessions_router)
app.include_router(ws_router)
app.include_router(preferences_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
