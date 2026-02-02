from fastapi import FastAPI, APIRouter, HTTPException, Query, UploadFile, File, Form
from fastapi.responses import FileResponse, RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Boolean, Integer, Float, Text, DateTime, select, update, delete, func, text
from sqlalchemy.dialects.postgresql import ARRAY
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import shutil
import boto3
from botocore.config import Config

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create uploads directory (fallback for local storage)
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

# PostgreSQL Configuration
DATABASE_URL = os.environ.get('DATABASE_URL', '')
DB_SCHEMA = os.environ.get('DB_SCHEMA', 'muestra')

# Convert postgres:// to postgresql+asyncpg:// and remove sslmode parameter
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql+asyncpg://', 1)

# Remove sslmode from URL for asyncpg (it doesn't support it as URL param)
if '?sslmode=' in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.split('?sslmode=')[0]
elif '&sslmode=' in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace('&sslmode=disable', '').replace('&sslmode=require', '')

# Create async engine
engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Cloudflare R2 Configuration
R2_ACCOUNT_ID = os.environ.get('R2_ACCOUNT_ID')
R2_ACCESS_KEY_ID = os.environ.get('R2_ACCESS_KEY_ID')
R2_SECRET_ACCESS_KEY = os.environ.get('R2_SECRET_ACCESS_KEY')
R2_BUCKET_NAME = os.environ.get('R2_BUCKET_NAME', 'muestras')
R2_ENDPOINT = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com" if R2_ACCOUNT_ID else None

# Initialize R2 client
r2_client = None
if R2_ACCOUNT_ID and R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY:
    r2_client = boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(signature_version='s3v4'),
        region_name='auto'
    )
    logging.info(f"R2 client initialized for bucket: {R2_BUCKET_NAME}")

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============ SQLAlchemy Models ============

class Base(DeclarativeBase):
    pass

class MarcaDB(Base):
    __tablename__ = "marcas"
    __table_args__ = {"schema": DB_SCHEMA}
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    descripcion: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    orden: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class TipoProductoDB(Base):
    __tablename__ = "tipos_producto"
    __table_args__ = {"schema": DB_SCHEMA}
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    descripcion: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    orden: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class EntalloDB(Base):
    __tablename__ = "entalles"
    __table_args__ = {"schema": DB_SCHEMA}
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    descripcion: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    orden: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class TelaDB(Base):
    __tablename__ = "telas"
    __table_args__ = {"schema": DB_SCHEMA}
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    descripcion: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    gramaje: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    elasticidad: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    proveedor: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    ancho: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    color: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    precio: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    clasificacion: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    orden: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class HiloDB(Base):
    __tablename__ = "hilos"
    __table_args__ = {"schema": DB_SCHEMA}
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    orden: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class MuestraBaseDB(Base):
    __tablename__ = "muestras_base"
    __table_args__ = {"schema": DB_SCHEMA}
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nombre: Mapped[str] = mapped_column(String(500), nullable=False)
    marca_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    tipo_producto_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    entalle_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    tela_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    consumo_tela: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    costo_estimado: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    precio_estimado: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    rentabilidad_esperada: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    aprobado: Mapped[bool] = mapped_column(Boolean, default=False)
    archivo_costos: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    orden: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class BaseDB(Base):
    __tablename__ = "bases"
    __table_args__ = {"schema": DB_SCHEMA}
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nombre: Mapped[str] = mapped_column(String(500), nullable=False)
    muestra_base_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    hilo_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    patron_archivo: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    imagen_archivo: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    fichas_archivos: Mapped[List[str]] = mapped_column(ARRAY(String), default=list)
    fichas_nombres: Mapped[List[str]] = mapped_column(ARRAY(String), default=list)
    tizados_archivos: Mapped[List[str]] = mapped_column(ARRAY(String), default=list)
    tizados_nombres: Mapped[List[str]] = mapped_column(ARRAY(String), default=list)
    aprobado: Mapped[bool] = mapped_column(Boolean, default=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    orden: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class FichaDB(Base):
    __tablename__ = "fichas"
    __table_args__ = {"schema": DB_SCHEMA}
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    descripcion: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    archivo: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    orden: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class TizadoDB(Base):
    __tablename__ = "tizados"
    __table_args__ = {"schema": DB_SCHEMA}
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    ancho: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    curva: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    archivo_tizado: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    bases_ids: Mapped[List[str]] = mapped_column(ARRAY(String), default=list)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    orden: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

# ============ Pydantic Schemas ============

class MarcaCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    activo: bool = True

class Marca(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    nombre: str
    descripcion: Optional[str] = None
    activo: bool = True
    orden: int = 0

class TipoProductoCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    activo: bool = True

class TipoProducto(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    nombre: str
    descripcion: Optional[str] = None
    activo: bool = True
    orden: int = 0

class EntalleCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    activo: bool = True

class Entalle(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    nombre: str
    descripcion: Optional[str] = None
    activo: bool = True
    orden: int = 0

class TelaCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    gramaje: Optional[float] = None
    elasticidad: Optional[str] = None
    proveedor: Optional[str] = None
    ancho: Optional[float] = None
    color: Optional[str] = None
    precio: Optional[float] = None
    clasificacion: Optional[str] = None
    activo: bool = True

class Tela(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    nombre: str
    descripcion: Optional[str] = None
    gramaje: Optional[float] = None
    elasticidad: Optional[str] = None
    proveedor: Optional[str] = None
    ancho: Optional[float] = None
    color: Optional[str] = None
    precio: Optional[float] = None
    clasificacion: Optional[str] = None
    activo: bool = True
    orden: int = 0

class HiloCreate(BaseModel):
    nombre: str
    activo: bool = True

class Hilo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    nombre: str
    activo: bool = True
    orden: int = 0

class MuestraBaseCreate(BaseModel):
    marca_id: Optional[str] = None
    tipo_producto_id: Optional[str] = None
    entalle_id: Optional[str] = None
    tela_id: Optional[str] = None
    consumo_tela: Optional[float] = None
    costo_estimado: Optional[float] = None
    precio_estimado: Optional[float] = None
    aprobado: bool = False

class MuestraBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    nombre: str
    marca_id: Optional[str] = None
    tipo_producto_id: Optional[str] = None
    entalle_id: Optional[str] = None
    tela_id: Optional[str] = None
    consumo_tela: Optional[float] = None
    costo_estimado: Optional[float] = None
    precio_estimado: Optional[float] = None
    rentabilidad_esperada: Optional[float] = None
    aprobado: bool = False
    archivo_costos: Optional[str] = None
    activo: bool = True
    orden: int = 0

class BaseCreate(BaseModel):
    nombre: Optional[str] = None
    muestra_base_id: Optional[str] = None
    hilo_id: Optional[str] = None
    aprobado: bool = False

class BaseModel_(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    nombre: str
    muestra_base_id: Optional[str] = None
    hilo_id: Optional[str] = None
    patron_archivo: Optional[str] = None
    imagen_archivo: Optional[str] = None
    fichas_archivos: List[str] = []
    fichas_nombres: List[str] = []
    tizados_archivos: List[str] = []
    tizados_nombres: List[str] = []
    aprobado: bool = False
    activo: bool = True
    orden: int = 0

class FichaCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    activo: bool = True

class Ficha(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    nombre: str
    descripcion: Optional[str] = None
    archivo: Optional[str] = None
    activo: bool = True
    orden: int = 0

class TizadoCreate(BaseModel):
    nombre: str
    ancho: Optional[float] = None
    curva: Optional[str] = None
    bases_ids: List[str] = []
    activo: bool = True

class Tizado(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    nombre: str
    ancho: Optional[float] = None
    curva: Optional[str] = None
    archivo_tizado: Optional[str] = None
    bases_ids: List[str] = []
    activo: bool = True
    orden: int = 0

# ============ Database Initialization ============

async def init_db():
    """Create schema and tables if they don't exist"""
    async with engine.begin() as conn:
        # Create schema if not exists
        await conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {DB_SCHEMA}"))
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
    logging.info(f"Database initialized with schema: {DB_SCHEMA}")

@app.on_event("startup")
async def startup():
    await init_db()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ FILE UPLOAD HELPER ============

async def save_upload_file(file: UploadFile, subfolder: str, custom_name: str = None) -> str:
    """Save uploaded file to R2 (or local if R2 not configured)
    
    Args:
        file: The uploaded file
        subfolder: Category folder (costos, patrones, etc.)
        custom_name: Optional custom name for the file (without extension)
    """
    ext = Path(file.filename).suffix if file.filename else ""
    
    # Use custom name if provided, otherwise use original filename (sanitized)
    if custom_name and custom_name.strip():
        # Sanitize custom name: remove special chars, keep alphanumeric, spaces, hyphens, underscores
        safe_name = "".join(c for c in custom_name if c.isalnum() or c in (' ', '-', '_')).strip()
        safe_name = safe_name.replace(' ', '_')
        if not safe_name:
            safe_name = str(uuid.uuid4())
    else:
        # Use original filename without extension, sanitized
        original_name = Path(file.filename).stem if file.filename else str(uuid.uuid4())
        safe_name = "".join(c for c in original_name if c.isalnum() or c in (' ', '-', '_')).strip()
        safe_name = safe_name.replace(' ', '_')
        if not safe_name:
            safe_name = str(uuid.uuid4())
    
    # Add UUID suffix to avoid collisions
    file_id = str(uuid.uuid4())[:8]
    filename = f"{safe_name}_{file_id}{ext}"
    key = f"{subfolder}/{filename}"
    
    if r2_client:
        try:
            file_content = await file.read()
            content_type = file.content_type or 'application/octet-stream'
            r2_client.put_object(
                Bucket=R2_BUCKET_NAME,
                Key=key,
                Body=file_content,
                ContentType=content_type
            )
            return f"r2://{key}"
        except Exception as e:
            logging.error(f"Error uploading to R2: {e}")
            raise HTTPException(status_code=500, detail=f"Error al subir archivo: {str(e)}")
    else:
        folder = UPLOADS_DIR / subfolder
        folder.mkdir(exist_ok=True)
        file_path = folder / filename
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        return f"{subfolder}/{filename}"

def get_r2_presigned_url(key: str, expiration: int = 3600) -> str:
    """Generate a presigned URL for R2 file access"""
    if not r2_client:
        return None
    try:
        if key.startswith("r2://"):
            key = key[5:]
        url = r2_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': R2_BUCKET_NAME, 'Key': key},
            ExpiresIn=expiration
        )
        return url
    except Exception as e:
        logging.error(f"Error generating presigned URL: {e}")
        return None

# ============ Helper Functions ============

def calculate_rentabilidad(costo: float, precio: float) -> float:
    """Calculate profitability percentage"""
    if costo and precio and costo > 0:
        return round(((precio - costo) / costo) * 100, 2)
    return None

async def generate_muestra_base_name(session: AsyncSession, marca_id: str, tipo_id: str, entalle_id: str, tela_id: str) -> str:
    """Generate automatic name for MuestraBase"""
    parts = []
    if marca_id:
        result = await session.execute(select(MarcaDB).where(MarcaDB.id == marca_id))
        marca = result.scalar_one_or_none()
        if marca:
            parts.append(marca.nombre)
    if tipo_id:
        result = await session.execute(select(TipoProductoDB).where(TipoProductoDB.id == tipo_id))
        tipo = result.scalar_one_or_none()
        if tipo:
            parts.append(tipo.nombre)
    if tela_id:
        result = await session.execute(select(TelaDB).where(TelaDB.id == tela_id))
        tela = result.scalar_one_or_none()
        if tela:
            parts.append(tela.nombre)
    if entalle_id:
        result = await session.execute(select(EntalloDB).where(EntalloDB.id == entalle_id))
        entalle = result.scalar_one_or_none()
        if entalle:
            parts.append(entalle.nombre)
    return "-".join(parts) if parts else "Nueva Muestra"

# ============ ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "API Módulo Muestras Textil - PostgreSQL"}

# ============ FILE ROUTES ============

@api_router.post("/upload/{category}")
async def upload_file(category: str, file: UploadFile = File(...), custom_name: str = Form(None)):
    allowed_categories = ["costos", "patrones", "imagenes", "fichas", "tizados", "fichas_bases", "tizados_bases"]
    if category not in allowed_categories:
        raise HTTPException(status_code=400, detail="Categoría no válida")
    file_path = await save_upload_file(file, category, custom_name)
    return {"file_path": file_path, "filename": file.filename}

@api_router.get("/files/{category}/{filename}")
async def get_file(category: str, filename: str):
    key = f"{category}/{filename}"
    if r2_client:
        presigned_url = get_r2_presigned_url(key)
        if presigned_url:
            return RedirectResponse(url=presigned_url)
    file_path = UPLOADS_DIR / category / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return FileResponse(file_path)

# ============ DASHBOARD ============

@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    async with async_session() as session:
        stats = {}
        for model, name in [(MarcaDB, "marcas"), (TipoProductoDB, "tipos_producto"), (EntalloDB, "entalles"),
                            (TelaDB, "telas"), (HiloDB, "hilos"), (MuestraBaseDB, "muestras_base"),
                            (BaseDB, "bases"), (FichaDB, "fichas"), (TizadoDB, "tizados")]:
            result = await session.execute(select(func.count()).select_from(model))
            stats[name] = result.scalar()
        return stats

# ============ MARCAS ROUTES ============

@api_router.get("/marcas")
async def get_marcas(search: str = "", activo: Optional[bool] = None):
    async with async_session() as session:
        query = select(MarcaDB)
        if search:
            query = query.where(MarcaDB.nombre.ilike(f"%{search}%"))
        if activo is not None:
            query = query.where(MarcaDB.activo == activo)
        query = query.order_by(MarcaDB.orden)
        result = await session.execute(query)
        return [Marca.model_validate(m) for m in result.scalars().all()]

@api_router.post("/marcas", response_model=Marca)
async def create_marca(data: MarcaCreate):
    async with async_session() as session:
        result = await session.execute(select(func.coalesce(func.max(MarcaDB.orden), 0)))
        max_orden = result.scalar()
        item = MarcaDB(**data.model_dump(), orden=max_orden + 1)
        session.add(item)
        await session.commit()
        await session.refresh(item)
        return Marca.model_validate(item)

@api_router.put("/marcas/{item_id}", response_model=Marca)
async def update_marca(item_id: str, data: MarcaCreate):
    async with async_session() as session:
        result = await session.execute(select(MarcaDB).where(MarcaDB.id == item_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="No encontrado")
        for key, value in data.model_dump().items():
            setattr(item, key, value)
        item.updated_at = datetime.now(timezone.utc)
        await session.commit()
        await session.refresh(item)
        return Marca.model_validate(item)

@api_router.delete("/marcas/{item_id}")
async def delete_marca(item_id: str):
    async with async_session() as session:
        result = await session.execute(select(MarcaDB).where(MarcaDB.id == item_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="No encontrado")
        await session.delete(item)
        await session.commit()
        return {"message": "Eliminado correctamente"}

@api_router.get("/marcas/count")
async def count_marcas():
    async with async_session() as session:
        result = await session.execute(select(func.count()).select_from(MarcaDB))
        return {"count": result.scalar()}

@api_router.put("/reorder/marcas")
async def reorder_marcas(items: List[dict]):
    async with async_session() as session:
        for item in items:
            await session.execute(update(MarcaDB).where(MarcaDB.id == item["id"]).values(orden=item["orden"]))
        await session.commit()
        return {"message": "Orden actualizado"}

# ============ TIPOS PRODUCTO ROUTES ============

@api_router.get("/tipos-producto")
async def get_tipos_producto(search: str = "", activo: Optional[bool] = None):
    async with async_session() as session:
        query = select(TipoProductoDB)
        if search:
            query = query.where(TipoProductoDB.nombre.ilike(f"%{search}%"))
        if activo is not None:
            query = query.where(TipoProductoDB.activo == activo)
        query = query.order_by(TipoProductoDB.orden)
        result = await session.execute(query)
        return [TipoProducto.model_validate(m) for m in result.scalars().all()]

@api_router.post("/tipos-producto", response_model=TipoProducto)
async def create_tipo_producto(data: TipoProductoCreate):
    async with async_session() as session:
        result = await session.execute(select(func.coalesce(func.max(TipoProductoDB.orden), 0)))
        max_orden = result.scalar()
        item = TipoProductoDB(**data.model_dump(), orden=max_orden + 1)
        session.add(item)
        await session.commit()
        await session.refresh(item)
        return TipoProducto.model_validate(item)

@api_router.put("/tipos-producto/{item_id}", response_model=TipoProducto)
async def update_tipo_producto(item_id: str, data: TipoProductoCreate):
    async with async_session() as session:
        result = await session.execute(select(TipoProductoDB).where(TipoProductoDB.id == item_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="No encontrado")
        for key, value in data.model_dump().items():
            setattr(item, key, value)
        item.updated_at = datetime.now(timezone.utc)
        await session.commit()
        await session.refresh(item)
        return TipoProducto.model_validate(item)

@api_router.delete("/tipos-producto/{item_id}")
async def delete_tipo_producto(item_id: str):
    async with async_session() as session:
        result = await session.execute(select(TipoProductoDB).where(TipoProductoDB.id == item_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="No encontrado")
        await session.delete(item)
        await session.commit()
        return {"message": "Eliminado correctamente"}

@api_router.get("/tipos-producto/count")
async def count_tipos_producto():
    async with async_session() as session:
        result = await session.execute(select(func.count()).select_from(TipoProductoDB))
        return {"count": result.scalar()}

@api_router.put("/reorder/tipos-producto")
async def reorder_tipos_producto(items: List[dict]):
    async with async_session() as session:
        for item in items:
            await session.execute(update(TipoProductoDB).where(TipoProductoDB.id == item["id"]).values(orden=item["orden"]))
        await session.commit()
        return {"message": "Orden actualizado"}

# ============ ENTALLES ROUTES ============

@api_router.get("/entalles")
async def get_entalles(search: str = "", activo: Optional[bool] = None):
    async with async_session() as session:
        query = select(EntalloDB)
        if search:
            query = query.where(EntalloDB.nombre.ilike(f"%{search}%"))
        if activo is not None:
            query = query.where(EntalloDB.activo == activo)
        query = query.order_by(EntalloDB.orden)
        result = await session.execute(query)
        return [Entalle.model_validate(m) for m in result.scalars().all()]

@api_router.post("/entalles", response_model=Entalle)
async def create_entalle(data: EntalleCreate):
    async with async_session() as session:
        result = await session.execute(select(func.coalesce(func.max(EntalloDB.orden), 0)))
        max_orden = result.scalar()
        item = EntalloDB(**data.model_dump(), orden=max_orden + 1)
        session.add(item)
        await session.commit()
        await session.refresh(item)
        return Entalle.model_validate(item)

@api_router.put("/entalles/{item_id}", response_model=Entalle)
async def update_entalle(item_id: str, data: EntalleCreate):
    async with async_session() as session:
        result = await session.execute(select(EntalloDB).where(EntalloDB.id == item_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="No encontrado")
        for key, value in data.model_dump().items():
            setattr(item, key, value)
        item.updated_at = datetime.now(timezone.utc)
        await session.commit()
        await session.refresh(item)
        return Entalle.model_validate(item)

@api_router.delete("/entalles/{item_id}")
async def delete_entalle(item_id: str):
    async with async_session() as session:
        result = await session.execute(select(EntalloDB).where(EntalloDB.id == item_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="No encontrado")
        await session.delete(item)
        await session.commit()
        return {"message": "Eliminado correctamente"}

@api_router.get("/entalles/count")
async def count_entalles():
    async with async_session() as session:
        result = await session.execute(select(func.count()).select_from(EntalloDB))
        return {"count": result.scalar()}

@api_router.put("/reorder/entalles")
async def reorder_entalles(items: List[dict]):
    async with async_session() as session:
        for item in items:
            await session.execute(update(EntalloDB).where(EntalloDB.id == item["id"]).values(orden=item["orden"]))
        await session.commit()
        return {"message": "Orden actualizado"}

# ============ TELAS ROUTES ============

@api_router.get("/telas")
async def get_telas(search: str = "", activo: Optional[bool] = None):
    async with async_session() as session:
        query = select(TelaDB)
        if search:
            query = query.where(TelaDB.nombre.ilike(f"%{search}%"))
        if activo is not None:
            query = query.where(TelaDB.activo == activo)
        query = query.order_by(TelaDB.orden)
        result = await session.execute(query)
        return [Tela.model_validate(m) for m in result.scalars().all()]

@api_router.post("/telas", response_model=Tela)
async def create_tela(data: TelaCreate):
    async with async_session() as session:
        result = await session.execute(select(func.coalesce(func.max(TelaDB.orden), 0)))
        max_orden = result.scalar()
        item = TelaDB(**data.model_dump(), orden=max_orden + 1)
        session.add(item)
        await session.commit()
        await session.refresh(item)
        return Tela.model_validate(item)

@api_router.put("/telas/{item_id}", response_model=Tela)
async def update_tela(item_id: str, data: TelaCreate):
    async with async_session() as session:
        result = await session.execute(select(TelaDB).where(TelaDB.id == item_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="No encontrado")
        for key, value in data.model_dump().items():
            setattr(item, key, value)
        item.updated_at = datetime.now(timezone.utc)
        await session.commit()
        await session.refresh(item)
        return Tela.model_validate(item)

@api_router.delete("/telas/{item_id}")
async def delete_tela(item_id: str):
    async with async_session() as session:
        result = await session.execute(select(TelaDB).where(TelaDB.id == item_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="No encontrado")
        await session.delete(item)
        await session.commit()
        return {"message": "Eliminado correctamente"}

@api_router.get("/telas/count")
async def count_telas():
    async with async_session() as session:
        result = await session.execute(select(func.count()).select_from(TelaDB))
        return {"count": result.scalar()}

@api_router.put("/reorder/telas")
async def reorder_telas(items: List[dict]):
    async with async_session() as session:
        for item in items:
            await session.execute(update(TelaDB).where(TelaDB.id == item["id"]).values(orden=item["orden"]))
        await session.commit()
        return {"message": "Orden actualizado"}

# ============ HILOS ROUTES ============

@api_router.get("/hilos")
async def get_hilos(search: str = "", activo: Optional[bool] = None):
    async with async_session() as session:
        query = select(HiloDB)
        if search:
            query = query.where(HiloDB.nombre.ilike(f"%{search}%"))
        if activo is not None:
            query = query.where(HiloDB.activo == activo)
        query = query.order_by(HiloDB.orden)
        result = await session.execute(query)
        return [Hilo.model_validate(m) for m in result.scalars().all()]

@api_router.post("/hilos", response_model=Hilo)
async def create_hilo(data: HiloCreate):
    async with async_session() as session:
        result = await session.execute(select(func.coalesce(func.max(HiloDB.orden), 0)))
        max_orden = result.scalar()
        item = HiloDB(**data.model_dump(), orden=max_orden + 1)
        session.add(item)
        await session.commit()
        await session.refresh(item)
        return Hilo.model_validate(item)

@api_router.put("/hilos/{item_id}", response_model=Hilo)
async def update_hilo(item_id: str, data: HiloCreate):
    async with async_session() as session:
        result = await session.execute(select(HiloDB).where(HiloDB.id == item_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="No encontrado")
        for key, value in data.model_dump().items():
            setattr(item, key, value)
        item.updated_at = datetime.now(timezone.utc)
        await session.commit()
        await session.refresh(item)
        return Hilo.model_validate(item)

@api_router.delete("/hilos/{item_id}")
async def delete_hilo(item_id: str):
    async with async_session() as session:
        result = await session.execute(select(HiloDB).where(HiloDB.id == item_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="No encontrado")
        await session.delete(item)
        await session.commit()
        return {"message": "Eliminado correctamente"}

@api_router.get("/hilos/count")
async def count_hilos():
    async with async_session() as session:
        result = await session.execute(select(func.count()).select_from(HiloDB))
        return {"count": result.scalar()}

@api_router.put("/reorder/hilos")
async def reorder_hilos(items: List[dict]):
    async with async_session() as session:
        for item in items:
            await session.execute(update(HiloDB).where(HiloDB.id == item["id"]).values(orden=item["orden"]))
        await session.commit()
        return {"message": "Orden actualizado"}

# ============ MUESTRAS BASE ROUTES ============

@api_router.get("/muestras-base")
async def get_muestras_base(search: str = "", activo: Optional[bool] = None):
    async with async_session() as session:
        query = select(MuestraBaseDB)
        if search:
            query = query.where(MuestraBaseDB.nombre.ilike(f"%{search}%"))
        if activo is not None:
            query = query.where(MuestraBaseDB.activo == activo)
        query = query.order_by(MuestraBaseDB.orden)
        result = await session.execute(query)
        return [MuestraBase.model_validate(m) for m in result.scalars().all()]

@api_router.post("/muestras-base", response_model=MuestraBase)
async def create_muestra_base(data: MuestraBaseCreate):
    async with async_session() as session:
        nombre = await generate_muestra_base_name(session, data.marca_id, data.tipo_producto_id, data.entalle_id, data.tela_id)
        rentabilidad = calculate_rentabilidad(data.costo_estimado, data.precio_estimado)
        result = await session.execute(select(func.coalesce(func.max(MuestraBaseDB.orden), 0)))
        max_orden = result.scalar()
        item = MuestraBaseDB(**data.model_dump(), nombre=nombre, rentabilidad_esperada=rentabilidad, orden=max_orden + 1)
        session.add(item)
        await session.commit()
        await session.refresh(item)
        return MuestraBase.model_validate(item)

@api_router.put("/muestras-base/{item_id}", response_model=MuestraBase)
async def update_muestra_base(item_id: str, data: MuestraBaseCreate):
    async with async_session() as session:
        result = await session.execute(select(MuestraBaseDB).where(MuestraBaseDB.id == item_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="No encontrado")
        nombre = await generate_muestra_base_name(session, data.marca_id, data.tipo_producto_id, data.entalle_id, data.tela_id)
        rentabilidad = calculate_rentabilidad(data.costo_estimado, data.precio_estimado)
        for key, value in data.model_dump().items():
            setattr(item, key, value)
        item.nombre = nombre
        item.rentabilidad_esperada = rentabilidad
        item.updated_at = datetime.now(timezone.utc)
        await session.commit()
        await session.refresh(item)
        return MuestraBase.model_validate(item)

@api_router.delete("/muestras-base/{item_id}")
async def delete_muestra_base(item_id: str):
    async with async_session() as session:
        result = await session.execute(select(MuestraBaseDB).where(MuestraBaseDB.id == item_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="No encontrado")
        await session.delete(item)
        await session.commit()
        return {"message": "Eliminado correctamente"}

@api_router.get("/muestras-base/count")
async def count_muestras_base():
    async with async_session() as session:
        result = await session.execute(select(func.count()).select_from(MuestraBaseDB))
        return {"count": result.scalar()}

@api_router.post("/muestras-base/{item_id}/archivo")
async def upload_archivo_costos(item_id: str, file: UploadFile = File(...)):
    async with async_session() as session:
        result = await session.execute(select(MuestraBaseDB).where(MuestraBaseDB.id == item_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="No encontrado")
        # Use original filename
        file_path = await save_upload_file(file, "costos", None)
        item.archivo_costos = file_path
        item.updated_at = datetime.now(timezone.utc)
        await session.commit()
        return {"file_path": file_path}

# ============ BASES ROUTES ============

@api_router.get("/bases")
async def get_bases(search: str = "", activo: Optional[bool] = None):
    async with async_session() as session:
        query = select(BaseDB)
        if search:
            query = query.where(BaseDB.nombre.ilike(f"%{search}%"))
        if activo is not None:
            query = query.where(BaseDB.activo == activo)
        query = query.order_by(BaseDB.orden)
        result = await session.execute(query)
        bases = result.scalars().all()
        
        # Get all tizados to find relationships
        tizados_result = await session.execute(select(TizadoDB))
        all_tizados = tizados_result.scalars().all()
        
        # Build response with tizados_relacionados
        response = []
        for base in bases:
            base_dict = BaseModel_.model_validate(base).model_dump()
            # Find tizados that have this base in their bases_ids
            tizados_rel = [
                {"id": t.id, "nombre": t.nombre}
                for t in all_tizados 
                if base.id in (t.bases_ids or [])
            ]
            base_dict["tizados_relacionados"] = tizados_rel
            response.append(base_dict)
        
        return response

@api_router.post("/bases", response_model=BaseModel_)
async def create_base(data: BaseCreate):
    async with async_session() as session:
        result = await session.execute(select(func.coalesce(func.max(BaseDB.orden), 0)))
        max_orden = result.scalar()
        item_data = data.model_dump()
        # Usar nombre proporcionado o dejar vacío
        item_data['nombre'] = data.nombre or ''
        item = BaseDB(**item_data, orden=max_orden + 1)
        session.add(item)
        await session.commit()
        await session.refresh(item)
        return BaseModel_.model_validate(item)

@api_router.put("/bases/{item_id}", response_model=BaseModel_)
async def update_base(item_id: str, data: BaseCreate):
    async with async_session() as session:
        result = await session.execute(select(BaseDB).where(BaseDB.id == item_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="No encontrado")
        for key, value in data.model_dump().items():
            setattr(item, key, value)
        # Usar nombre proporcionado o dejar vacío
        item.nombre = data.nombre or ''
        item.updated_at = datetime.now(timezone.utc)
        await session.commit()
        await session.refresh(item)
        return BaseModel_.model_validate(item)

@api_router.delete("/bases/{item_id}")
async def delete_base(item_id: str):
    async with async_session() as session:
        result = await session.execute(select(BaseDB).where(BaseDB.id == item_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="No encontrado")
        await session.delete(item)
        await session.commit()
        return {"message": "Eliminado correctamente"}

@api_router.get("/bases/count")
async def count_bases():
    async with async_session() as session:
        result = await session.execute(select(func.count()).select_from(BaseDB))
        return {"count": result.scalar()}

@api_router.post("/bases/{base_id}/patron")
async def upload_patron(base_id: str, file: UploadFile = File(...)):
    async with async_session() as session:
        result = await session.execute(select(BaseDB).where(BaseDB.id == base_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="No encontrado")
        # Use original filename
        file_path = await save_upload_file(file, "patrones", None)
        item.patron_archivo = file_path
        item.updated_at = datetime.now(timezone.utc)
        await session.commit()
        return {"file_path": file_path}

@api_router.post("/bases/{base_id}/imagen")
async def upload_imagen(base_id: str, file: UploadFile = File(...)):
    async with async_session() as session:
        result = await session.execute(select(BaseDB).where(BaseDB.id == base_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="No encontrado")
        # Use original filename
        file_path = await save_upload_file(file, "imagenes", None)
        item.imagen_archivo = file_path
        item.updated_at = datetime.now(timezone.utc)
        await session.commit()
        return {"file_path": file_path}

@api_router.post("/bases/{base_id}/fichas")
async def upload_fichas(base_id: str, files: List[UploadFile] = File(...), nombres: List[str] = Form(default=[])):
    async with async_session() as session:
        result = await session.execute(select(BaseDB).where(BaseDB.id == base_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="No encontrado")
        if not files:
            raise HTTPException(status_code=400, detail="Se requiere al menos un archivo")
        
        file_paths = []
        new_nombres = []
        for i, file in enumerate(files):
            # Use custom name if provided, otherwise use original filename
            custom_name = nombres[i] if i < len(nombres) and nombres[i] else None
            file_path = await save_upload_file(file, "fichas_bases", custom_name)
            file_paths.append(file_path)
            
            # Store the display name
            if custom_name:
                new_nombres.append(custom_name)
            else:
                # Use original filename as display name
                new_nombres.append(file.filename or file_path.split('/')[-1])
        
        item.fichas_archivos = (item.fichas_archivos or []) + file_paths
        item.fichas_nombres = (item.fichas_nombres or []) + new_nombres
        item.updated_at = datetime.now(timezone.utc)
        await session.commit()
        return {"file_paths": file_paths, "nombres": new_nombres}

@api_router.delete("/bases/{base_id}/fichas/{file_index}")
async def delete_ficha(base_id: str, file_index: int):
    async with async_session() as session:
        result = await session.execute(select(BaseDB).where(BaseDB.id == base_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="No encontrado")
        
        fichas = list(item.fichas_archivos or [])
        nombres = list(item.fichas_nombres or [])
        
        if file_index < 0 or file_index >= len(fichas):
            raise HTTPException(status_code=400, detail="Índice inválido")
        
        fichas.pop(file_index)
        if file_index < len(nombres):
            nombres.pop(file_index)
        
        item.fichas_archivos = fichas
        item.fichas_nombres = nombres
        item.updated_at = datetime.now(timezone.utc)
        await session.commit()
        return {"message": "Eliminado"}

@api_router.post("/bases/{base_id}/tizados")
async def upload_tizados(base_id: str, files: List[UploadFile] = File(...), nombres: List[str] = Form(default=[])):
    async with async_session() as session:
        result = await session.execute(select(BaseDB).where(BaseDB.id == base_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="No encontrado")
        if not files:
            raise HTTPException(status_code=400, detail="Se requiere al menos un archivo")
        
        file_paths = []
        new_nombres = []
        for i, file in enumerate(files):
            # Use custom name if provided, otherwise use original filename
            custom_name = nombres[i] if i < len(nombres) and nombres[i] else None
            file_path = await save_upload_file(file, "tizados_bases", custom_name)
            file_paths.append(file_path)
            
            # Store the display name
            if custom_name:
                new_nombres.append(custom_name)
            else:
                # Use original filename as display name
                new_nombres.append(file.filename or file_path.split('/')[-1])
        
        item.tizados_archivos = (item.tizados_archivos or []) + file_paths
        item.tizados_nombres = (item.tizados_nombres or []) + new_nombres
        item.updated_at = datetime.now(timezone.utc)
        await session.commit()
        return {"file_paths": file_paths, "nombres": new_nombres}

@api_router.delete("/bases/{base_id}/tizados/{file_index}")
async def delete_tizado(base_id: str, file_index: int):
    async with async_session() as session:
        result = await session.execute(select(BaseDB).where(BaseDB.id == base_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="No encontrado")
        
        tizados = list(item.tizados_archivos or [])
        nombres = list(item.tizados_nombres or [])
        
        if file_index < 0 or file_index >= len(tizados):
            raise HTTPException(status_code=400, detail="Índice inválido")
        
        tizados.pop(file_index)
        if file_index < len(nombres):
            nombres.pop(file_index)
        
        item.tizados_archivos = tizados
        item.tizados_nombres = nombres
        item.updated_at = datetime.now(timezone.utc)
        await session.commit()
        return {"message": "Eliminado"}

# ============ FICHAS ROUTES ============

@api_router.get("/fichas")
async def get_fichas(search: str = "", activo: Optional[bool] = None):
    async with async_session() as session:
        query = select(FichaDB)
        if search:
            query = query.where(FichaDB.nombre.ilike(f"%{search}%"))
        if activo is not None:
            query = query.where(FichaDB.activo == activo)
        query = query.order_by(FichaDB.orden)
        result = await session.execute(query)
        return [Ficha.model_validate(m) for m in result.scalars().all()]

@api_router.post("/fichas", response_model=Ficha)
async def create_ficha(data: FichaCreate):
    async with async_session() as session:
        result = await session.execute(select(func.coalesce(func.max(FichaDB.orden), 0)))
        max_orden = result.scalar()
        item = FichaDB(**data.model_dump(), orden=max_orden + 1)
        session.add(item)
        await session.commit()
        await session.refresh(item)
        return Ficha.model_validate(item)

@api_router.put("/fichas/{item_id}", response_model=Ficha)
async def update_ficha(item_id: str, data: FichaCreate):
    async with async_session() as session:
        result = await session.execute(select(FichaDB).where(FichaDB.id == item_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="No encontrado")
        for key, value in data.model_dump().items():
            setattr(item, key, value)
        item.updated_at = datetime.now(timezone.utc)
        await session.commit()
        await session.refresh(item)
        return Ficha.model_validate(item)

@api_router.delete("/fichas/{item_id}")
async def delete_ficha_item(item_id: str):
    async with async_session() as session:
        result = await session.execute(select(FichaDB).where(FichaDB.id == item_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="No encontrado")
        await session.delete(item)
        await session.commit()
        return {"message": "Eliminado correctamente"}

@api_router.get("/fichas/count")
async def count_fichas():
    async with async_session() as session:
        result = await session.execute(select(func.count()).select_from(FichaDB))
        return {"count": result.scalar()}

@api_router.post("/fichas/{item_id}/archivo")
async def upload_ficha_archivo(item_id: str, file: UploadFile = File(...)):
    async with async_session() as session:
        result = await session.execute(select(FichaDB).where(FichaDB.id == item_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="No encontrado")
        # Use original filename
        file_path = await save_upload_file(file, "fichas", None)
        item.archivo = file_path
        item.updated_at = datetime.now(timezone.utc)
        await session.commit()
        return {"file_path": file_path}

# ============ TIZADOS ROUTES ============

@api_router.get("/tizados")
async def get_tizados(search: str = "", activo: Optional[bool] = None):
    async with async_session() as session:
        query = select(TizadoDB)
        if search:
            query = query.where(TizadoDB.nombre.ilike(f"%{search}%"))
        if activo is not None:
            query = query.where(TizadoDB.activo == activo)
        query = query.order_by(TizadoDB.orden)
        result = await session.execute(query)
        return [Tizado.model_validate(m) for m in result.scalars().all()]

@api_router.post("/tizados", response_model=Tizado)
async def create_tizado(data: TizadoCreate):
    async with async_session() as session:
        result = await session.execute(select(func.coalesce(func.max(TizadoDB.orden), 0)))
        max_orden = result.scalar()
        item = TizadoDB(**data.model_dump(), orden=max_orden + 1)
        session.add(item)
        await session.commit()
        await session.refresh(item)
        return Tizado.model_validate(item)

@api_router.put("/tizados/{item_id}", response_model=Tizado)
async def update_tizado(item_id: str, data: TizadoCreate):
    async with async_session() as session:
        result = await session.execute(select(TizadoDB).where(TizadoDB.id == item_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="No encontrado")
        for key, value in data.model_dump().items():
            setattr(item, key, value)
        item.updated_at = datetime.now(timezone.utc)
        await session.commit()
        await session.refresh(item)
        return Tizado.model_validate(item)

@api_router.delete("/tizados/{item_id}")
async def delete_tizado_item(item_id: str):
    async with async_session() as session:
        result = await session.execute(select(TizadoDB).where(TizadoDB.id == item_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="No encontrado")
        await session.delete(item)
        await session.commit()
        return {"message": "Eliminado correctamente"}

@api_router.get("/tizados/count")
async def count_tizados():
    async with async_session() as session:
        result = await session.execute(select(func.count()).select_from(TizadoDB))
        return {"count": result.scalar()}

@api_router.post("/tizados/{item_id}/archivo")
async def upload_tizado_archivo(item_id: str, file: UploadFile = File(...)):
    async with async_session() as session:
        result = await session.execute(select(TizadoDB).where(TizadoDB.id == item_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="No encontrado")
        file_path = await save_upload_file(file, "tizados")
        item.archivo_tizado = file_path
        item.updated_at = datetime.now(timezone.utc)
        await session.commit()
        return {"file_path": file_path}

# Include router
app.include_router(api_router)
