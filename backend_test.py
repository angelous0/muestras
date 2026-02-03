import requests
import sys
import json
from datetime import datetime

class TextileSamplesAPITester:
    def __init__(self, base_url="https://textiletrack-2.preview.emergentagent.com/api"):
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
        
        # Read (Get by ID)
        success, _ = self.run_test(
            "Get Marca by ID",
            "GET",
            f"marcas/{marca_id}",
            200
        )
        if not success:
            return False
        
        # Read (List all)
        success, marcas_list = self.run_test(
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
        
        # Test search
        success, _ = self.run_test(
            "Search Marcas",
            "GET",
            "marcas",
            200,
            params={"search": "Test"}
        )
        if not success:
            return False
        
        # Test filter by activo
        success, _ = self.run_test(
            "Filter Marcas by Active",
            "GET",
            "marcas",
            200,
            params={"activo": True}
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
        if not success:
            return False
        
        # Update
        update_data = {"nombre": f"Updated Tipo {datetime.now().strftime('%H%M%S')}"}
        success, _ = self.run_test(
            "Update Tipo Producto",
            "PUT",
            f"tipos-producto/{tipo_id}",
            200,
            data=update_data
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
        if not success:
            return False
        
        # Update with additional fields
        update_data = {
            "composicion": "80% Cotton, 20% Polyester",
            "peso_gsm": 180.0
        }
        success, _ = self.run_test(
            "Update Tela",
            "PUT",
            f"telas/{tela_id}",
            200,
            data=update_data
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
        if not success:
            return False
        
        # Update with additional fields
        update_data = {
            "color": "Rojo Carmesí",
            "grosor": "30/2"
        }
        success, _ = self.run_test(
            "Update Hilo",
            "PUT",
            f"hilos/{hilo_id}",
            200,
            data=update_data
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
        print("🚀 Starting Textile Samples API Tests...")
        print(f"Base URL: {self.base_url}")
        
        # Test dashboard first
        self.test_dashboard_stats()
        
        # Test all CRUD operations
        self.test_marcas_crud()
        self.test_tipos_producto_crud()
        self.test_entalles_crud()
        self.test_telas_crud()
        self.test_hilos_crud()
        
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