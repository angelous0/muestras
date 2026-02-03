import requests
import sys
import json
from datetime import datetime

class TextileSamplesAPITester:
    def __init__(self, base_url="https://textilesys.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_items = {
            'marcas': [],
            'tipos_producto': [],
            'entalles': [],
            'telas': [],
            'hilos': [],
            'muestras_base': [],
            'fichas': [],
            'tizados': [],
            'bases': []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.text}")
                except:
                    pass

            return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        if success:
            print(f"Stats: {response}")
        return success

    def test_marcas_crud(self):
        """Test complete CRUD operations for Marcas"""
        print("\n📋 Testing Marcas CRUD Operations...")
        
        # Create
        marca_data = {
            "nombre": f"Test Marca {datetime.now().strftime('%H%M%S')}",
            "descripcion": "Test marca description",
            "activo": True
        }
        success, response = self.run_test(
            "Create Marca",
            "POST",
            "marcas",
            200,
            data=marca_data
        )
        if not success:
            return False
        
        marca_id = response.get('id')
        self.created_items['marcas'].append(marca_id)
        
        # Read operations
        success, _ = self.run_test(
            "Get Marca by ID",
            "GET",
            f"marcas/{marca_id}",
            200
        )
        if not success:
            return False
        
        success, _ = self.run_test(
            "List Marcas",
            "GET",
            "marcas",
            200
        )
        if not success:
            return False
        
        # Update
        update_data = {
            "nombre": f"Updated Marca {datetime.now().strftime('%H%M%S')}",
            "descripcion": "Updated description"
        }
        success, _ = self.run_test(
            "Update Marca",
            "PUT",
            f"marcas/{marca_id}",
            200,
            data=update_data
        )
        if not success:
            return False
        
        # Count
        success, _ = self.run_test(
            "Count Marcas",
            "GET",
            "marcas/count",
            200
        )
        
        return success

    def test_tipos_producto_crud(self):
        """Test complete CRUD operations for Tipos Producto"""
        print("\n📦 Testing Tipos Producto CRUD Operations...")
        
        # Create
        tipo_data = {
            "nombre": f"Test Tipo {datetime.now().strftime('%H%M%S')}",
            "descripcion": "Test tipo description",
            "activo": True
        }
        success, response = self.run_test(
            "Create Tipo Producto",
            "POST",
            "tipos-producto",
            200,
            data=tipo_data
        )
        if not success:
            return False
        
        tipo_id = response.get('id')
        self.created_items['tipos_producto'].append(tipo_id)
        
        # Read operations
        success, _ = self.run_test(
            "Get Tipo Producto by ID",
            "GET",
            f"tipos-producto/{tipo_id}",
            200
        )
        if not success:
            return False
        
        success, _ = self.run_test(
            "List Tipos Producto",
            "GET",
            "tipos-producto",
            200
        )
        
        return success

    def test_entalles_crud(self):
        """Test complete CRUD operations for Entalles"""
        print("\n📏 Testing Entalles CRUD Operations...")
        
        # Create
        entalle_data = {
            "nombre": f"Test Entalle {datetime.now().strftime('%H%M%S')}",
            "descripcion": "Test entalle description",
            "activo": True
        }
        success, response = self.run_test(
            "Create Entalle",
            "POST",
            "entalles",
            200,
            data=entalle_data
        )
        if not success:
            return False
        
        entalle_id = response.get('id')
        self.created_items['entalles'].append(entalle_id)
        
        # Read operations
        success, _ = self.run_test(
            "Get Entalle by ID",
            "GET",
            f"entalles/{entalle_id}",
            200
        )
        if not success:
            return False
        
        success, _ = self.run_test(
            "List Entalles",
            "GET",
            "entalles",
            200
        )
        
        return success

    def test_telas_crud(self):
        """Test complete CRUD operations for Telas (with additional fields)"""
        print("\n🧵 Testing Telas CRUD Operations...")
        
        # Create with additional fields
        tela_data = {
            "nombre": f"Test Tela {datetime.now().strftime('%H%M%S')}",
            "descripcion": "Test tela description",
            "composicion": "100% Cotton",
            "peso_gsm": 150.5,
            "activo": True
        }
        success, response = self.run_test(
            "Create Tela",
            "POST",
            "telas",
            200,
            data=tela_data
        )
        if not success:
            return False
        
        tela_id = response.get('id')
        self.created_items['telas'].append(tela_id)
        
        # Read operations
        success, _ = self.run_test(
            "Get Tela by ID",
            "GET",
            f"telas/{tela_id}",
            200
        )
        if not success:
            return False
        
        success, _ = self.run_test(
            "List Telas",
            "GET",
            "telas",
            200
        )
        
        return success

    def test_hilos_crud(self):
        """Test complete CRUD operations for Hilos (with additional fields)"""
        print("\n🎨 Testing Hilos CRUD Operations...")
        
        # Create with additional fields
        hilo_data = {
            "nombre": f"Test Hilo {datetime.now().strftime('%H%M%S')}",
            "descripcion": "Test hilo description",
            "color": "Azul Marino",
            "grosor": "40/2",
            "activo": True
        }
        success, response = self.run_test(
            "Create Hilo",
            "POST",
            "hilos",
            200,
            data=hilo_data
        )
        if not success:
            return False
        
        hilo_id = response.get('id')
        self.created_items['hilos'].append(hilo_id)
        
        # Read operations
        success, _ = self.run_test(
            "Get Hilo by ID",
            "GET",
            f"hilos/{hilo_id}",
            200
        )
        if not success:
            return False
        
        success, _ = self.run_test(
            "List Hilos",
            "GET",
            "hilos",
            200
        )
        
        return success

    def test_muestras_base_crud(self):
        """Test complete CRUD operations for Muestras Base (with rentabilidad calculation)"""
        print("\n🧪 Testing Muestras Base CRUD Operations...")
        
        # First ensure we have catalog items to reference
        if not self.created_items['marcas'] or not self.created_items['telas']:
            print("⚠️ Need catalog items for muestras base testing")
            return False
        
        # Create with cost and price for rentabilidad calculation
        muestra_data = {
            "nombre": f"Test Muestra {datetime.now().strftime('%H%M%S')}",
            "marca_id": self.created_items['marcas'][0],
            "tipo_producto_id": self.created_items['tipos_producto'][0] if self.created_items['tipos_producto'] else None,
            "entalle_id": self.created_items['entalles'][0] if self.created_items['entalles'] else None,
            "tela_id": self.created_items['telas'][0],
            "consumo_tela": 1.5,
            "costo_estimado": 100.0,
            "precio_estimado": 150.0,
            "aprobado": False,
            "descripcion": "Test muestra description",
            "activo": True
        }
        success, response = self.run_test(
            "Create Muestra Base",
            "POST",
            "muestras-base",
            200,
            data=muestra_data
        )
        if not success:
            return False
        
        muestra_id = response.get('id')
        self.created_items['muestras_base'].append(muestra_id)
        
        # Verify rentabilidad was calculated correctly
        # Expected: ((150 - 100) / 100) * 100 = 50%
        expected_rentabilidad = 50.0
        actual_rentabilidad = response.get('rentabilidad_esperada')
        if actual_rentabilidad != expected_rentabilidad:
            print(f"⚠️ Rentabilidad calculation issue: expected {expected_rentabilidad}, got {actual_rentabilidad}")
        else:
            print(f"✅ Rentabilidad calculated correctly: {actual_rentabilidad}%")
        
        # Read operations
        success, _ = self.run_test(
            "Get Muestra Base by ID",
            "GET",
            f"muestras-base/{muestra_id}",
            200
        )
        if not success:
            return False
        
        success, _ = self.run_test(
            "List Muestras Base",
            "GET",
            "muestras-base",
            200
        )
        if not success:
            return False
        
        # Test filtering by aprobado
        success, _ = self.run_test(
            "Filter Muestras Base by Aprobado",
            "GET",
            "muestras-base",
            200,
            params={"aprobado": False}
        )
        if not success:
            return False
        
        # Update with new prices (should recalculate rentabilidad)
        update_data = {
            "precio_estimado": 200.0,
            "aprobado": True
        }
        success, response = self.run_test(
            "Update Muestra Base",
            "PUT",
            f"muestras-base/{muestra_id}",
            200,
            data=update_data
        )
        if not success:
            return False
        
        # Verify rentabilidad was recalculated
        # Expected: ((200 - 100) / 100) * 100 = 100%
        expected_rentabilidad = 100.0
        actual_rentabilidad = response.get('rentabilidad_esperada')
        if actual_rentabilidad != expected_rentabilidad:
            print(f"⚠️ Rentabilidad recalculation issue: expected {expected_rentabilidad}, got {actual_rentabilidad}")
        else:
            print(f"✅ Rentabilidad recalculated correctly: {actual_rentabilidad}%")
        
        # Count
        success, _ = self.run_test(
            "Count Muestras Base",
            "GET",
            "muestras-base/count",
            200
        )
        
        return success

    def test_fichas_crud(self):
        """Test complete CRUD operations for Fichas"""
        print("\n📄 Testing Fichas CRUD Operations...")
        
        # Create
        ficha_data = {
            "nombre": f"Test Ficha {datetime.now().strftime('%H%M%S')}",
            "descripcion": "Test ficha description",
            "activo": True
        }
        success, response = self.run_test(
            "Create Ficha",
            "POST",
            "fichas",
            200,
            data=ficha_data
        )
        if not success:
            return False
        
        ficha_id = response.get('id')
        self.created_items['fichas'].append(ficha_id)
        
        # Read operations
        success, _ = self.run_test(
            "Get Ficha by ID",
            "GET",
            f"fichas/{ficha_id}",
            200
        )
        if not success:
            return False
        
        success, _ = self.run_test(
            "List Fichas",
            "GET",
            "fichas",
            200
        )
        if not success:
            return False
        
        # Update
        update_data = {
            "nombre": f"Updated Ficha {datetime.now().strftime('%H%M%S')}",
            "descripcion": "Updated ficha description"
        }
        success, _ = self.run_test(
            "Update Ficha",
            "PUT",
            f"fichas/{ficha_id}",
            200,
            data=update_data
        )
        if not success:
            return False
        
        # Count
        success, _ = self.run_test(
            "Count Fichas",
            "GET",
            "fichas/count",
            200
        )
        
        return success

    def test_tizados_crud(self):
        """Test complete CRUD operations for Tizados (with ancho and curva fields)"""
        print("\n📐 Testing Tizados CRUD Operations...")
        
        # Create with ancho and curva fields
        tizado_data = {
            "nombre": f"Test Tizado {datetime.now().strftime('%H%M%S')}",
            "ancho": 150.0,
            "curva": "S",
            "descripcion": "Test tizado description",
            "activo": True
        }
        success, response = self.run_test(
            "Create Tizado",
            "POST",
            "tizados",
            200,
            data=tizado_data
        )
        if not success:
            return False
        
        tizado_id = response.get('id')
        self.created_items['tizados'].append(tizado_id)
        
        # Read operations
        success, _ = self.run_test(
            "Get Tizado by ID",
            "GET",
            f"tizados/{tizado_id}",
            200
        )
        if not success:
            return False
        
        success, _ = self.run_test(
            "List Tizados",
            "GET",
            "tizados",
            200
        )
        if not success:
            return False
        
        # Update with different ancho and curva
        update_data = {
            "ancho": 180.0,
            "curva": "M",
            "descripcion": "Updated tizado description"
        }
        success, _ = self.run_test(
            "Update Tizado",
            "PUT",
            f"tizados/{tizado_id}",
            200,
            data=update_data
        )
        if not success:
            return False
        
        # Count
        success, _ = self.run_test(
            "Count Tizados",
            "GET",
            "tizados/count",
            200
        )
        
        return success

    def test_bases_crud(self):
        """Test complete CRUD operations for Bases (with relationships)"""
        print("\n🏗️ Testing Bases CRUD Operations...")
        
        # Ensure we have related items
        if not self.created_items['muestras_base'] or not self.created_items['fichas'] or not self.created_items['tizados']:
            print("⚠️ Need related items for bases testing")
            return False
        
        # Create with relationships
        base_data = {
            "nombre": f"Test Base {datetime.now().strftime('%H%M%S')}",
            "muestra_base_id": self.created_items['muestras_base'][0],
            "fichas_ids": [self.created_items['fichas'][0]],
            "tizados_ids": [self.created_items['tizados'][0]],
            "aprobado": False,
            "descripcion": "Test base description",
            "activo": True
        }
        success, response = self.run_test(
            "Create Base",
            "POST",
            "bases",
            200,
            data=base_data
        )
        if not success:
            return False
        
        base_id = response.get('id')
        self.created_items['bases'].append(base_id)
        
        # Verify relationships were saved
        fichas_ids = response.get('fichas_ids', [])
        tizados_ids = response.get('tizados_ids', [])
        if not fichas_ids or not tizados_ids:
            print("⚠️ Relationships not saved correctly")
        else:
            print(f"✅ Relationships saved: {len(fichas_ids)} fichas, {len(tizados_ids)} tizados")
        
        # Read operations
        success, _ = self.run_test(
            "Get Base by ID",
            "GET",
            f"bases/{base_id}",
            200
        )
        if not success:
            return False
        
        success, _ = self.run_test(
            "List Bases",
            "GET",
            "bases",
            200
        )
        if not success:
            return False
        
        # Test filtering by aprobado
        success, _ = self.run_test(
            "Filter Bases by Aprobado",
            "GET",
            "bases",
            200,
            params={"aprobado": False}
        )
        if not success:
            return False
        
        # Update with new relationships
        update_data = {
            "aprobado": True,
            "fichas_ids": [],  # Remove fichas
            "tizados_ids": [self.created_items['tizados'][0]]  # Keep tizados
        }
        success, _ = self.run_test(
            "Update Base",
            "PUT",
            f"bases/{base_id}",
            200,
            data=update_data
        )
        if not success:
            return False
        
        # Count
        success, _ = self.run_test(
            "Count Bases",
            "GET",
            "bases/count",
            200
        )
        
        return success

    def test_delete_operations(self):
        """Test delete operations for all created items"""
        print("\n🗑️ Testing Delete Operations...")
        
        all_success = True
        
        for collection, item_ids in self.created_items.items():
            for item_id in item_ids:
                endpoint = collection.replace('_', '-')  # Convert tipos_producto to tipos-producto
                success, _ = self.run_test(
                    f"Delete {collection} {item_id}",
                    "DELETE",
                    f"{endpoint}/{item_id}",
                    200
                )
                if not success:
                    all_success = False
        
        return all_success

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Complete Textile Samples API Tests...")
        print(f"Base URL: {self.base_url}")
        
        # Test dashboard first
        self.test_dashboard_stats()
        
        # Test all base catalog CRUD operations first (needed for relationships)
        self.test_marcas_crud()
        self.test_tipos_producto_crud()
        self.test_entalles_crud()
        self.test_telas_crud()
        self.test_hilos_crud()
        
        # Test new tables with relationships
        self.test_muestras_base_crud()
        self.test_fichas_crud()
        self.test_tizados_crud()
        self.test_bases_crud()
        
        # Test dashboard stats again after creating items
        self.test_dashboard_stats()
        
        # Clean up - delete created items
        self.test_delete_operations()
        
        # Final dashboard check
        self.test_dashboard_stats()
        
        # Print results
        print(f"\n📊 Final Results:")
        print(f"Tests passed: {self.tests_passed}/{self.tests_run}")
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"Success rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = TextileSamplesAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())