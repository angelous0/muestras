from fastapi import FastAPI, APIRouter, HTTPException, Query, UploadFile, File, Form
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import shutil

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create uploads directory
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============ BASE MODELS ============

class BaseItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    descripcion: Optional[str] = None
    activo: bool = True
    orden: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BaseItemCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    activo: bool = True
    orden: int = 0

class BaseItemUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    activo: Optional[bool] = None
    orden: Optional[int] = None

# ============ MARCA MODELS ============

class Marca(BaseItem):
    pass

class MarcaCreate(BaseItemCreate):
    pass

class MarcaUpdate(BaseItemUpdate):
    pass

# ============ TIPO PRODUCTO MODELS ============

class TipoProducto(BaseItem):
    pass

class TipoProductoCreate(BaseItemCreate):
    pass

class TipoProductoUpdate(BaseItemUpdate):
    pass

# ============ ENTALLE MODELS ============

class Entalle(BaseItem):
    pass

class EntalleCreate(BaseItemCreate):
    pass

class EntalleUpdate(BaseItemUpdate):
    pass

# ============ TELA MODELS ============

class Tela(BaseItem):
    gramaje: Optional[float] = None  # Onzas
    elasticidad: Optional[str] = None
    proveedor: Optional[str] = None
    ancho: Optional[float] = None  # cm
    color: Optional[str] = None  # Azul, Negro, Color, Crudo
    precio: Optional[float] = None  # S/
    clasificacion: Optional[str] = None

class TelaCreate(BaseItemCreate):
    gramaje: Optional[float] = None
    elasticidad: Optional[str] = None
    proveedor: Optional[str] = None
    ancho: Optional[float] = None
    color: Optional[str] = None
    precio: Optional[float] = None
    clasificacion: Optional[str] = None

class TelaUpdate(BaseItemUpdate):
    gramaje: Optional[float] = None
    elasticidad: Optional[str] = None
    proveedor: Optional[str] = None
    ancho: Optional[float] = None
    color: Optional[str] = None
    precio: Optional[float] = None
    clasificacion: Optional[str] = None

# ============ HILO MODELS ============

class Hilo(BaseItem):
    pass

class HiloCreate(BaseItemCreate):
    pass

class HiloUpdate(BaseItemUpdate):
    pass

# ============ MUESTRA BASE MODELS ============

class MuestraBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    marca_id: Optional[str] = None
    tipo_producto_id: Optional[str] = None
    entalle_id: Optional[str] = None
    tela_id: Optional[str] = None
    consumo_tela: Optional[float] = None
    costo_estimado: Optional[float] = None
    precio_estimado: Optional[float] = None
    rentabilidad_esperada: Optional[float] = None  # Calculated field
    aprobado: bool = False
    archivo_costos: Optional[str] = None  # File path
    descripcion: Optional[str] = None
    activo: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MuestraBaseCreate(BaseModel):
    nombre: str
    marca_id: Optional[str] = None
    tipo_producto_id: Optional[str] = None
    entalle_id: Optional[str] = None
    tela_id: Optional[str] = None
    consumo_tela: Optional[float] = None
    costo_estimado: Optional[float] = None
    precio_estimado: Optional[float] = None
    aprobado: bool = False
    descripcion: Optional[str] = None
    activo: bool = True

class MuestraBaseUpdate(BaseModel):
    nombre: Optional[str] = None
    marca_id: Optional[str] = None
    tipo_producto_id: Optional[str] = None
    entalle_id: Optional[str] = None
    tela_id: Optional[str] = None
    consumo_tela: Optional[float] = None
    costo_estimado: Optional[float] = None
    precio_estimado: Optional[float] = None
    aprobado: Optional[bool] = None
    descripcion: Optional[str] = None
    activo: Optional[bool] = None

# ============ FICHA MODELS ============

class Ficha(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    archivo: Optional[str] = None
    descripcion: Optional[str] = None
    activo: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FichaCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    activo: bool = True

class FichaUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    activo: Optional[bool] = None

# ============ TIZADO MODELS ============

class Tizado(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    ancho: Optional[float] = None
    curva: Optional[str] = None
    archivo_tizado: Optional[str] = None
    descripcion: Optional[str] = None
    activo: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TizadoCreate(BaseModel):
    nombre: str
    ancho: Optional[float] = None
    curva: Optional[str] = None
    descripcion: Optional[str] = None
    activo: bool = True

class TizadoUpdate(BaseModel):
    nombre: Optional[str] = None
    ancho: Optional[float] = None
    curva: Optional[str] = None
    descripcion: Optional[str] = None
    activo: Optional[bool] = None

# ============ BASE MODELS ============

class Base(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    muestra_base_id: Optional[str] = None
    hilo_id: Optional[str] = None
    patron_archivo: Optional[str] = None
    imagen_archivo: Optional[str] = None
    fichas_archivos: List[str] = Field(default_factory=list)
    fichas_nombres: List[str] = Field(default_factory=list)
    tizados_archivos: List[str] = Field(default_factory=list)
    tizados_nombres: List[str] = Field(default_factory=list)
    aprobado: bool = False
    activo: bool = True
    orden: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BaseCreate(BaseModel):
    nombre: str
    muestra_base_id: Optional[str] = None
    hilo_id: Optional[str] = None
    aprobado: bool = False
    activo: bool = True

class BaseUpdate(BaseModel):
    nombre: Optional[str] = None
    muestra_base_id: Optional[str] = None
    hilo_id: Optional[str] = None
    aprobado: Optional[bool] = None
    activo: Optional[bool] = None

# ============ HELPER FUNCTIONS ============

def serialize_item(item: BaseModel) -> dict:
    """Convert Pydantic model to dict with datetime serialization"""
    doc = item.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    return doc

def deserialize_item(doc: dict) -> dict:
    """Convert MongoDB doc to dict with datetime deserialization"""
    if isinstance(doc.get('created_at'), str):
        doc['created_at'] = datetime.fromisoformat(doc['created_at'])
    if isinstance(doc.get('updated_at'), str):
        doc['updated_at'] = datetime.fromisoformat(doc['updated_at'])
    return doc

def calculate_rentabilidad(precio: float, costo: float) -> float:
    """Calculate expected profitability"""
    if costo and costo > 0 and precio:
        return round(((precio - costo) / costo) * 100, 2)
    return 0.0

# ============ GENERIC CRUD FUNCTIONS ============

async def create_item(collection_name: str, item_data: BaseModel, model_class):
    """Generic create function"""
    item_dict = item_data.model_dump()
    item_obj = model_class(**item_dict)
    doc = serialize_item(item_obj)
    await db[collection_name].insert_one(doc)
    return item_obj

async def get_items(collection_name: str, search: Optional[str] = None, activo: Optional[bool] = None, limit: int = 100, skip: int = 0):
    """Generic get all with search and filter"""
    query = {}
    if search:
        query["nombre"] = {"$regex": search, "$options": "i"}
    if activo is not None:
        query["activo"] = activo
    
    cursor = db[collection_name].find(query, {"_id": 0}).skip(skip).limit(limit).sort("orden", 1)
    items = await cursor.to_list(limit)
    for item in items:
        deserialize_item(item)
    return items

async def get_item_by_id(collection_name: str, item_id: str):
    """Generic get by ID"""
    doc = await db[collection_name].find_one({"id": item_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    return deserialize_item(doc)

async def update_item(collection_name: str, item_id: str, item_update: BaseModel):
    """Generic update function"""
    update_data = {k: v for k, v in item_update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db[collection_name].update_one(
        {"id": item_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    
    return await get_item_by_id(collection_name, item_id)

async def delete_item(collection_name: str, item_id: str):
    """Generic delete function"""
    result = await db[collection_name].delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    return {"message": "Item eliminado correctamente", "id": item_id}

async def count_items(collection_name: str, search: Optional[str] = None, activo: Optional[bool] = None):
    """Count items with filters"""
    query = {}
    if search:
        query["nombre"] = {"$regex": search, "$options": "i"}
    if activo is not None:
        query["activo"] = activo
    return await db[collection_name].count_documents(query)

# ============ REORDER MODEL ============

class ReorderRequest(BaseModel):
    items: List[dict]  # List of {id: str, orden: int}

async def reorder_items(collection_name: str, items: List[dict]):
    """Update order for multiple items"""
    for item in items:
        await db[collection_name].update_one(
            {"id": item["id"]},
            {"$set": {"orden": item["orden"], "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    return {"message": "Orden actualizado correctamente"}

# ============ FILE UPLOAD HELPER ============

async def save_upload_file(file: UploadFile, subfolder: str) -> str:
    """Save uploaded file and return the path"""
    folder = UPLOADS_DIR / subfolder
    folder.mkdir(exist_ok=True)
    
    file_id = str(uuid.uuid4())
    ext = Path(file.filename).suffix if file.filename else ""
    filename = f"{file_id}{ext}"
    file_path = folder / filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return f"{subfolder}/{filename}"

# ============ ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "API Módulo Muestras Textil"}

# ============ FILE ROUTES ============

@api_router.post("/upload/{category}")
async def upload_file(category: str, file: UploadFile = File(...)):
    """Upload a file to the specified category"""
    allowed_categories = ["costos", "patrones", "imagenes", "fichas", "tizados"]
    if category not in allowed_categories:
        raise HTTPException(status_code=400, detail=f"Categoría no válida. Use: {allowed_categories}")
    
    file_path = await save_upload_file(file, category)
    return {"file_path": file_path, "filename": file.filename}

@api_router.get("/files/{category}/{filename}")
async def get_file(category: str, filename: str):
    """Get a file by category and filename"""
    file_path = UPLOADS_DIR / category / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return FileResponse(file_path)

# ============ MARCAS ROUTES ============

@api_router.post("/marcas", response_model=Marca)
async def crear_marca(marca: MarcaCreate):
    return await create_item("marcas", marca, Marca)

@api_router.get("/marcas", response_model=List[Marca])
async def listar_marcas(
    search: Optional[str] = Query(None, description="Buscar por nombre"),
    activo: Optional[bool] = Query(None, description="Filtrar por estado activo"),
    limit: int = Query(100, ge=1, le=500),
    skip: int = Query(0, ge=0)
):
    return await get_items("marcas", search, activo, limit, skip)

@api_router.get("/marcas/count")
async def contar_marcas(
    search: Optional[str] = Query(None),
    activo: Optional[bool] = Query(None)
):
    count = await count_items("marcas", search, activo)
    return {"count": count}

@api_router.get("/marcas/{marca_id}", response_model=Marca)
async def obtener_marca(marca_id: str):
    return await get_item_by_id("marcas", marca_id)

@api_router.put("/marcas/{marca_id}", response_model=Marca)
async def actualizar_marca(marca_id: str, marca: MarcaUpdate):
    return await update_item("marcas", marca_id, marca)

@api_router.delete("/marcas/{marca_id}")
async def eliminar_marca(marca_id: str):
    return await delete_item("marcas", marca_id)

@api_router.put("/marcas/reorder")
async def reordenar_marcas(request: ReorderRequest):
    return await reorder_items("marcas", request.items)

# ============ TIPO PRODUCTO ROUTES ============

@api_router.post("/tipos-producto", response_model=TipoProducto)
async def crear_tipo_producto(tipo: TipoProductoCreate):
    return await create_item("tipos_producto", tipo, TipoProducto)

@api_router.get("/tipos-producto", response_model=List[TipoProducto])
async def listar_tipos_producto(
    search: Optional[str] = Query(None),
    activo: Optional[bool] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    skip: int = Query(0, ge=0)
):
    return await get_items("tipos_producto", search, activo, limit, skip)

@api_router.get("/tipos-producto/count")
async def contar_tipos_producto(
    search: Optional[str] = Query(None),
    activo: Optional[bool] = Query(None)
):
    count = await count_items("tipos_producto", search, activo)
    return {"count": count}

@api_router.get("/tipos-producto/{tipo_id}", response_model=TipoProducto)
async def obtener_tipo_producto(tipo_id: str):
    return await get_item_by_id("tipos_producto", tipo_id)

@api_router.put("/tipos-producto/{tipo_id}", response_model=TipoProducto)
async def actualizar_tipo_producto(tipo_id: str, tipo: TipoProductoUpdate):
    return await update_item("tipos_producto", tipo_id, tipo)

@api_router.delete("/tipos-producto/{tipo_id}")
async def eliminar_tipo_producto(tipo_id: str):
    return await delete_item("tipos_producto", tipo_id)

@api_router.put("/tipos-producto/reorder")
async def reordenar_tipos_producto(request: ReorderRequest):
    return await reorder_items("tipos_producto", request.items)

# ============ ENTALLE ROUTES ============

@api_router.post("/entalles", response_model=Entalle)
async def crear_entalle(entalle: EntalleCreate):
    return await create_item("entalles", entalle, Entalle)

@api_router.get("/entalles", response_model=List[Entalle])
async def listar_entalles(
    search: Optional[str] = Query(None),
    activo: Optional[bool] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    skip: int = Query(0, ge=0)
):
    return await get_items("entalles", search, activo, limit, skip)

@api_router.get("/entalles/count")
async def contar_entalles(
    search: Optional[str] = Query(None),
    activo: Optional[bool] = Query(None)
):
    count = await count_items("entalles", search, activo)
    return {"count": count}

@api_router.get("/entalles/{entalle_id}", response_model=Entalle)
async def obtener_entalle(entalle_id: str):
    return await get_item_by_id("entalles", entalle_id)

@api_router.put("/entalles/{entalle_id}", response_model=Entalle)
async def actualizar_entalle(entalle_id: str, entalle: EntalleUpdate):
    return await update_item("entalles", entalle_id, entalle)

@api_router.delete("/entalles/{entalle_id}")
async def eliminar_entalle(entalle_id: str):
    return await delete_item("entalles", entalle_id)

@api_router.put("/entalles/reorder")
async def reordenar_entalles(request: ReorderRequest):
    return await reorder_items("entalles", request.items)

# ============ TELA ROUTES ============

@api_router.post("/telas", response_model=Tela)
async def crear_tela(tela: TelaCreate):
    return await create_item("telas", tela, Tela)

@api_router.get("/telas", response_model=List[Tela])
async def listar_telas(
    search: Optional[str] = Query(None),
    activo: Optional[bool] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    skip: int = Query(0, ge=0)
):
    return await get_items("telas", search, activo, limit, skip)

@api_router.get("/telas/count")
async def contar_telas(
    search: Optional[str] = Query(None),
    activo: Optional[bool] = Query(None)
):
    count = await count_items("telas", search, activo)
    return {"count": count}

@api_router.get("/telas/{tela_id}", response_model=Tela)
async def obtener_tela(tela_id: str):
    return await get_item_by_id("telas", tela_id)

@api_router.put("/telas/{tela_id}", response_model=Tela)
async def actualizar_tela(tela_id: str, tela: TelaUpdate):
    return await update_item("telas", tela_id, tela)

@api_router.delete("/telas/{tela_id}")
async def eliminar_tela(tela_id: str):
    return await delete_item("telas", tela_id)

@api_router.put("/telas/reorder")
async def reordenar_telas(request: ReorderRequest):
    return await reorder_items("telas", request.items)

# ============ HILO ROUTES ============

@api_router.post("/hilos", response_model=Hilo)
async def crear_hilo(hilo: HiloCreate):
    return await create_item("hilos", hilo, Hilo)

@api_router.get("/hilos", response_model=List[Hilo])
async def listar_hilos(
    search: Optional[str] = Query(None),
    activo: Optional[bool] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    skip: int = Query(0, ge=0)
):
    return await get_items("hilos", search, activo, limit, skip)

@api_router.get("/hilos/count")
async def contar_hilos(
    search: Optional[str] = Query(None),
    activo: Optional[bool] = Query(None)
):
    count = await count_items("hilos", search, activo)
    return {"count": count}

@api_router.get("/hilos/{hilo_id}", response_model=Hilo)
async def obtener_hilo(hilo_id: str):
    return await get_item_by_id("hilos", hilo_id)

@api_router.put("/hilos/{hilo_id}", response_model=Hilo)
async def actualizar_hilo(hilo_id: str, hilo: HiloUpdate):
    return await update_item("hilos", hilo_id, hilo)

@api_router.delete("/hilos/{hilo_id}")
async def eliminar_hilo(hilo_id: str):
    return await delete_item("hilos", hilo_id)

@api_router.put("/hilos/reorder")
async def reordenar_hilos(request: ReorderRequest):
    return await reorder_items("hilos", request.items)

# ============ MUESTRA BASE ROUTES ============

@api_router.post("/muestras-base", response_model=MuestraBase)
async def crear_muestra_base(muestra: MuestraBaseCreate):
    muestra_dict = muestra.model_dump()
    # Calculate rentabilidad
    rentabilidad = calculate_rentabilidad(
        muestra_dict.get('precio_estimado') or 0,
        muestra_dict.get('costo_estimado') or 0
    )
    muestra_obj = MuestraBase(**muestra_dict, rentabilidad_esperada=rentabilidad)
    doc = serialize_item(muestra_obj)
    await db.muestras_base.insert_one(doc)
    return muestra_obj

@api_router.get("/muestras-base", response_model=List[MuestraBase])
async def listar_muestras_base(
    search: Optional[str] = Query(None),
    activo: Optional[bool] = Query(None),
    aprobado: Optional[bool] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    skip: int = Query(0, ge=0)
):
    query = {}
    if search:
        query["nombre"] = {"$regex": search, "$options": "i"}
    if activo is not None:
        query["activo"] = activo
    if aprobado is not None:
        query["aprobado"] = aprobado
    
    cursor = db.muestras_base.find(query, {"_id": 0}).skip(skip).limit(limit).sort("created_at", -1)
    items = await cursor.to_list(limit)
    for item in items:
        deserialize_item(item)
    return items

@api_router.get("/muestras-base/count")
async def contar_muestras_base(
    search: Optional[str] = Query(None),
    activo: Optional[bool] = Query(None)
):
    count = await count_items("muestras_base", search, activo)
    return {"count": count}

@api_router.get("/muestras-base/{muestra_id}", response_model=MuestraBase)
async def obtener_muestra_base(muestra_id: str):
    return await get_item_by_id("muestras_base", muestra_id)

@api_router.put("/muestras-base/{muestra_id}", response_model=MuestraBase)
async def actualizar_muestra_base(muestra_id: str, muestra: MuestraBaseUpdate):
    update_data = {k: v for k, v in muestra.model_dump().items() if v is not None}
    
    # Recalculate rentabilidad if precio or costo changed
    current = await get_item_by_id("muestras_base", muestra_id)
    precio = update_data.get('precio_estimado', current.get('precio_estimado'))
    costo = update_data.get('costo_estimado', current.get('costo_estimado'))
    if precio and costo:
        update_data['rentabilidad_esperada'] = calculate_rentabilidad(precio, costo)
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.muestras_base.update_one(
        {"id": muestra_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Muestra no encontrada")
    
    return await get_item_by_id("muestras_base", muestra_id)

@api_router.delete("/muestras-base/{muestra_id}")
async def eliminar_muestra_base(muestra_id: str):
    return await delete_item("muestras_base", muestra_id)

@api_router.post("/muestras-base/{muestra_id}/archivo")
async def subir_archivo_costos(muestra_id: str, file: UploadFile = File(...)):
    """Upload cost file for a muestra base"""
    await get_item_by_id("muestras_base", muestra_id)
    file_path = await save_upload_file(file, "costos")
    await db.muestras_base.update_one(
        {"id": muestra_id},
        {"$set": {"archivo_costos": file_path, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"file_path": file_path}

# ============ FICHA ROUTES ============

@api_router.post("/fichas", response_model=Ficha)
async def crear_ficha(ficha: FichaCreate):
    return await create_item("fichas", ficha, Ficha)

@api_router.get("/fichas", response_model=List[Ficha])
async def listar_fichas(
    search: Optional[str] = Query(None),
    activo: Optional[bool] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    skip: int = Query(0, ge=0)
):
    return await get_items("fichas", search, activo, limit, skip)

@api_router.get("/fichas/count")
async def contar_fichas(
    search: Optional[str] = Query(None),
    activo: Optional[bool] = Query(None)
):
    count = await count_items("fichas", search, activo)
    return {"count": count}

@api_router.get("/fichas/{ficha_id}", response_model=Ficha)
async def obtener_ficha(ficha_id: str):
    return await get_item_by_id("fichas", ficha_id)

@api_router.put("/fichas/{ficha_id}", response_model=Ficha)
async def actualizar_ficha(ficha_id: str, ficha: FichaUpdate):
    return await update_item("fichas", ficha_id, ficha)

@api_router.delete("/fichas/{ficha_id}")
async def eliminar_ficha(ficha_id: str):
    return await delete_item("fichas", ficha_id)

@api_router.post("/fichas/{ficha_id}/archivo")
async def subir_archivo_ficha(ficha_id: str, file: UploadFile = File(...)):
    """Upload file for a ficha"""
    await get_item_by_id("fichas", ficha_id)
    file_path = await save_upload_file(file, "fichas")
    await db.fichas.update_one(
        {"id": ficha_id},
        {"$set": {"archivo": file_path, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"file_path": file_path}

# ============ TIZADO ROUTES ============

@api_router.post("/tizados", response_model=Tizado)
async def crear_tizado(tizado: TizadoCreate):
    return await create_item("tizados", tizado, Tizado)

@api_router.get("/tizados", response_model=List[Tizado])
async def listar_tizados(
    search: Optional[str] = Query(None),
    activo: Optional[bool] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    skip: int = Query(0, ge=0)
):
    return await get_items("tizados", search, activo, limit, skip)

@api_router.get("/tizados/count")
async def contar_tizados(
    search: Optional[str] = Query(None),
    activo: Optional[bool] = Query(None)
):
    count = await count_items("tizados", search, activo)
    return {"count": count}

@api_router.get("/tizados/{tizado_id}", response_model=Tizado)
async def obtener_tizado(tizado_id: str):
    return await get_item_by_id("tizados", tizado_id)

@api_router.put("/tizados/{tizado_id}", response_model=Tizado)
async def actualizar_tizado(tizado_id: str, tizado: TizadoUpdate):
    return await update_item("tizados", tizado_id, tizado)

@api_router.delete("/tizados/{tizado_id}")
async def eliminar_tizado(tizado_id: str):
    return await delete_item("tizados", tizado_id)

@api_router.post("/tizados/{tizado_id}/archivo")
async def subir_archivo_tizado(tizado_id: str, file: UploadFile = File(...)):
    """Upload file for a tizado"""
    await get_item_by_id("tizados", tizado_id)
    file_path = await save_upload_file(file, "tizados")
    await db.tizados.update_one(
        {"id": tizado_id},
        {"$set": {"archivo_tizado": file_path, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"file_path": file_path}

# ============ BASE ROUTES ============

@api_router.post("/bases", response_model=Base)
async def crear_base(base: BaseCreate):
    return await create_item("bases", base, Base)

@api_router.get("/bases", response_model=List[Base])
async def listar_bases(
    search: Optional[str] = Query(None),
    activo: Optional[bool] = Query(None),
    aprobado: Optional[bool] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    skip: int = Query(0, ge=0)
):
    query = {}
    if search:
        query["nombre"] = {"$regex": search, "$options": "i"}
    if activo is not None:
        query["activo"] = activo
    if aprobado is not None:
        query["aprobado"] = aprobado
    
    cursor = db.bases.find(query, {"_id": 0}).skip(skip).limit(limit).sort("created_at", -1)
    items = await cursor.to_list(limit)
    for item in items:
        deserialize_item(item)
    return items

@api_router.get("/bases/count")
async def contar_bases(
    search: Optional[str] = Query(None),
    activo: Optional[bool] = Query(None)
):
    count = await count_items("bases", search, activo)
    return {"count": count}

@api_router.get("/bases/{base_id}", response_model=Base)
async def obtener_base(base_id: str):
    return await get_item_by_id("bases", base_id)

@api_router.put("/bases/{base_id}", response_model=Base)
async def actualizar_base(base_id: str, base: BaseUpdate):
    update_data = {k: v for k, v in base.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.bases.update_one(
        {"id": base_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Base no encontrada")
    
    return await get_item_by_id("bases", base_id)

@api_router.delete("/bases/{base_id}")
async def eliminar_base(base_id: str):
    return await delete_item("bases", base_id)

@api_router.post("/bases/{base_id}/patron")
async def subir_patron(base_id: str, file: UploadFile = File(...)):
    """Upload patron file for a base"""
    await get_item_by_id("bases", base_id)
    file_path = await save_upload_file(file, "patrones")
    await db.bases.update_one(
        {"id": base_id},
        {"$set": {"patron_archivo": file_path, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"file_path": file_path}

@api_router.post("/bases/{base_id}/imagen")
async def subir_imagen(base_id: str, file: UploadFile = File(...)):
    """Upload image file for a base"""
    await get_item_by_id("bases", base_id)
    file_path = await save_upload_file(file, "imagenes")
    await db.bases.update_one(
        {"id": base_id},
        {"$set": {"imagen_archivo": file_path, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"file_path": file_path}

@api_router.post("/bases/{base_id}/fichas")
async def subir_fichas(base_id: str, files: List[UploadFile] = File(...), nombres: List[str] = Form(default=[])):
    """Upload multiple ficha files for a base with optional names"""
    await get_item_by_id("bases", base_id)
    
    if not files:
        raise HTTPException(status_code=400, detail="Se requiere al menos un archivo")
    
    file_paths = []
    for file in files:
        file_path = await save_upload_file(file, "fichas_bases")
        file_paths.append(file_path)
    
    # Append to existing fichas
    current = await db.bases.find_one({"id": base_id}, {"_id": 0})
    existing_fichas = current.get("fichas_archivos", [])
    existing_nombres = current.get("fichas_nombres", [])
    
    # If nombres provided, use them; otherwise use filenames
    new_nombres = []
    for i, file_path in enumerate(file_paths):
        if i < len(nombres) and nombres[i]:
            new_nombres.append(nombres[i])
        else:
            new_nombres.append(file_path.split('/')[-1])
    
    await db.bases.update_one(
        {"id": base_id},
        {"$set": {
            "fichas_archivos": existing_fichas + file_paths,
            "fichas_nombres": existing_nombres + new_nombres,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"file_paths": file_paths, "nombres": new_nombres}

@api_router.delete("/bases/{base_id}/fichas/{file_index}")
async def eliminar_ficha_base(base_id: str, file_index: int):
    """Remove a ficha file from a base"""
    current = await db.bases.find_one({"id": base_id}, {"_id": 0})
    if not current:
        raise HTTPException(status_code=404, detail="Base no encontrada")
    
    fichas = current.get("fichas_archivos", [])
    nombres = current.get("fichas_nombres", [])
    
    if file_index < 0 or file_index >= len(fichas):
        raise HTTPException(status_code=400, detail="Índice de archivo inválido")
    
    fichas.pop(file_index)
    if file_index < len(nombres):
        nombres.pop(file_index)
    
    await db.bases.update_one(
        {"id": base_id},
        {"$set": {
            "fichas_archivos": fichas,
            "fichas_nombres": nombres,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "Archivo eliminado"}

@api_router.post("/bases/{base_id}/tizados")
async def subir_tizados_base(base_id: str, files: List[UploadFile] = File(default=[]), nombres: List[str] = Form(default=[])):
    """Upload multiple tizado files for a base with optional names"""
    await get_item_by_id("bases", base_id)
    file_paths = []
    for file in files:
        file_path = await save_upload_file(file, "tizados_bases")
        file_paths.append(file_path)
    
    # Append to existing tizados
    current = await db.bases.find_one({"id": base_id}, {"_id": 0})
    existing_tizados = current.get("tizados_archivos", [])
    existing_nombres = current.get("tizados_nombres", [])
    
    # If nombres provided, use them; otherwise use filenames
    new_nombres = []
    for i, file_path in enumerate(file_paths):
        if i < len(nombres) and nombres[i]:
            new_nombres.append(nombres[i])
        else:
            new_nombres.append(file_path.split('/')[-1])
    
    # If only nombres without files
    if not file_paths and nombres:
        new_nombres = list(nombres)
        file_paths = [None] * len(nombres)
    
    await db.bases.update_one(
        {"id": base_id},
        {"$set": {
            "tizados_archivos": existing_tizados + [f for f in file_paths if f],
            "tizados_nombres": existing_nombres + new_nombres,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"file_paths": file_paths, "nombres": new_nombres}

@api_router.delete("/bases/{base_id}/tizados/{file_index}")
async def eliminar_tizado_base(base_id: str, file_index: int):
    """Remove a tizado file from a base"""
    current = await db.bases.find_one({"id": base_id}, {"_id": 0})
    if not current:
        raise HTTPException(status_code=404, detail="Base no encontrada")
    
    tizados = current.get("tizados_archivos", [])
    nombres = current.get("tizados_nombres", [])
    
    if file_index < 0 or file_index >= len(tizados):
        raise HTTPException(status_code=400, detail="Índice de archivo inválido")
    
    tizados.pop(file_index)
    if file_index < len(nombres):
        nombres.pop(file_index)
    
    await db.bases.update_one(
        {"id": base_id},
        {"$set": {
            "tizados_archivos": tizados,
            "tizados_nombres": nombres,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "Archivo eliminado"}

# ============ DASHBOARD STATS ============

@api_router.get("/dashboard/stats")
async def obtener_estadisticas():
    """Get counts for all collections"""
    stats = {
        "marcas": await db.marcas.count_documents({}),
        "tipos_producto": await db.tipos_producto.count_documents({}),
        "entalles": await db.entalles.count_documents({}),
        "telas": await db.telas.count_documents({}),
        "hilos": await db.hilos.count_documents({}),
        "muestras_base": await db.muestras_base.count_documents({}),
        "bases": await db.bases.count_documents({}),
        "fichas": await db.fichas.count_documents({}),
        "tizados": await db.tizados.count_documents({})
    }
    return stats

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
