# Guía de API Backend - Parte 2: Endpoints y Ejemplos

## 🔐 Autenticación

Todos los endpoints (excepto `/auth/login`) requieren autenticación JWT.

**Header requerido:**
```
Authorization: Bearer {token}
```

---

## 1. 🔑 AUTH - Autenticación

### POST `/auth/login`
Iniciar sesión con username y PIN.

**Request Body:**
```json
{
  "username": "admin",
  "pin": "1234"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Uso del token:**
```javascript
const headers = {
  'Authorization': `Bearer ${access_token}`,
  'Content-Type': 'application/json'
};
```

---

### GET `/auth/me`
Obtener información del usuario autenticado.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "id": "uuid",
  "username": "admin",
  "fullName": "Administrador",
  "role": "ADMIN",
  "isActive": true
}
```

---

## 2. 👥 USERS - Usuarios

### POST `/users`
Crear nuevo usuario.

**Request Body:**
```json
{
  "username": "cajero1",
  "fullName": "Juan Pérez",
  "pin": "5678",
  "role": "CASHIER"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "username": "cajero1",
  "fullName": "Juan Pérez",
  "role": "CASHIER",
  "isActive": true,
  "createdAt": "2026-01-12T10:00:00Z",
  "updatedAt": "2026-01-12T10:00:00Z"
}
```

---

### GET `/users`
Listar todos los usuarios.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "username": "admin",
    "fullName": "Administrador",
    "role": "ADMIN",
    "isActive": true,
    "createdAt": "2026-01-12T10:00:00Z",
    "updatedAt": "2026-01-12T10:00:00Z"
  }
]
```

---

### GET `/users/:id`
Obtener usuario por ID.

**Response (200):** Igual a POST `/users`

---

### DELETE `/users/:id`
Desactivar usuario (soft delete).

**Response (200):**
```json
{
  "message": "User deactivated successfully"
}
```

---

## 3. 📦 CATEGORIES - Categorías de Productos

### POST `/categories`
Crear categoría.

**Request Body:**
```json
{
  "name": "Carnes de Res",
  "description": "Cortes premium de carne de res"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "Carnes de Res",
  "description": "Cortes premium de carne de res",
  "isActive": true,
  "createdAt": "2026-01-12T10:00:00Z",
  "updatedAt": "2026-01-12T10:00:00Z"
}
```

---

### GET `/categories`
Listar todas las categorías activas.

**Query params opcionales:**
- `includeInactive=true` - Incluir inactivas

**Response (200):** Array de categorías

---

### GET `/categories/:id`
Obtener categoría por ID.

---

### PUT `/categories/:id`
Actualizar categoría.

**Request Body:**
```json
{
  "name": "Carnes Premium",
  "description": "Nueva descripción"
}
```

---

### DELETE `/categories/:id`
Desactivar categoría.

---

## 4. 🥩 PRODUCTS - Productos

### POST `/products`
Crear producto.

**Request Body:**
```json
{
  "sku": "CARNE-001",
  "name": "Lomo de Res",
  "description": "Corte premium",
  "categoryId": "uuid",
  "saleType": "WEIGHT",
  "inventoryType": "WEIGHT",
  "price": 45.00,
  "costPrice": 30.00,
  "unit": "kg",
  "stockQuantity": 50.000,
  "minStock": 10.000,
  "trackInventory": true,
  "barcode": "7501234567890",
  "barcodeType": "STANDARD",
  "isActive": true
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "sku": "CARNE-001",
  "name": "Lomo de Res",
  "description": "Corte premium",
  "saleType": "WEIGHT",
  "inventoryType": "WEIGHT",
  "price": "45.00",
  "costPrice": "30.00",
  "barcode": "7501234567890",
  "barcodeType": "STANDARD",
  "stockQuantity": "50.000",
  "minStock": "10.000",
  "unit": "kg",
  "isActive": true,
  "trackInventory": true,
  "categoryId": "uuid",
  "createdAt": "2026-01-12T10:00:00Z",
  "updatedAt": "2026-01-12T10:00:00Z"
}
```

---

### GET `/products`
Listar productos con filtros.

**Query params opcionales:**
- `search=lomo` - Búsqueda por nombre o SKU
- `categoryId=uuid` - Filtrar por categoría
- `isActive=true` - Solo activos

**Response (200):** Array de productos con relación `category`

---

### GET `/products/low-stock`
Productos con stock bajo (≤ minStock).

**Response (200):** Array de productos con stock bajo

---

### GET `/products/barcode/:barcode`
Buscar producto por código de barras.

**Ejemplo:** `/products/barcode/7501234567890`

---

### GET `/products/sku/:sku`
Buscar producto por SKU.

**Ejemplo:** `/products/sku/CARNE-001`

---

### GET `/products/:id`
Obtener producto por ID (incluye categoría).

---

### PUT `/products/:id`
Actualizar producto completo.

---

### PATCH `/products/:id/stock`
Actualizar solo el stock.

**Request Body:**
```json
{
  "stockQuantity": 45.500
}
```

---

### PATCH `/products/:id/adjust-stock`
Ajustar stock (sumar o restar).

**Request Body:**
```json
{
  "adjustment": -2.5,
  "reason": "Merma por deterioro"
}
```

**Nota:** Valores negativos restan, positivos suman.

---

### DELETE `/products/:id`
Desactivar producto.

---

## 5. 🖥️ TERMINALS - Terminales/Cajas

### POST `/terminals`
Crear terminal.

**Request Body:**
```json
{
  "name": "Caja 1",
  "location": "Planta baja, entrada principal",
  "description": "Terminal principal de ventas"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "Caja 1",
  "location": "Planta baja, entrada principal",
  "description": "Terminal principal de ventas",
  "isActive": true,
  "createdAt": "2026-01-12T10:00:00Z",
  "updatedAt": "2026-01-12T10:00:00Z"
}
```

---

### GET `/terminals`
Listar todas las terminales.

---

### GET `/terminals/active`
Listar solo terminales activas.

---

### GET `/terminals/:id`
Obtener terminal por ID.

---

### PUT `/terminals/:id`
Actualizar terminal.

---

### DELETE `/terminals/:id`
Desactivar terminal.

---

## 6. 💰 CASH-SESSIONS - Sesiones de Caja

### POST `/cash-sessions/open`
Abrir sesión de caja.

**Request Body:**
```json
{
  "terminalId": "uuid",
  "openingAmount": 500.00,
  "openingNotes": "Fondo inicial del día"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "terminalId": "uuid",
  "userId": "uuid",
  "openingAmount": "500.00",
  "expectedAmount": "500.00",
  "status": "OPEN",
  "openingNotes": "Fondo inicial del día",
  "openedAt": "2026-01-12T08:00:00Z",
  "updatedAt": "2026-01-12T08:00:00Z",
  "terminal": {
    "id": "uuid",
    "name": "Caja 1"
  },
  "user": {
    "id": "uuid",
    "fullName": "Juan Pérez"
  }
}
```

**Validación:** Solo puede haber UNA sesión OPEN por terminal.

---

### PATCH `/cash-sessions/:id/close`
Cerrar sesión de caja.

**Permisos:** Cualquier usuario autenticado puede cerrar una sesión de caja. Se registra quién cerró la sesión en `closed_by_user_id`, independientemente de quién la abrió (`user_id`).

**Request Body:**
```json
{
  "closingAmount": 1250.50,
  "closingNotes": "Cierre del día, todo correcto"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "status": "CLOSED",
  "openingAmount": "500.00",
  "closingAmount": "1250.50",
  "expectedAmount": "1240.00",
  "differenceAmount": "10.50",
  "closedByUserId": "uuid",
  "closedAt": "2026-01-12T18:00:00Z"
}
```

**Cálculo automático:**
- `expectedAmount = opening + deposits - withdrawals + cash_sales`
- `differenceAmount = closing - expected`

**Auditoría:**
- `user_id`: Usuario que abrió la sesión
- `closed_by_user_id`: Usuario que cerró la sesión (puede ser diferente)

---

### GET `/cash-sessions`
Listar sesiones con filtros.

**Query params:**
- `status=OPEN` - Solo abiertas
- `terminalId=uuid` - Por terminal
- `userId=uuid` - Por usuario

---

### GET `/cash-sessions/my-session`
Obtener sesión abierta del usuario autenticado.

**Response (200):** Sesión o `404` si no tiene sesión abierta.

---

### GET `/cash-sessions/terminal/:terminalId/open`
Obtener sesión abierta de un terminal específico.

---

### GET `/cash-sessions/:id`
Obtener sesión por ID (con relaciones).

---

### GET `/cash-sessions/:id/stats`
Estadísticas de la sesión.

**Response (200):**
```json
{
  "totalSales": 15,
  "totalRevenue": "1240.00",
  "cashSales": "850.00",
  "cardSales": "390.00",
  "averageTicket": "82.67",
  "cancelledSales": 2
}
```

---

### POST `/cash-sessions/:id/movements`
Registrar movimiento de efectivo.

**Request Body:**
```json
{
  "type": "DEPOSIT",
  "amount": 200.00,
  "reason": "Agregar fondos para cambio"
}
```

**Tipos:** `DEPOSIT`, `WITHDRAWAL`, `ADJUSTMENT`

**Response (201):**
```json
{
  "id": "uuid",
  "sessionId": "uuid",
  "type": "DEPOSIT",
  "amount": "200.00",
  "reason": "Agregar fondos para cambio",
  "createdBy": "uuid",
  "createdAt": "2026-01-12T10:00:00Z",
  "creator": {
    "fullName": "Juan Pérez"
  }
}
```

---

### GET `/cash-sessions/:id/movements`
Listar movimientos de una sesión.

---

## 7. 🛒 SALES - Ventas

### POST `/sales`
Crear venta.

**Request Body - Pago en efectivo:**
```json
{
  "sessionId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantity": 2.5,
      "discount": 0
    },
    {
      "productId": "uuid",
      "quantity": 1,
      "discount": 5.00
    }
  ],
  "discount": 10.00,
  "paymentMethod": "CASH",
  "cashAmount": 150.00,
  "notes": "Cliente frecuente",
  "customerName": "María González"
}
```

**Request Body - Pago mixto:**
```json
{
  "sessionId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantity": 3,
      "discount": 0
    }
  ],
  "discount": 0,
  "paymentMethod": "MIXED",
  "cashAmount": 50.00,
  "cardAmount": 80.00,
  "transferAmount": 0,
  "notes": "Pago mixto"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "sessionId": "uuid",
  "cashierId": "uuid",
  "subtotal": "140.00",
  "discount": "10.00",
  "total": "130.00",
  "paymentMethod": "CASH",
  "cashAmount": "150.00",
  "changeAmount": "20.00",
  "status": "COMPLETED",
  "notes": "Cliente frecuente",
  "customerName": "María González",
  "createdAt": "2026-01-12T10:30:00Z",
  "items": [
    {
      "id": "uuid",
      "productId": "uuid",
      "productName": "Lomo de Res",
      "productSku": "CARNE-001",
      "quantity": "2.500",
      "unit": "kg",
      "unitPrice": "45.00",
      "discount": "0.00",
      "subtotal": "112.50",
      "product": {
        "id": "uuid",
        "name": "Lomo de Res",
        "price": "45.00",
        "stockQuantity": "47.500"
      }
    }
  ],
  "cashier": {
    "id": "uuid",
    "fullName": "Juan Pérez"
  }
}
```

**Efectos:**
- Se actualiza automáticamente el inventario (resta del stock)
- Se calcula el vuelto si es pago en efectivo
- Se valida que la sesión esté abierta
- Se valida stock disponible

---

### GET `/sales`
Listar ventas con filtros.

**Query params:**
- `sessionId=uuid` - Por sesión
- `status=COMPLETED` - Por estado
- `startDate=2026-01-12` - Desde fecha
- `endDate=2026-01-13` - Hasta fecha

**Response (200):** Array de ventas con items y cashier

---

### GET `/sales/session/:sessionId/stats`
Estadísticas de ventas de una sesión.

**Response (200):**
```json
{
  "totalSales": 15,
  "completedSales": 13,
  "cancelledSales": 2,
  "totalRevenue": "1240.00",
  "cashSales": "850.00",
  "cardSales": "390.00",
  "transferSales": "0.00",
  "mixedSales": "0.00",
  "averageTicket": "95.38"
}
```

---

### GET `/sales/:id`
Obtener venta por ID (con items y relaciones).

---

### PATCH `/sales/:id/cancel`
Cancelar venta.

**Request Body:**
```json
{
  "reason": "Error en el pedido"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "status": "CANCELLED",
  "notes": "Error en el pedido"
}
```

**Efectos:**
- Se restaura el inventario (suma de vuelta al stock)
- El campo `notes` se actualiza con la razón

---

## 8. 📋 ORDERS - Pedidos

### POST `/orders`
Crear pedido.

**Request Body:**
```json
{
  "customerName": "Juan Pérez",
  "customerPhone": "+591 77123456",
  "customerEmail": "juan@email.com",
  "items": [
    {
      "productId": "uuid",
      "quantity": 5,
      "discount": 0,
      "notes": "Corte grueso"
    },
    {
      "productId": "uuid-vacuum-product",
      "batchId": "uuid-specific-batch",
      "quantity": 1,
      "discount": 0,
      "notes": "Lote específico reservado"
    }
  ],
  "discount": 0,
  "deposit": 50.00,
  "deliveryDate": "2026-01-15",
  "deliveryTime": "10:00",
  "notes": "Cliente prefiere entrega temprano",
  "internalNotes": "Cliente frecuente"
}
```

**Campos de Items:**
- `productId` (requerido): ID del producto
- `batchId` (opcional): ID del lote específico para productos al vacío. Si se proporciona:
  - El lote debe existir y no estar vendido
  - El lote queda reservado para este pedido (no se puede usar en otros pedidos activos)
  - El precio se toma del lote (`unitPrice`), no del producto
  - Al entregar sin venta, el lote se marca automáticamente como vendido
- `quantity` (requerido): Cantidad
- `discount` (opcional): Descuento del item
- `notes` (opcional): Notas del item

**Response (201):**
```json
{
  "id": "uuid",
  "orderNumber": "ORD2601120001",
  "customerName": "Juan Pérez",
  "customerPhone": "+591 77123456",
  "customerEmail": "juan@email.com",
  "subtotal": "225.00",
  "discount": "0.00",
  "total": "225.00",
  "deposit": "50.00",
  "status": "PENDING",
  "deliveryDate": "2026-01-15",
  "deliveryTime": "10:00:00",
  "notes": "Cliente prefiere entrega temprano",
  "internalNotes": "Cliente frecuente",
  "createdBy": "uuid",
  "createdAt": "2026-01-12T10:00:00Z",
  "updatedAt": "2026-01-12T10:00:00Z",
  "items": [
    {
      "id": "uuid",
      "productName": "Lomo de Res",
      "productSku": "CARNE-001",
      "quantity": "5.000",
      "unit": "kg",
      "unitPrice": "45.00",
      "discount": "0.00",
      "subtotal": "225.00",
      "notes": "Corte grueso",
      "batchId": null,
      "batch": null
    },
    {
      "id": "uuid",
      "productName": "CARNITAAA",
      "productSku": "13GW",
      "quantity": "1.000",
      "unit": "paquete",
      "unitPrice": "58.00",
      "discount": "0.00",
      "subtotal": "58.00",
      "notes": "Lote específico reservado",
      "batchId": "uuid-specific-batch",
      "batch": {
        "id": "uuid-specific-batch",
        "batchNumber": "13GW-20260113-001",
        "actualWeight": "12.000",
        "unitPrice": "58.00",
        "isSold": false
      }
    }
  ],
  "creator": {
    "fullName": "Juan Pérez"
  }
}
```

**Validaciones:**
- El depósito debe ser ≤ total
- deliveryTime debe ser formato HH:mm
- items debe tener al menos 1 producto

---

### GET `/orders`
Listar pedidos con filtros.

**Query params:**
- `status=PENDING` - Por estado
- `customerName=juan` - Por nombre cliente
- `startDate=2026-01-12` - Desde fecha
- `endDate=2026-01-15` - Hasta fecha

**Response (200):** Array de pedidos con items y creator

---

### GET `/orders/statistics`
Estadísticas de pedidos.

**Query params (opcionales):**
- `startDate=2026-01-01`
- `endDate=2026-01-31`

**Response (200):**
```json
{
  "totalOrders": 10,
  "pending": 3,
  "confirmed": 2,
  "ready": 2,
  "delivered": 2,
  "cancelled": 1,
  "totalRevenue": "450.00",
  "totalDeposits": "200.00",
  "averageOrderValue": "95.00"
}
```

---

### GET `/orders/:id`
Obtener pedido por ID (con items completos).

---

### PATCH `/orders/:id`
Actualizar pedido (incluyendo items/productos).

**Request Body (todos los campos opcionales):**
```json
{
  "customerName": "Juan Pérez López",
  "customerPhone": "+591 77123456",
  "deliveryDate": "2026-01-16",
  "deliveryTime": "11:00",
  "notes": "Nueva nota",
  "items": [
    {
      "productId": "uuid-producto-1",
      "quantity": 2,
      "discount": 0,
      "notes": "Sin grasa"
    },
    {
      "productId": "uuid-producto-2",
      "batchId": "uuid-lote-1",
      "quantity": 1,
      "discount": 0
    }
  ]
}
```

**Campos de items:**
- `productId` (requerido): ID del producto
- `batchId` (opcional): ID del lote específico para productos al vacío
- `quantity` (requerido): Cantidad del producto
- `discount` (opcional): Descuento del item
- `notes` (opcional): Notas del item

**Restricción:** No se puede modificar si está DELIVERED o CANCELLED.

**Gestión de lotes al editar:**
- Si se proporcionan `items` en la actualización, **se reemplazan completamente los items existentes**
- Los lotes que estaban en el pedido pero ya no están se "liberan" (quedan disponibles nuevamente)
- Los nuevos lotes se validan (deben existir, no estar vendidos, pertenecer al producto correcto)
- Los lotes solo se marcan como vendidos (`isSold = true`) cuando:
  1. El pedido se marca como DELIVERED (sin venta asociada)
  2. El pedido se cobra en POS (con venta asociada)

**Nota:** Si no se envía el campo `items`, solo se actualizan los datos del cliente y entrega, manteniendo los items existentes.

---

### PATCH `/orders/:id/confirm`
Confirmar pedido (PENDING → CONFIRMED).

**Response (200):**
```json
{
  "id": "uuid",
  "orderNumber": "ORD2601120001",
  "status": "CONFIRMED",
  "confirmedAt": "2026-01-12T11:00:00Z"
}
```

---

### PATCH `/orders/:id/ready`
Marcar como listo (CONFIRMED → READY).

**Response (200):**
```json
{
  "id": "uuid",
  "status": "READY"
}
```

---

### PATCH `/orders/:id/delivered`
Marcar como entregado (READY → DELIVERED).

**Efectos automáticos si no hay venta asociada (saleId = null):**
- **Lotes**: Se marcan como vendidos (`isSold = true`)
- **Stock**: Se descuenta del inventario para productos con `trackInventory = true`
- **Validación**: Verifica que haya stock suficiente antes de marcar como entregado

**Escenarios:**
1. **Pedido cobrado en POS**: Ya tiene `saleId`, el stock ya fue descontado → No hace nada
2. **Entrega sin venta**: No tiene `saleId` → Descuenta stock y marca lotes como vendidos

**Response (200):**
```json
{
  "id": "uuid",
  "status": "DELIVERED",
  "deliveredAt": "2026-01-15T10:30:00Z"
}
```

**Error si stock insuficiente:**
```json
{
  "statusCode": 400,
  "message": "Insufficient stock for product Lomo de Res. Available: 10, Required: 15"
}
```

---

### PATCH `/orders/:id/cancel`
Cancelar pedido.

**Request Body:**
```json
{
  "reason": "Cliente canceló"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "status": "CANCELLED",
  "cancelledAt": "2026-01-12T12:00:00Z",
  "cancellationReason": "Cliente canceló"
}
```

---

## 9. 📊 REPORTS - Reportes

### GET `/reports/dashboard`
Resumen del dashboard.

**Response (200):**
```json
{
  "today": {
    "sales": 15,
    "revenue": 1240.50
  },
  "alerts": {
    "openSessions": 1,
    "pendingOrders": 3,
    "lowStockProducts": 2,
    "upcomingDeliveries": 5
  }
}
```

---

### GET `/reports/sales`
Reporte de ventas.

**Query params (opcionales):**
- `startDate=2026-01-01`
- `endDate=2026-01-31`

**Response (200):**
```json
{
  "period": {
    "startDate": "2026-01-01",
    "endDate": "2026-01-31"
  },
  "summary": {
    "totalSales": 150,
    "totalRevenue": 12450.50,
    "averageTicket": 83.00
  },
  "paymentMethods": {
    "CASH": 6500.00,
    "CARD": 4950.50,
    "TRANSFER": 1000.00,
    "MIXED": 0.00
  },
  "salesByCashier": {
    "Juan Pérez": {
      "count": 80,
      "revenue": 6700.00
    },
    "María López": {
      "count": 70,
      "revenue": 5750.50
    }
  },
  "dailySales": {
    "2026-01-01": {
      "count": 10,
      "revenue": 850.00
    }
  }
}
```

---

### GET `/reports/products`
Reporte de productos.

**Query params (opcionales):**
- `startDate=2026-01-01`
- `endDate=2026-01-31`

**Response (200):**
```json
{
  "period": {
    "startDate": "2026-01-01",
    "endDate": "2026-01-31"
  },
  "summary": {
    "totalProducts": 25,
    "totalQuantitySold": 450.500,
    "totalRevenue": 12450.00
  },
  "topProducts": [
    {
      "productId": "uuid",
      "productName": "Lomo de Res",
      "productSku": "CARNE-001",
      "quantitySold": 125.500,
      "revenue": 5647.50,
      "timesOrdered": 85,
      "unit": "kg"
    }
  ],
  "allProducts": [],
  "inventory": {
    "totalProducts": 50,
    "lowStockCount": 3,
    "lowStockProducts": [
      {
        "id": "uuid",
        "name": "Lomo de Res",
        "sku": "CARNE-001",
        "currentStock": 8.500,
        "minStock": 10.000,
        "unit": "kg"
      }
    ]
  }
}
```

---

### GET `/reports/cash-sessions`
Reporte de sesiones de caja.

**Query params (opcionales):**
- `startDate=2026-01-01`
- `endDate=2026-01-31`

**Response (200):**
```json
{
  "period": {
    "startDate": "2026-01-01",
    "endDate": "2026-01-31"
  },
  "summary": {
    "totalSessions": 25,
    "openSessions": 1,
    "closedSessions": 24,
    "totalCashIn": 2000.00,
    "totalCashOut": 500.00,
    "totalExpected": 30450.00,
    "totalActual": 30465.00,
    "totalDifference": 15.00
  },
  "sessionsByTerminal": {
    "Caja 1": {
      "count": 15
    },
    "Caja 2": {
      "count": 10
    }
  },
  "recentSessions": []
}
```

---

### GET `/reports/orders`
Reporte de pedidos.

**Query params (opcionales):**
- `startDate=2026-01-01`
- `endDate=2026-01-31`

**Response (200):**
```json
{
  "period": {
    "startDate": "2026-01-01",
    "endDate": "2026-01-31"
  },
  "summary": {
    "totalOrders": 50,
    "pending": 10,
    "confirmed": 15,
    "ready": 8,
    "delivered": 15,
    "cancelled": 2,
    "totalRevenue": 4500.00,
    "totalDeposits": 1200.00,
    "averageOrderValue": 90.00
  },
  "upcomingDeliveries": [
    {
      "id": "uuid",
      "orderNumber": "ORD2601150001",
      "customerName": "Juan Pérez",
      "customerPhone": "+591 77123456",
      "deliveryDate": "2026-01-15",
      "deliveryTime": "10:00:00",
      "status": "READY",
      "total": 225.00,
      "deposit": 50.00
    }
  ]
}
```

---

## 🔧 Códigos de Error

| Código | Significado | Ejemplo |
|--------|-------------|---------|
| 400 | Bad Request | Datos inválidos en request |
| 401 | Unauthorized | Token inválido o expirado |
| 403 | Forbidden | Sin permisos para la acción |
| 404 | Not Found | Recurso no encontrado |
| 409 | Conflict | Conflicto (ej: sesión ya abierta) |
| 500 | Internal Server Error | Error del servidor |

**Formato de error:**
```json
{
  "statusCode": 400,
  "message": ["Field 'name' should not be empty"],
  "error": "Bad Request"
}
```

---

## 💡 Flujos de Trabajo Comunes

### Flujo 1: Abrir Caja y Realizar Venta

```javascript
// 1. Login
const { access_token } = await POST('/auth/login', {
  username: 'cajero1',
  pin: '1234'
});

// 2. Abrir sesión
const session = await POST('/cash-sessions/open', {
  terminalId: 'terminal-uuid',
  openingAmount: 500.00
});

// 3. Realizar venta
const sale = await POST('/sales', {
  sessionId: session.id,
  items: [
    { productId: 'product-uuid', quantity: 2.5, discount: 0 }
  ],
  discount: 0,
  paymentMethod: 'CASH',
  cashAmount: 150.00
});

// 4. Ver estadísticas
const stats = await GET(`/sales/session/${session.id}/stats`);

// 5. Cerrar sesión
const closed = await PATCH(`/cash-sessions/${session.id}/close`, {
  closingAmount: 1250.50
});
```

---

### Flujo 2: Gestión de Pedido

```javascript
// 1. Crear pedido
const order = await POST('/orders', {
  customerName: 'Juan Pérez',
  customerPhone: '+591 77123456',
  items: [
    { productId: 'product-uuid', quantity: 5, discount: 0 }
  ],
  discount: 0,
  deposit: 50.00,
  deliveryDate: '2026-01-15',
  deliveryTime: '10:00',
  notes: 'Cliente frecuente'
});

// 2. Confirmar pedido
await PATCH(`/orders/${order.id}/confirm`);

// 3. Marcar como listo
await PATCH(`/orders/${order.id}/ready`);

// 4. Ver pedidos listos
const readyOrders = await GET('/orders?status=READY');

// 5. Entregar pedido
await PATCH(`/orders/${order.id}/delivered`);

// 6. (Si es necesario) Cancelar
// await PATCH(`/orders/${order.id}/cancel`, { reason: 'Motivo' });
```

---

### Flujo 3: Consultar Reportes

```javascript
// Dashboard
const dashboard = await GET('/reports/dashboard');

// Ventas del mes
const salesReport = await GET('/reports/sales?startDate=2026-01-01&endDate=2026-01-31');

// Productos más vendidos
const productsReport = await GET('/reports/products?startDate=2026-01-01');

// Pedidos pendientes
const ordersReport = await GET('/reports/orders');
```

---

## 📱 Integración con Frontend

### Manejo de Tokens

```javascript
// Guardar token después de login
localStorage.setItem('auth_token', access_token);

// Usar token en requests
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
  'Content-Type': 'application/json'
};

// Interceptor para manejar 401
if (response.status === 401) {
  localStorage.removeItem('auth_token');
  redirectTo('/login');
}
```

---

### Manejo de Errores

```javascript
try {
  const response = await fetch('/api/sales', {
    method: 'POST',
    headers,
    body: JSON.stringify(saleData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  const sale = await response.json();
  return sale;
  
} catch (error) {
  console.error('Error creating sale:', error.message);
  showNotification(error.message, 'error');
}
```

---

### Validación de Sesión Abierta

```javascript
// Verificar si usuario tiene sesión abierta
async function checkOpenSession() {
  try {
    const session = await GET('/cash-sessions/my-session');
    return session;
  } catch (error) {
    if (error.status === 404) {
      return null; // No hay sesión abierta
    }
    throw error;
  }
}

// Antes de vender, validar
const session = await checkOpenSession();
if (!session) {
  showAlert('Debe abrir una sesión de caja primero');
  return;
}
```

---

### Formato de Números

```javascript
// Para enviar al backend
const price = 45.99;
const requestBody = {
  price: price,  // Enviar como number, no como string
  quantity: 2.5
};

// Al recibir del backend
const product = await GET('/products/uuid');
const price = parseFloat(product.price);  // Convertir a number
const stock = parseFloat(product.stockQuantity);
```

---

## 🎯 Puntos Clave para Integración

1. **Todos los IDs son UUIDs** (strings)
2. **Los decimales vienen como strings** del backend, convertir a number
3. **Los enums son MAYÚSCULAS** ('CASH', 'PENDING', etc.)
4. **Las fechas son ISO 8601** strings
5. **Validar sesión abierta** antes de vender
6. **Manejar errores 401** (token expirado)
7. **Los snapshot fields** (product_name, unit_price) se copian automáticamente
8. **Stock se actualiza** automáticamente en ventas COMPLETED y CANCELLED
9. **Una terminal = una sesión** abierta a la vez
10. **Bearer token** requerido en todos los endpoints excepto `/auth/login`

---

**Fin de la Guía de API**

Para más detalles sobre la estructura de base de datos, consulta `API_GUIDE_PART1_DATABASE.md`
