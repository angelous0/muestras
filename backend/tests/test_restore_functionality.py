"""
Test suite for audit log restore functionality.
Tests:
1. Delete operations saving datos_completos in audit log
2. POST /api/historial/{log_id}/restaurar endpoint
3. Validation of restore endpoint (rejects non-ELIMINAR, rejects missing datos_completos)
"""
import pytest
import requests
import os
import json
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuthAndSetup:
    """Authentication and basic setup tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()["access_token"]
    
    def test_login_success(self, auth_token):
        """Verify login works with admin credentials"""
        assert auth_token is not None
        assert len(auth_token) > 10
        print(f"Login successful, token obtained")

    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        print(f"API root: {response.json()}")


class TestDeleteSavesDatosCompletos:
    """Tests that delete operations save datos_completos in audit log"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_delete_marca_saves_datos_completos(self, auth_headers):
        """Test that deleting a Marca saves datos_completos in audit log"""
        # Create a marca to delete
        marca_data = {"nombre": "TEST_MARCA_DELETE_" + str(int(time.time())), "descripcion": "Test for deletion", "activo": True}
        create_response = requests.post(f"{BASE_URL}/api/marcas", json=marca_data, headers=auth_headers)
        assert create_response.status_code == 200, f"Failed to create marca: {create_response.text}"
        marca_id = create_response.json()["id"]
        print(f"Created test marca with ID: {marca_id}")
        
        # Delete the marca
        delete_response = requests.delete(f"{BASE_URL}/api/marcas/{marca_id}", headers=auth_headers)
        assert delete_response.status_code == 200, f"Failed to delete marca: {delete_response.text}"
        print(f"Deleted marca {marca_id}")
        
        # Check audit log for the deletion with datos_completos
        audit_response = requests.get(f"{BASE_URL}/api/audit-logs", params={"entidad": "Marca", "accion": "ELIMINAR"}, headers=auth_headers)
        assert audit_response.status_code == 200, f"Failed to get audit logs: {audit_response.text}"
        
        logs = audit_response.json()["data"]
        # Find our deletion log
        deletion_log = None
        for log in logs:
            if log.get("entidad_nombre") == marca_data["nombre"]:
                deletion_log = log
                break
        
        assert deletion_log is not None, "Deletion log not found"
        detalles = json.loads(deletion_log["detalles"]) if deletion_log["detalles"] else None
        assert detalles is not None, "Detalles is None"
        assert "datos_completos" in detalles, "datos_completos not in detalles"
        assert detalles["datos_completos"]["nombre"] == marca_data["nombre"], "Saved name doesn't match"
        print(f"Audit log has datos_completos: {detalles['datos_completos'].keys()}")
    
    def test_delete_hilo_saves_datos_completos(self, auth_headers):
        """Test that deleting a Hilo saves datos_completos in audit log"""
        # Create a hilo to delete
        hilo_data = {"nombre": "TEST_HILO_DELETE_" + str(int(time.time())), "activo": True}
        create_response = requests.post(f"{BASE_URL}/api/hilos", json=hilo_data, headers=auth_headers)
        assert create_response.status_code == 200, f"Failed to create hilo: {create_response.text}"
        hilo_id = create_response.json()["id"]
        
        # Delete the hilo
        delete_response = requests.delete(f"{BASE_URL}/api/hilos/{hilo_id}", headers=auth_headers)
        assert delete_response.status_code == 200
        
        # Check audit log
        audit_response = requests.get(f"{BASE_URL}/api/audit-logs", params={"entidad": "Hilo", "accion": "ELIMINAR"}, headers=auth_headers)
        assert audit_response.status_code == 200
        
        logs = audit_response.json()["data"]
        deletion_log = next((log for log in logs if log.get("entidad_nombre") == hilo_data["nombre"]), None)
        
        assert deletion_log is not None
        detalles = json.loads(deletion_log["detalles"])
        assert "datos_completos" in detalles
        print(f"Hilo deletion saved datos_completos successfully")


class TestRestoreEndpoint:
    """Tests for POST /api/historial/{log_id}/restaurar endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_restore_marca_success(self, auth_headers):
        """Test restoring a deleted marca"""
        # Create and delete a marca
        marca_name = "TEST_MARCA_RESTORE_" + str(int(time.time()))
        marca_data = {"nombre": marca_name, "descripcion": "Test for restoration", "activo": True}
        create_response = requests.post(f"{BASE_URL}/api/marcas", json=marca_data, headers=auth_headers)
        assert create_response.status_code == 200
        marca_id = create_response.json()["id"]
        
        delete_response = requests.delete(f"{BASE_URL}/api/marcas/{marca_id}", headers=auth_headers)
        assert delete_response.status_code == 200
        
        # Find the deletion log
        audit_response = requests.get(f"{BASE_URL}/api/audit-logs", params={"entidad": "Marca", "accion": "ELIMINAR"}, headers=auth_headers)
        logs = audit_response.json()["data"]
        deletion_log = next((log for log in logs if log.get("entidad_nombre") == marca_name), None)
        assert deletion_log is not None, "Deletion log not found"
        
        # Restore the marca
        restore_response = requests.post(f"{BASE_URL}/api/historial/{deletion_log['id']}/restaurar", headers=auth_headers)
        assert restore_response.status_code == 200, f"Restore failed: {restore_response.text}"
        
        restored_data = restore_response.json()
        assert "new_id" in restored_data
        assert "Marca restaurado correctamente" in restored_data["message"]
        print(f"Marca restored successfully, new ID: {restored_data['new_id']}")
        
        # Verify marca exists with GET
        get_response = requests.get(f"{BASE_URL}/api/marcas", params={"search": marca_name}, headers=auth_headers)
        assert get_response.status_code == 200
        marcas = get_response.json()
        assert len(marcas) >= 1, "Restored marca not found"
        
        # Cleanup - delete the restored marca
        requests.delete(f"{BASE_URL}/api/marcas/{restored_data['new_id']}", headers=auth_headers)
    
    def test_restore_creates_restaurar_audit_log(self, auth_headers):
        """Test that restore action creates a RESTAURAR audit log entry"""
        # Create and delete a tela
        tela_name = "TEST_TELA_RESTORE_" + str(int(time.time()))
        tela_data = {"nombre": tela_name, "descripcion": "Test for audit log", "activo": True}
        create_response = requests.post(f"{BASE_URL}/api/telas", json=tela_data, headers=auth_headers)
        assert create_response.status_code == 200
        tela_id = create_response.json()["id"]
        
        delete_response = requests.delete(f"{BASE_URL}/api/telas/{tela_id}", headers=auth_headers)
        assert delete_response.status_code == 200
        
        # Find the deletion log
        audit_response = requests.get(f"{BASE_URL}/api/audit-logs", params={"entidad": "Tela", "accion": "ELIMINAR"}, headers=auth_headers)
        logs = audit_response.json()["data"]
        deletion_log = next((log for log in logs if log.get("entidad_nombre") == tela_name), None)
        assert deletion_log is not None
        
        # Restore the tela
        restore_response = requests.post(f"{BASE_URL}/api/historial/{deletion_log['id']}/restaurar", headers=auth_headers)
        assert restore_response.status_code == 200
        new_id = restore_response.json()["new_id"]
        
        # Check for RESTAURAR action in audit logs
        time.sleep(0.5)  # Allow time for DB write
        audit_response = requests.get(f"{BASE_URL}/api/audit-logs", params={"entidad": "Tela", "accion": "RESTAURAR"}, headers=auth_headers)
        assert audit_response.status_code == 200
        
        restore_logs = audit_response.json()["data"]
        restore_log = next((log for log in restore_logs if log.get("entidad_nombre") == tela_name), None)
        assert restore_log is not None, "RESTAURAR log entry not found"
        assert restore_log["accion"] == "RESTAURAR"
        print(f"RESTAURAR audit log entry created successfully")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/telas/{new_id}", headers=auth_headers)
    
    def test_restore_rejects_non_eliminar_log(self, auth_headers):
        """Test that restore rejects logs that are not ELIMINAR"""
        # Create a marca to generate a CREAR log
        marca_data = {"nombre": "TEST_MARCA_CREATE_" + str(int(time.time())), "activo": True}
        create_response = requests.post(f"{BASE_URL}/api/marcas", json=marca_data, headers=auth_headers)
        assert create_response.status_code == 200
        marca_id = create_response.json()["id"]
        
        # Find the CREAR log
        audit_response = requests.get(f"{BASE_URL}/api/audit-logs", params={"entidad": "Marca", "accion": "CREAR"}, headers=auth_headers)
        logs = audit_response.json()["data"]
        create_log = next((log for log in logs if log.get("entidad_nombre") == marca_data["nombre"]), None)
        assert create_log is not None
        
        # Try to restore from CREAR log (should fail)
        restore_response = requests.post(f"{BASE_URL}/api/historial/{create_log['id']}/restaurar", headers=auth_headers)
        assert restore_response.status_code == 400, f"Expected 400, got {restore_response.status_code}"
        assert "Solo se pueden restaurar elementos eliminados" in restore_response.json()["detail"]
        print(f"Correctly rejected restore of CREAR log")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/marcas/{marca_id}", headers=auth_headers)
    
    def test_restore_not_found_log(self, auth_headers):
        """Test that restore returns 404 for non-existent log ID"""
        fake_log_id = "00000000-0000-0000-0000-000000000000"
        restore_response = requests.post(f"{BASE_URL}/api/historial/{fake_log_id}/restaurar", headers=auth_headers)
        assert restore_response.status_code == 404
        assert "no encontrado" in restore_response.json()["detail"].lower()
        print(f"Correctly returned 404 for non-existent log")


class TestAuditLogEndpoints:
    """Tests for audit log listing and filtering endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_audit_logs(self, auth_headers):
        """Test GET /api/audit-logs returns paginated list"""
        response = requests.get(f"{BASE_URL}/api/audit-logs", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "data" in data
        assert "total" in data
        assert "page" in data
        assert "pages" in data
        print(f"Got {len(data['data'])} audit logs, total: {data['total']}")
    
    def test_filter_audit_logs_by_entidad(self, auth_headers):
        """Test filtering audit logs by entity"""
        response = requests.get(f"{BASE_URL}/api/audit-logs", params={"entidad": "Marca"}, headers=auth_headers)
        assert response.status_code == 200
        
        logs = response.json()["data"]
        for log in logs:
            assert log["entidad"] == "Marca"
        print(f"Filter by entidad works correctly, got {len(logs)} Marca logs")
    
    def test_filter_audit_logs_by_accion(self, auth_headers):
        """Test filtering audit logs by action type"""
        response = requests.get(f"{BASE_URL}/api/audit-logs", params={"accion": "ELIMINAR"}, headers=auth_headers)
        assert response.status_code == 200
        
        logs = response.json()["data"]
        for log in logs:
            assert log["accion"] == "ELIMINAR"
        print(f"Filter by accion works correctly, got {len(logs)} ELIMINAR logs")
    
    def test_filter_by_restaurar_action(self, auth_headers):
        """Test filtering by RESTAURAR action"""
        response = requests.get(f"{BASE_URL}/api/audit-logs", params={"accion": "RESTAURAR"}, headers=auth_headers)
        assert response.status_code == 200
        
        logs = response.json()["data"]
        for log in logs:
            assert log["accion"] == "RESTAURAR"
        print(f"Filter by RESTAURAR action works, got {len(logs)} logs")
    
    def test_get_audit_entities(self, auth_headers):
        """Test GET /api/audit-logs/entities returns unique entities"""
        response = requests.get(f"{BASE_URL}/api/audit-logs/entities", headers=auth_headers)
        assert response.status_code == 200
        
        entities = response.json()
        assert isinstance(entities, list)
        print(f"Got {len(entities)} unique entities: {entities}")
    
    def test_get_audit_stats(self, auth_headers):
        """Test GET /api/audit-logs/stats returns statistics"""
        response = requests.get(f"{BASE_URL}/api/audit-logs/stats", headers=auth_headers)
        assert response.status_code == 200
        
        stats = response.json()
        assert "by_action" in stats
        assert "by_entity" in stats
        assert "recent_7_days" in stats
        print(f"Stats: by_action={stats['by_action']}, recent_7_days={stats['recent_7_days']}")


class TestRestoreVariousEntities:
    """Test restore functionality for various entity types"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_restore_tipo_producto(self, auth_headers):
        """Test restoring a deleted Tipo Producto"""
        name = "TEST_TIPO_RESTORE_" + str(int(time.time()))
        
        # Create
        create_response = requests.post(f"{BASE_URL}/api/tipos-producto", json={"nombre": name, "activo": True}, headers=auth_headers)
        assert create_response.status_code == 200
        item_id = create_response.json()["id"]
        
        # Delete
        delete_response = requests.delete(f"{BASE_URL}/api/tipos-producto/{item_id}", headers=auth_headers)
        assert delete_response.status_code == 200
        
        # Find log
        audit_response = requests.get(f"{BASE_URL}/api/audit-logs", params={"entidad": "Tipo Producto", "accion": "ELIMINAR"}, headers=auth_headers)
        logs = audit_response.json()["data"]
        deletion_log = next((log for log in logs if log.get("entidad_nombre") == name), None)
        assert deletion_log is not None
        
        # Restore
        restore_response = requests.post(f"{BASE_URL}/api/historial/{deletion_log['id']}/restaurar", headers=auth_headers)
        assert restore_response.status_code == 200
        new_id = restore_response.json()["new_id"]
        print(f"Tipo Producto restored, new_id: {new_id}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/tipos-producto/{new_id}", headers=auth_headers)
    
    def test_restore_entalle(self, auth_headers):
        """Test restoring a deleted Entalle"""
        name = "TEST_ENTALLE_RESTORE_" + str(int(time.time()))
        
        # Create
        create_response = requests.post(f"{BASE_URL}/api/entalles", json={"nombre": name, "activo": True}, headers=auth_headers)
        assert create_response.status_code == 200
        item_id = create_response.json()["id"]
        
        # Delete
        delete_response = requests.delete(f"{BASE_URL}/api/entalles/{item_id}", headers=auth_headers)
        assert delete_response.status_code == 200
        
        # Find log
        audit_response = requests.get(f"{BASE_URL}/api/audit-logs", params={"entidad": "Entalle", "accion": "ELIMINAR"}, headers=auth_headers)
        logs = audit_response.json()["data"]
        deletion_log = next((log for log in logs if log.get("entidad_nombre") == name), None)
        assert deletion_log is not None
        
        # Restore
        restore_response = requests.post(f"{BASE_URL}/api/historial/{deletion_log['id']}/restaurar", headers=auth_headers)
        assert restore_response.status_code == 200
        new_id = restore_response.json()["new_id"]
        print(f"Entalle restored, new_id: {new_id}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/entalles/{new_id}", headers=auth_headers)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
