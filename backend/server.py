from fastapi import FastAPI, APIRouter, HTTPException, Query
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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

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
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BaseItemCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    activo: bool = True

class BaseItemUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    activo: Optional[bool] = None

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
    composicion: Optional[str] = None
    peso_gsm: Optional[float] = None

class TelaCreate(BaseItemCreate):
    composicion: Optional[str] = None
    peso_gsm: Optional[float] = None

class TelaUpdate(BaseItemUpdate):
    composicion: Optional[str] = None
    peso_gsm: Optional[float] = None

# ============ HILO MODELS ============

class Hilo(BaseItem):
    color: Optional[str] = None
    grosor: Optional[str] = None

class HiloCreate(BaseItemCreate):
    color: Optional[str] = None
    grosor: Optional[str] = None

class HiloUpdate(BaseItemUpdate):
    color: Optional[str] = None
    grosor: Optional[str] = None

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

# ============ GENERIC CRUD FUNCTIONS ============

async def create_item(collection_name: str, item_data: BaseItemCreate, model_class):
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
    
    cursor = db[collection_name].find(query, {"_id": 0}).skip(skip).limit(limit).sort("nombre", 1)
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

async def update_item(collection_name: str, item_id: str, item_update: BaseItemUpdate):
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

# ============ ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "API Módulo Muestras Textil"}

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

# ============ DASHBOARD STATS ============

@api_router.get("/dashboard/stats")
async def obtener_estadisticas():
    """Get counts for all collections"""
    stats = {
        "marcas": await db.marcas.count_documents({}),
        "tipos_producto": await db.tipos_producto.count_documents({}),
        "entalles": await db.entalles.count_documents({}),
        "telas": await db.telas.count_documents({}),
        "hilos": await db.hilos.count_documents({})
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
