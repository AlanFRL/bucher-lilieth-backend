# Guía de API Backend - Parte 1: Base de Datos y Entidades

## 📋 Información General

**Base URL:** `http://localhost:3000/api`  
**Base de Datos:** PostgreSQL 16.3  
**ORM:** TypeORM  
**Autenticación:** JWT Bearer Token

---

## 📊 Estructura de Base de Datos

### 1. USERS (Tabla: `users`)

**Entidad:** `User`

| Columna | Tipo PostgreSQL | Tipo TypeScript | Restricciones | Descripción |
|---------|-----------------|-----------------|---------------|-------------|
| `id` | UUID | string | PRIMARY KEY | Identificador único |
| `username` | VARCHAR(50) | string | UNIQUE, NOT NULL | Nombre de usuario |
| `password_hash` | TEXT | string \| null | NULLABLE | Hash de contraseña (bcrypt) |
| `full_name` | VARCHAR(100) | string | NOT NULL | Nombre completo |
| `pin` | TEXT | string \| null | NULLABLE | PIN de 4 dígitos (bcrypt) |
| `role` | ENUM | UserRole | NOT NULL, DEFAULT 'CASHIER' | Rol del usuario |
| `is_active` | BOOLEAN | boolean | NOT NULL, DEFAULT true | Estado activo |
| `created_at` | TIMESTAMP | Date | NOT NULL, AUTO | Fecha de creación |
| `updated_at` | TIMESTAMP | Date | NOT NULL, AUTO | Fecha de actualización |

**Enum UserRole:**
```typescript
enum UserRole {
  ADMIN = 'ADMIN',      // Administrador total
  MANAGER = 'MANAGER',  // Gerente
  CASHIER = 'CASHIER'   // Cajero
}
```

**Relaciones:**
- Relación 1:N con `cash_sessions` (usuario que abre sesión)
- Relación 1:N con `cash_movements` (usuario que crea movimiento)
- Relación 1:N con `sales` (cajero de la venta)
- Relación 1:N con `orders` (usuario que crea pedido)

---

### 2. PRODUCT_CATEGORIES (Tabla: `product_categories`)

**Entidad:** `ProductCategory`

| Columna | Tipo PostgreSQL | Tipo TypeScript | Restricciones | Descripción |
|---------|-----------------|-----------------|---------------|-------------|
| `id` | UUID | string | PRIMARY KEY | Identificador único |
| `name` | VARCHAR(100) | string | NOT NULL | Nombre de categoría |
| `description` | TEXT | string \| null | NULLABLE | Descripción |
| `is_active` | BOOLEAN | boolean | NOT NULL, DEFAULT true | Estado activo |
| `created_at` | TIMESTAMP | Date | NOT NULL, AUTO | Fecha de creación |
| `updated_at` | TIMESTAMP | Date | NOT NULL, AUTO | Fecha de actualización |

**Relaciones:**
- Relación 1:N con `products`

**Ejemplos de categorías:**
- Carnes de Res
- Aves
- Embutidos
- Productos al Vacío

---

### 3. PRODUCTS (Tabla: `products`)

**Entidad:** `Product`

| Columna | Tipo PostgreSQL | Tipo TypeScript | Restricciones | Descripción |
|---------|-----------------|-----------------|---------------|-------------|
| `id` | UUID | string | PRIMARY KEY | Identificador único |
| `sku` | VARCHAR(50) | string | UNIQUE, NOT NULL | Código interno (auto-generado) |
| `name` | VARCHAR(200) | string | NOT NULL | Nombre del producto |
| `description` | TEXT | string \| null | NULLABLE | Descripción |
| `sale_type` | ENUM | SaleType | NOT NULL | Tipo de venta |
| `inventory_type` | ENUM | InventoryType | NOT NULL | Tipo de inventario |
| `price` | DECIMAL(10,2) | number | NOT NULL | Precio de venta |
| `cost_price` | DECIMAL(10,2) | number \| null | NULLABLE | Precio de costo |
| `barcode` | VARCHAR(100) | string | NOT NULL | Código de barras |
| `barcode_type` | ENUM | BarcodeType | NOT NULL | Tipo de código de barras |
| `stock_quantity` | DECIMAL(10,3) | number | NOT NULL, DEFAULT 0 | Cantidad en stock |
| `min_stock` | DECIMAL(10,3) | number | NOT NULL, DEFAULT 0 | Stock mínimo (alerta) |
| `unit` | VARCHAR(20) | string \| null | NULLABLE | Unidad de medida |
| `is_active` | BOOLEAN | boolean | NOT NULL, DEFAULT true | Estado activo |
| `track_inventory` | BOOLEAN | boolean | NOT NULL, DEFAULT false | Seguimiento de inventario |
| `category_id` | UUID | string | FOREIGN KEY | Referencia a categoría |
| `created_at` | TIMESTAMP | Date | NOT NULL, AUTO | Fecha de creación |
| `updated_at` | TIMESTAMP | Date | NOT NULL, AUTO | Fecha de actualización |

**SKU Auto-generado:**
- El SKU se genera automáticamente al crear el producto
- Formato: `{PREFIJO}-{NÚMERO}` (ej: `CARN-0001`, `AVES-0002`)
- El prefijo se deriva del nombre de la categoría (primeras 4 letras)
- El número es secuencial por categoría
- **Es inmutable**: No cambia después de creado, ni siquiera si la categoría cambia
- Ejemplos:
  - Categoría "Carnes de Res" → `CARN-0001`, `CARN-0002`, ...
  - Categoría "Aves" → `AVES-0001`, `AVES-0002`, ...
  - Categoría "Embutidos" → `EMBU-0001`, `EMBU-0002`, ...

**Barcode Obligatorio:**
- El campo `barcode` es ahora **obligatorio** al crear productos
- Para productos comerciales: Código completo (ej: `7501234567890`)
- Para productos pesados/al vacío: Segmento W de 6 dígitos (ej: `200001`)
- Se valida unicidad y formato según `barcode_type`

**Enums:**

```typescript
enum SaleType {
  UNIT = 'UNIT',       // Venta por unidad (ej: 1 paquete)
  WEIGHT = 'WEIGHT'    // Venta por peso (ej: 2.5 kg)
}

enum InventoryType {
  UNIT = 'UNIT',              // Inventario por unidad
  WEIGHT = 'WEIGHT',          // Inventario por peso
  VACUUM_PACKED = 'VACUUM_PACKED'  // Empaque al vacío
}

enum BarcodeType {
  STANDARD = 'STANDARD',           // Código de barras estándar
  INTERNAL = 'INTERNAL',           // Código interno
  WEIGHT_EMBEDDED = 'WEIGHT_EMBEDDED'  // Código con peso embebido
}
```

**Relaciones:**
- Relación N:1 con `product_categories`
- Relación 1:N con `sale_items` (snapshot)
- Relación 1:N con `order_items` (snapshot)

**Unidades comunes:**
- `kg` - kilogramos
- `paquete` - paquetes
- `unidad` - unidades

---

### 4. PRODUCT_BATCHES (Tabla: `product_batches`)

**Entidad:** `ProductBatch`

| Columna | Tipo PostgreSQL | Tipo TypeScript | Restricciones | Descripción |
|---------|-----------------|-----------------|---------------|-------------|
| `id` | UUID | string | PRIMARY KEY | Identificador único |
| `product_id` | UUID | string | FOREIGN KEY, NOT NULL | Referencia a producto |
| `batch_number` | VARCHAR(50) | string | NOT NULL | Número de lote |
| `actual_weight` | DECIMAL(10,3) | number | NOT NULL | Peso real del lote (kg) |
| `unit_cost` | DECIMAL(10,2) | number | NOT NULL | Costo unitario del lote |
| `unit_price` | DECIMAL(10,2) | number | NOT NULL | Precio de venta del lote |
| `is_sold` | BOOLEAN | boolean | NOT NULL, DEFAULT false | Si el lote ya fue vendido |
| `packed_at` | DATE | Date | NOT NULL | Fecha de empaquetado |
| `expiry_date` | DATE | Date \| null | NULLABLE | Fecha de vencimiento |
| `notes` | TEXT | string \| null | NULLABLE | Notas adicionales |
| `created_at` | TIMESTAMP | Date | NOT NULL, AUTO | Fecha de creación |
| `updated_at` | TIMESTAMP | Date | NOT NULL, AUTO | Fecha de actualización |

**Relaciones:**
- Relación N:1 con `products` (product_id)
- Relación 1:N con `sale_items` (opcional, cuando se vende)
- Relación 1:N con `order_items` (opcional, cuando se reserva)

**Propósito:**
Los lotes de productos al vacío (`VACUUM_PACKED`) requieren un control individual porque cada empaque tiene:
- Peso exacto diferente
- Precio específico basado en el peso
- Fecha de empaquetado y vencimiento
- Estado de vendido/disponible

**Flujo de uso:**
1. Se crea un producto con `inventoryType = 'VACUUM_PACKED'`
2. Se registran lotes individuales con peso y precio específicos
3. Al vender o reservar, se marca el lote como `isSold = true`
4. Los lotes disponibles (`isSold = false`) pueden ser asignados a pedidos o ventas

**Número de lote:**
El `batch_number` puede ser:
- Generado automáticamente por el sistema
- Extraído del código de barras de la etiqueta de la balanza
- Ingresado manualmente

---

### 5. TERMINALS (Tabla: `terminals`)

**Entidad:** `Terminal`

| Columna | Tipo PostgreSQL | Tipo TypeScript | Restricciones | Descripción |
|---------|-----------------|-----------------|---------------|-------------|
| `id` | UUID | string | PRIMARY KEY | Identificador único |
| `name` | VARCHAR(100) | string | NOT NULL | Nombre de terminal |
| `location` | VARCHAR(200) | string \| null | NULLABLE | Ubicación física |
| `description` | TEXT | string \| null | NULLABLE | Descripción |
| `is_active` | BOOLEAN | boolean | NOT NULL, DEFAULT true | Estado activo |
| `created_at` | TIMESTAMP | Date | NOT NULL, AUTO | Fecha de creación |
| `updated_at` | TIMESTAMP | Date | NOT NULL, AUTO | Fecha de actualización |

**Relaciones:**
- Relación 1:N con `cash_sessions`

**Ejemplos:**
- Caja 1
- Caja 2
- Punto de Venta Principal

---

### 6. CASH_SESSIONS (Tabla: `cash_sessions`)

**Entidad:** `CashSession`

| Columna | Tipo PostgreSQL | Tipo TypeScript | Restricciones | Descripción |
|---------|-----------------|-----------------|---------------|-------------|
| `id` | UUID | string | PRIMARY KEY | Identificador único |
| `terminal_id` | UUID | string | FOREIGN KEY, NOT NULL | Referencia a terminal |
| `user_id` | UUID | string | FOREIGN KEY, NOT NULL | Usuario que abrió sesión |
| `closed_by_user_id` | UUID | string \| null | FOREIGN KEY, NULLABLE | Usuario que cerró sesión |
| `opening_amount` | DECIMAL(10,2) | number | NOT NULL | Monto inicial en caja |
| `closing_amount` | DECIMAL(10,2) | number \| null | NULLABLE | Monto final declarado |
| `expected_amount` | DECIMAL(10,2) | number | NOT NULL, DEFAULT 0 | Monto esperado (calculado) |
| `difference_amount` | DECIMAL(10,2) | number \| null | NULLABLE | Diferencia (actual - esperado) |
| `status` | ENUM | CashSessionStatus | NOT NULL, DEFAULT 'OPEN' | Estado de sesión |
| `opening_notes` | TEXT | string \| null | NULLABLE | Notas al abrir |
| `closing_notes` | TEXT | string \| null | NULLABLE | Notas al cerrar |
| `opened_at` | TIMESTAMP | Date | NOT NULL, AUTO | Fecha/hora de apertura |
| `closed_at` | TIMESTAMP | Date \| null | NULLABLE | Fecha/hora de cierre |
| `updated_at` | TIMESTAMP | Date | NOT NULL, AUTO | Fecha de actualización |

**Enum:**
```typescript
enum CashSessionStatus {
  OPEN = 'OPEN',       // Sesión abierta
  CLOSED = 'CLOSED'    // Sesión cerrada
}
```

**Relaciones:**
- Relación N:1 con `terminals`
- Relación N:1 con `users` (user_id: usuario que abrió)
- Relación N:1 con `users` (closed_by_user_id: usuario que cerró)
- Relación 1:N con `cash_movements`
- Relación 1:N con `sales`

**Reglas de negocio:**
- Solo puede haber UNA sesión abierta por terminal
- Una sesión cerrada NO puede reabrirse
- El monto esperado se calcula: `opening_amount + entradas - salidas + ventas_efectivo`
- La diferencia se calcula: `closing_amount - expected_amount`
- **NUEVO**: Cualquier usuario con permisos puede cerrar una sesión (no solo quien la abrió)
- Se registra tanto el usuario que abrió (`user_id`) como el que cerró (`closed_by_user_id`)

---

### 7. CASH_MOVEMENTS (Tabla: `cash_movements`)

**Entidad:** `CashMovement`

| Columna | Tipo PostgreSQL | Tipo TypeScript | Restricciones | Descripción |
|---------|-----------------|-----------------|---------------|-------------|
| `id` | UUID | string | PRIMARY KEY | Identificador único |
| `session_id` | UUID | string | FOREIGN KEY, NOT NULL | Referencia a sesión |
| `type` | ENUM | CashMovementType | NOT NULL | Tipo de movimiento |
| `amount` | DECIMAL(10,2) | number | NOT NULL | Monto del movimiento |
| `reason` | TEXT | string \| null | NULLABLE | Razón del movimiento |
| `created_by` | UUID | string | FOREIGN KEY, NOT NULL | Usuario que creó |
| `created_at` | TIMESTAMP | Date | NOT NULL, AUTO | Fecha/hora de creación |

**Enum:**
```typescript
enum CashMovementType {
  DEPOSIT = 'DEPOSIT',       // Entrada de efectivo
  WITHDRAWAL = 'WITHDRAWAL', // Salida de efectivo
  ADJUSTMENT = 'ADJUSTMENT'  // Ajuste manual
}
```

**Relaciones:**
- Relación N:1 con `cash_sessions`
- Relación N:1 con `users` (created_by)

**Ejemplos de uso:**
- DEPOSIT: Agregar fondos de cambio
- WITHDRAWAL: Retiro para gastos o banco
- ADJUSTMENT: Corrección de errores

---

### 8. SALES (Tabla: `sales`)

**Entidad:** `Sale`

| Columna | Tipo PostgreSQL | Tipo TypeScript | Restricciones | Descripción |
|---------|-----------------|-----------------|---------------|-------------|
| `id` | UUID | string | PRIMARY KEY | Identificador único |
| `session_id` | UUID | string | FOREIGN KEY, NOT NULL | Referencia a sesión de caja |
| `cashier_id` | UUID | string | FOREIGN KEY, NOT NULL | Cajero que realizó venta |
| `subtotal` | DECIMAL(10,2) | number | NOT NULL | Subtotal sin descuento |
| `discount` | DECIMAL(10,2) | number | NOT NULL, DEFAULT 0 | Descuento aplicado |
| `total` | DECIMAL(10,2) | number | NOT NULL | Total a pagar |
| `payment_method` | ENUM | PaymentMethod | NOT NULL | Método de pago |
| `cash_amount` | DECIMAL(10,2) | number \| null | NULLABLE | Monto en efectivo |
| `card_amount` | DECIMAL(10,2) | number \| null | NULLABLE | Monto con tarjeta |
| `transfer_amount` | DECIMAL(10,2) | number \| null | NULLABLE | Monto por transferencia |
| `change_amount` | DECIMAL(10,2) | number \| null | NULLABLE | Vuelto entregado |
| `status` | ENUM | SaleStatus | NOT NULL, DEFAULT 'COMPLETED' | Estado de venta |
| `notes` | TEXT | string \| null | NULLABLE | Notas de venta |
| `customer_name` | VARCHAR(200) | string \| null | NULLABLE | Nombre de cliente |
| `order_id` | UUID | string \| null | NULLABLE | Pedido asociado (si aplica) |
| `created_at` | TIMESTAMP | Date | NOT NULL, AUTO | Fecha/hora de venta |

**Enums:**
```typescript
enum PaymentMethod {
  CASH = 'CASH',         // Efectivo
  CARD = 'CARD',         // Tarjeta
  TRANSFER = 'TRANSFER', // Transferencia
  MIXED = 'MIXED'        // Mixto (varios métodos)
}

enum SaleStatus {
  COMPLETED = 'COMPLETED',  // Venta completada
  CANCELLED = 'CANCELLED'   // Venta cancelada
}
```

**Relaciones:**
- Relación N:1 con `cash_sessions`
- Relación N:1 con `users` (cashier_id)
- Relación 1:N con `sale_items` (CASCADE DELETE)
- Relación N:1 con `orders` (opcional, order_id)

**Reglas de negocio:**
- Una venta COMPLETED actualiza el inventario (resta stock)
- Una venta CANCELLED restaura el inventario (suma stock)
- Para MIXED: `cash_amount + card_amount + transfer_amount = total`
- Para CASH: si `cash_amount > total`, se calcula `change_amount`

---

### 9. SALE_ITEMS (Tabla: `sale_items`)

**Entidad:** `SaleItem`

| Columna | Tipo PostgreSQL | Tipo TypeScript | Restricciones | Descripción |
|---------|-----------------|-----------------|---------------|-------------|
| `id` | UUID | string | PRIMARY KEY | Identificador único |
| `sale_id` | UUID | string | FOREIGN KEY, NOT NULL, ON DELETE CASCADE | Referencia a venta |
| `product_id` | UUID | string | FOREIGN KEY, NOT NULL | Referencia a producto |
| `product_name` | VARCHAR(200) | string | NOT NULL | Snapshot: nombre |
| `product_sku` | VARCHAR(50) | string | NOT NULL | Snapshot: SKU |
| `quantity` | DECIMAL(10,3) | number | NOT NULL | Cantidad vendida |
| `unit` | VARCHAR(20) | string \| null | NULLABLE | Unidad de medida |
| `unit_price` | DECIMAL(10,2) | number | NOT NULL | Snapshot: precio unitario |
| `discount` | DECIMAL(10,2) | number | NOT NULL, DEFAULT 0 | Descuento del item |
| `subtotal` | DECIMAL(10,2) | number | NOT NULL | Subtotal del item |
| `batch_id` | UUID | string \| null | NULLABLE | Lote específico (productos al vacío) |
| `batch_number` | VARCHAR(100) | string \| null | NULLABLE | Snapshot: número de lote |
| `actual_weight` | DECIMAL(10,3) | number \| null | NULLABLE | Snapshot: peso real del lote |

**Relaciones:**
- Relación N:1 con `sales` (CASCADE DELETE)
- Relación N:1 con `products` (referencia)
- Relación N:1 con `product_batches` (opcional, para productos al vacío)

**Patrón Snapshot:**
Los campos `product_name`, `product_sku` y `unit_price` se copian del producto al momento de la venta. Esto preserva los datos históricos incluso si el producto cambia después.

**Cálculo:**
```
subtotal = (unit_price * quantity) - discount
```

---

### 10. ORDERS (Tabla: `orders`)

**Entidad:** `Order`

| Columna | Tipo PostgreSQL | Tipo TypeScript | Restricciones | Descripción |
|---------|-----------------|-----------------|---------------|-------------|
| `id` | UUID | string | PRIMARY KEY | Identificador único |
| `order_number` | TEXT | string | UNIQUE, NOT NULL | Número de pedido generado |
| `customer_name` | VARCHAR(200) | string | NOT NULL | Nombre del cliente |
| `customer_phone` | VARCHAR(20) | string \| null | NULLABLE | Teléfono del cliente |
| `customer_email` | VARCHAR(100) | string \| null | NULLABLE | Email del cliente |
| `subtotal` | DECIMAL(10,2) | number | NOT NULL | Subtotal sin descuento |
| `discount` | DECIMAL(10,2) | number | NOT NULL, DEFAULT 0 | Descuento aplicado |
| `total` | DECIMAL(10,2) | number | NOT NULL | Total del pedido |
| `deposit` | DECIMAL(10,2) | number \| null | NULLABLE, DEFAULT 0 | Depósito/anticipo |
| `status` | ENUM | OrderStatus | NOT NULL, DEFAULT 'PENDING' | Estado del pedido |
| `delivery_date` | DATE | string | NOT NULL | Fecha de entrega |
| `delivery_time` | TIME | string \| null | NULLABLE | Hora de entrega (HH:mm) |
| `notes` | TEXT | string \| null | NULLABLE | Notas para cliente |
| `internal_notes` | TEXT | string \| null | NULLABLE | Notas internas |
| `created_by` | UUID | string | FOREIGN KEY, NOT NULL | Usuario que creó pedido |
| `sale_id` | UUID | string \| null | NULLABLE | Venta asociada (cuando se entrega) |
| `created_at` | TIMESTAMP | Date | NOT NULL, AUTO | Fecha de creación |
| `updated_at` | TIMESTAMP | Date | NOT NULL, AUTO | Fecha de actualización |
| `confirmed_at` | TIMESTAMP | Date \| null | NULLABLE | Fecha de confirmación |
| `delivered_at` | TIMESTAMP | Date \| null | NULLABLE | Fecha de entrega |
| `cancelled_at` | TIMESTAMP | Date \| null | NULLABLE | Fecha de cancelación |
| `cancellation_reason` | VARCHAR(500) | string \| null | NULLABLE | Razón de cancelación |

**Enum:**
```typescript
enum OrderStatus {
  PENDING = 'PENDING',       // Pendiente (recién creado)
  READY = 'READY',           // Listo (preparado)
  DELIVERED = 'DELIVERED',   // Entregado (completado)
  CANCELLED = 'CANCELLED'    // Cancelado
}
```

**Relaciones:**
- Relación N:1 con `users` (created_by)
- Relación 1:N con `order_items` (CASCADE DELETE)
- Relación N:1 con `sales` (opcional, cuando se entrega)

**Flujo de estados:**
```
PENDING → READY → DELIVERED
    ↓        ↓
  CANCELLED (puede cancelarse en cualquier momento)
```

**Generación de order_number:**
Formato: `ORD{YYMMDD}{0001}`  
Ejemplo: `ORD2601120001` (12 enero 2026, pedido #1 del día)

**Reglas de negocio:**
- El depósito debe ser menor o igual al total
- No se puede modificar un pedido DELIVERED o CANCELLED
- **Se pueden editar los items (productos) del pedido mientras esté en estado PENDING o READY**
- Al editar items con lotes, se liberan automáticamente los lotes antiguos que ya no están en el pedido
- Los lotes solo se marcan como vendidos (`isSold = true`) cuando el pedido se marca como DELIVERED o cuando se cobra en POS
- Los timestamps se actualizan automáticamente según el estado
- **NOTA**: El estado CONFIRMED fue removido del enum en el backend actual

---

### 11. ORDER_ITEMS (Tabla: `order_items`)

**Entidad:** `OrderItem`

| Columna | Tipo PostgreSQL | Tipo TypeScript | Restricciones | Descripción |
|---------|-----------------|-----------------|---------------|-------------|
| `id` | UUID | string | PRIMARY KEY | Identificador único |
| `order_id` | UUID | string | FOREIGN KEY, NOT NULL, ON DELETE CASCADE | Referencia a pedido |
| `product_id` | UUID | string | FOREIGN KEY, NOT NULL | Referencia a producto |
| `batch_id` | UUID | string \| null | FOREIGN KEY, NULLABLE, ON DELETE SET NULL | Referencia a lote específico (productos al vacío) |
| `product_name` | VARCHAR(200) | string | NOT NULL | Snapshot: nombre |
| `product_sku` | VARCHAR(50) | string | NOT NULL | Snapshot: SKU |
| `quantity` | DECIMAL(10,3) | number | NOT NULL | Cantidad pedida |
| `unit` | VARCHAR(20) | string | NOT NULL | Unidad de medida |
| `unit_price` | DECIMAL(10,2) | number | NOT NULL | Snapshot: precio unitario |
| `discount` | DECIMAL(10,2) | number | NOT NULL, DEFAULT 0 | Descuento del item |
| `subtotal` | DECIMAL(10,2) | number | NOT NULL | Subtotal del item |
| `notes` | TEXT | string \| null | NULLABLE | Notas del item |

**Relaciones:**
- Relación N:1 con `orders` (CASCADE DELETE)
- Relación N:1 con `products` (referencia)
- Relación N:1 con `product_batches` (opcional, SET NULL on delete)

**Patrón Snapshot:**
Similar a `sale_items`, preserva los datos del producto al momento de crear el pedido.

**Lotes Específicos:**
Para productos al vacío (`inventory_type = 'VACUUM_PACKED'`), el pedido puede reservar un lote específico mediante `batch_id`. Esto previene que el lote sea vendido a otros clientes hasta que el pedido sea completado o cancelado.

**Cálculo:**
```
subtotal = (unit_price * quantity) - discount
```

---

## 🔗 Diagrama de Relaciones

```
users
  ├─→ cash_sessions (user_id, closed_by_user_id)
  ├─→ cash_movements (created_by)
  ├─→ sales (cashier_id)
  └─→ orders (created_by)

terminals
  └─→ cash_sessions (terminal_id)

product_categories
  └─→ products (category_id)

products
  ├─→ product_batches (product_id) [solo VACUUM_PACKED]
  ├─→ sale_items (product_id) [snapshot]
  └─→ order_items (product_id) [snapshot]

product_batches
  ├─→ sale_items (batch_id) [opcional]
  └─→ order_items (batch_id) [opcional]

cash_sessions
  ├─→ cash_movements (session_id)
  └─→ sales (session_id)

sales
  ├─→ sale_items (sale_id) [CASCADE]
  └─→ orders (sale_id) [opcional]

orders
  └─→ order_items (order_id) [CASCADE]
```

---

## 🏷️ Sistema de Códigos de Barras y Control de Inventario

### Diferencia Fundamental: Productos Comerciales vs Productos Pesados

#### **CASO 1: Productos Comerciales (Abarrotes)**

**Ejemplos**: Latas de atún, salsas, embutidos empacados, productos enlatados

**Código de Barras**:
- Viene **impreso por el fabricante** en el empaque
- Es un código **estándar mundial** (EAN-13, UPC-A)
- Ejemplo: `7501234567890`
- **El mismo código para todas las unidades del mismo producto**

**Cómo lo manejan los supermercados**:
1. **Registro inicial (una sola vez)**:
   - Escanear el código de barras del producto
   - Sistema crea el producto con ese código
   - Configurar nombre, precio, categoría
   - El código de barras **ES** el identificador del producto

2. **Entrada de inventario**:
   - Escanear código de barras
   - Sistema identifica el producto automáticamente
   - Añadir cantidad de unidades recibidas (ej: +50 latas)
   - Inventario: Número de unidades disponibles

3. **Venta en POS**:
   - Escanear código de barras
   - Sistema busca el producto por código
   - Resta 1 unidad del inventario
   - **Un código → Muchas unidades iguales**

**En nuestra BD**:
- `products.barcode` = `7501234567890`
- `products.barcodeType` = `STANDARD`
- `products.stockQuantity` = 50 (unidades)
- **NO se usa `product_batches`** (no es necesario)

---

#### **CASO 2: Productos Pesados en Balanza (Al Vacío)**

**Ejemplos**: Carnes al vacío, mortadela pesada, quesos, frutas/verduras

**Código de Barras**:
- **NO existe hasta que se pesa el producto**
- Se genera **automáticamente por la balanza** al empaquetar
- Cada empaque tiene un **código ÚNICO diferente**
- Formato: `2{PLU}{PESO}{CHECK}` (13 dígitos)
- Ejemplo: `2100001234505`
  - `2`: Prefijo fijo (indica peso embebido)
  - `10000`: PLU del producto (código interno)
  - `12345`: Peso en gramos (1.234 kg)
  - `05`: Dígito verificador

**Diferencia crítica**: 
- **PLU** (ej: `10000`) = Identificador del tipo de producto
- **Código completo** (ej: `2100001234505`) = Identificador del empaque específico

**Cómo lo manejan los supermercados**:

**Método A: Sin Control Individual de Empaques (Mayoría de supermercados)**

1. **Registro inicial del producto**:
   - Crear producto: "Costillas al vacío"
   - Asignar PLU interno: `10000`
   - Configurar precio por kg: $120.00
   - **NO se registra código de barras aún** (no existe)
   - `products.barcode` = `10000` (solo el PLU)
   - `products.barcodeType` = `WEIGHT_EMBEDDED`

2. **Empaquetado**:
   - Pesar producto en balanza
   - Balanza genera código automáticamente
   - Imprimir etiqueta con código
   - **NO se registra en sistema** (solo se empaqueta)

3. **Control de inventario**:
   - Inventario por peso total: "50 kg disponibles"
   - Al vender: Restar peso vendido
   - **NO se registra cada empaque individual**

4. **Venta en POS**:
   - Escanear código: `2100001234505`
   - Sistema extrae PLU: `10000` → Busca producto
   - Sistema extrae peso: `1.234 kg`
   - Calcula precio: `1.234 kg × $120.00 = $148.08`
   - Resta peso del inventario total

**Método B: Con Control Individual de Empaques (Tu sistema - product_batches)**

1. **Registro inicial del producto** (igual):
   - Crear producto: "Costillas al vacío"
   - Asignar PLU: `10000`
   - Precio por kg: $120.00

2. **Empaquetado y registro de lotes**:
   - Pesar productos y generar etiquetas
   - **Registrar cada empaque en sistema**:
     - Código completo: `2100001234505`
     - Peso: 1.234 kg
     - Precio: $148.08
     - Fecha empaquetado, vencimiento
   - Se crea registro en `product_batches`

3. **Control de inventario**:
   - Lista de empaques individuales
   - Estado: disponible/vendido
   - Trazabilidad completa

4. **Venta en POS**:
   - Escanear código: `2100001234505`
   - Sistema busca el lote específico
   - Marca lote como vendido
   - Trazabilidad exacta

**Ventajas del Método B (tu sistema)**:
- ✅ Trazabilidad individual de cada empaque
- ✅ Control de fechas de vencimiento por lote
- ✅ Saber exactamente qué empaques están disponibles
- ✅ Ideal para productos de alto valor
- ✅ Cumple normativas de seguridad alimentaria

---

### Tipos de Códigos de Barras en la Base de Datos

El enum `BarcodeType` define 3 tipos:

#### 1. **STANDARD** (Productos comerciales)
- **Código impreso por fabricante**
- EAN-13: `7501234567890`
- UPC-A: `012345678905`
- **Uso**: Productos con código de barras estándar
- **Inventario**: Por unidades
- `products.barcode` = Código completo

#### 2. **INTERNAL** (Productos sin código comercial)
- **Código asignado por el negocio**
- Ejemplos: `CARNE-001`, `1001`
- **Uso**: Productos sin código de barras o creados en tienda
- **Inventario**: Por unidades o peso (según configuración)
- `products.barcode` = Código interno

#### 3. **WEIGHT_EMBEDDED** (Productos pesados en balanza)
- **Código generado por balanza al pesar**
- Formato: `2{PLU}{PESO}{CHECK}`
- **Uso**: Productos que se pesan y empacan individualmente
- **Inventario**: Peso total O lotes individuales
- `products.barcode` = Solo PLU (ej: `10000`)
- `product_batches.batch_number` = Código completo (ej: `2100001234505`)

### Flujos de Trabajo Implementados

#### **Flujo 1: Registrar Producto Comercial (Abarrotes)**

```
┌─────────────────────────────────────────────────────────┐
│ 1. REGISTRO INICIAL (una sola vez)                     │
├─────────────────────────────────────────────────────────┤
│ • Escanear código de barras del producto               │
│   Input: 7501234567890                                  │
│ • Sistema rellena automáticamente:                     │
│   - barcode: "7501234567890"                           │
│   - barcodeType: "STANDARD"                            │
│ • Completar: nombre, precio, categoría                 │
│ • Guardar producto                                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 2. AÑADIR INVENTARIO                                    │
├─────────────────────────────────────────────────────────┤
│ Opción A - Scanner:                                     │
│   • Escanear código: 7501234567890                     │
│   • Sistema identifica producto automáticamente        │
│   • Abrir formulario de inventario                     │
│   • Ingresar cantidad a añadir: +50 unidades          │
│                                                         │
│ Opción B - Manual:                                      │
│   • Buscar producto por nombre                         │
│   • Click en "Añadir stock"                            │
│   • Ingresar cantidad: +50 unidades                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 3. VENTA EN POS                                         │
├─────────────────────────────────────────────────────────┤
│ • Escanear código: 7501234567890                       │
│ • Sistema busca producto por barcode                   │
│ • Añadir al carrito (cantidad 1)                       │
│ • Inventario: -1 unidad                                │
└─────────────────────────────────────────────────────────┘
```

#### **Flujo 2: Registrar Producto al Vacío (Método A - Sin lotes)**

```
┌─────────────────────────────────────────────────────────┐
│ 1. REGISTRO INICIAL DEL PRODUCTO                       │
├─────────────────────────────────────────────────────────┤
│ • Crear producto: "Costillas al vacío"                 │
│ • Asignar PLU interno: 10000 (manual)                  │
│   O escanear etiqueta y extraer PLU automáticamente    │
│ • Guardar en BD:                                        │
│   - barcode: "10000" (solo PLU)                        │
│   - barcodeType: "WEIGHT_EMBEDDED"                     │
│   - inventoryType: "VACUUM_PACKED"                     │
│   - price: 120.00 (precio por kg)                      │
│ • NO crea lotes aún                                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 2. EMPAQUETADO (en área de producción)                 │
├─────────────────────────────────────────────────────────┤
│ • Pesar producto en balanza                            │
│ • Balanza genera código automáticamente:               │
│   - PLU: 10000                                         │
│   - Peso: 1.234 kg                                     │
│   - Código: 2100001234505                              │
│ • Imprimir etiqueta y pegar en empaque                 │
│ • NO se registra en sistema (solo se empaqueta)        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 3. INVENTARIO                                           │
├─────────────────────────────────────────────────────────┤
│ • Inventario por peso total: "50 kg disponibles"       │
│ • Añadir stock: +10 kg (manual)                        │
│ • stockQuantity: 50                                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 4. VENTA EN POS                                         │
├─────────────────────────────────────────────────────────┤
│ • Escanear etiqueta: 2100001234505                     │
│ • Sistema parsea código:                                │
│   - Extraer PLU: 10000 → Buscar producto               │
│   - Extraer peso: 1.234 kg                             │
│ • Calcular precio: 1.234 × 120.00 = $148.08           │
│ • Añadir al carrito                                     │
│ • Inventario: -1.234 kg del total                      │
└─────────────────────────────────────────────────────────┘
```

#### **Flujo 3: Registrar Producto al Vacío (Método B - Con lotes individuales)**

```
┌─────────────────────────────────────────────────────────┐
│ 1. REGISTRO INICIAL (igual que Método A)               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 2. EMPAQUETADO Y REGISTRO DE LOTES                     │
├─────────────────────────────────────────────────────────┤
│ Opción A - Manual:                                      │
│   • Ir a Inventario → Lotes al vacío                   │
│   • Seleccionar producto: "Costillas al vacío"         │
│   • Crear lote:                                         │
│     - Peso: 1.234 kg                                   │
│     - Precio: $148.08 (auto-calculado)                 │
│     - Fecha empaquetado, vencimiento                   │
│   • Guardar en product_batches                         │
│                                                         │
│ Opción B - Scanner múltiple:                           │
│   • Activar modo scanner de lotes                      │
│   • Escanear múltiples etiquetas:                      │
│     1. 2100001234505 → PLU:10000, Peso:1.234kg        │
│     2. 2100001567803 → PLU:10000, Peso:1.567kg        │
│     3. 2100000890201 → PLU:10000, Peso:0.890kg        │
│   • Sistema crea lotes automáticamente:                │
│     - Identifica producto por PLU                      │
│     - Extrae peso de cada código                       │
│     - Calcula precio unitario                          │
│     - Guarda batch_number completo                     │
│   • Click "Guardar todos los lotes"                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 3. INVENTARIO                                           │
├─────────────────────────────────────────────────────────┤
│ • Vista de lotes individuales:                         │
│   - Lote 1: 1.234 kg - Disponible                     │
│   - Lote 2: 1.567 kg - Disponible                     │
│   - Lote 3: 0.890 kg - Vendido                        │
│ • Total: 2.801 kg disponibles (lotes 1+2)             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 4. VENTA EN POS                                         │
├─────────────────────────────────────────────────────────┤
│ • Escanear etiqueta: 2100001234505                     │
│ • Sistema busca lote por batch_number                   │
│ • Verificar disponibilidad (isSold = false)            │
│ • Añadir al carrito con precio del lote               │
│ • Al confirmar venta:                                   │
│   - Marcar lote como vendido (isSold = true)          │
│   - Snapshot en sale_items                             │
└─────────────────────────────────────────────────────────┘
```

### Resumen de Campos en Base de Datos

| Tipo de Producto | `barcode` | `barcodeType` | `inventoryType` | `stockQuantity` | `product_batches` |
|------------------|-----------|---------------|-----------------|-----------------|-------------------|
| **Lata de atún** | `7501234567890` | `STANDARD` | `UNIT` | 50 unidades | NO se usa |
| **Salsa enlatada** | `012345678905` | `STANDARD` | `UNIT` | 100 unidades | NO se usa |
| **Costillas al vacío (Método A)** | `10000` (solo PLU) | `WEIGHT_EMBEDDED` | `VACUUM_PACKED` | 50.000 kg | NO se usa |
| **Costillas al vacío (Método B)** | `10000` (solo PLU) | `WEIGHT_EMBEDDED` | `VACUUM_PACKED` | N/A | SÍ (lotes individuales) |

### Diferencias Clave

| Aspecto | Productos Comerciales | Productos Pesados |
|---------|----------------------|-------------------|
| **Código de barras** | Impreso por fabricante | Generado por balanza |
| **Cuándo existe** | Desde el fabricante | Al empaquetar |
| **Unicidad** | 1 código = todas las unidades | 1 código = 1 empaque |
| **Contenido** | Solo identifica producto | Producto + Peso |
| **Registro** | Una sola vez | Cada empaque (opcional) |
| **Inventario** | Por unidades | Por peso total O lotes |
| **Ejemplo** | `7501234567890` | `2100001234505` |

### ¿Qué Método Usar para Productos al Vacío?

**Método A (Sin lotes individuales)**:
- ✅ Más simple y rápido
- ✅ Menos registros en BD
- ❌ No hay trazabilidad individual
- ❌ No control de fechas de vencimiento por empaque
- **Recomendado para**: Productos de bajo valor, alta rotación

**Método B (Con lotes individuales)**:
- ✅ Trazabilidad completa
- ✅ Control de vencimientos
- ✅ Saber exactamente qué está disponible
- ✅ Mejor para pedidos (reservar lote específico)
- ❌ Más trabajo de registro
- ❌ Más registros en BD
- **Recomendado para**: Productos de alto valor, baja rotación, pedidos

**Tu sistema actual usa Método B**, lo cual es ideal para una carnicería con productos de calidad que requieren trazabilidad.

---

### Implementación Técnica

#### Parsing de Códigos de Balanza

```typescript
// utils/barcodeParser.ts

export interface ParsedBarcode {
  type: 'STANDARD' | 'WEIGHT_EMBEDDED';
  raw: string;
  plu?: string;
  weight?: number;
  code?: string;
}

export function parseBarcode(barcode: string): ParsedBarcode {
  // Código con peso embebido (inicia con 2, longitud 13)
  if (barcode.startsWith('2') && barcode.length === 13) {
    const plu = barcode.substring(1, 6);
    const weightRaw = barcode.substring(6, 11);
    const weight = parseInt(weightRaw) / 1000; // gramos → kg
    
    return {
      type: 'WEIGHT_EMBEDDED',
      raw: barcode,
      plu: plu,
      weight: weight
    };
  }
  
  // Código estándar
  return {
    type: 'STANDARD',
    raw: barcode,
    code: barcode
  };
}

// Ejemplo de uso
const result1 = parseBarcode('2100001234505');
// { type: 'WEIGHT_EMBEDDED', raw: '2100001234505', plu: '10000', weight: 1.234 }

const result2 = parseBarcode('7501234567890');
// { type: 'STANDARD', raw: '7501234567890', code: '7501234567890' }
```

#### Búsqueda de Productos

```typescript
// Al escanear código en POS o inventario

async function findProductByBarcode(barcode: string) {
  const parsed = parseBarcode(barcode);
  
  if (parsed.type === 'STANDARD') {
    // Buscar producto directamente por código completo
    const product = await api.get(`/products?barcode=${parsed.code}`);
    return { product, weight: null };
  }
  
  if (parsed.type === 'WEIGHT_EMBEDDED') {
    // Buscar producto por PLU
    const product = await api.get(`/products?barcode=${parsed.plu}`);
    return { product, weight: parsed.weight };
  }
}
```



## 📝 Notas Importantes para Integración Frontend

### 1. Tipos de Datos
- **UUIDs**: Todos los IDs son strings UUID v4
- **Decimales**: Números que representan dinero o cantidades (enviar como number)
- **Enums**: Siempre en MAYÚSCULAS (ej: `'CASH'`, `'PENDING'`)
- **Fechas**: ISO 8601 strings (ej: `'2026-01-12T10:30:00Z'`)
- **Dates**: Solo fecha YYYY-MM-DD (ej: `'2026-01-12'`)
- **Time**: Solo hora HH:mm (ej: `'10:30'`)

### 2. Campos Requeridos vs Opcionales
- Los campos `| null` en TypeScript son opcionales en requests
- Los campos sin `?` son obligatorios
- Los timestamps (`created_at`, `updated_at`) se generan automáticamente

### 3. Snapshot Pattern
`sale_items` y `order_items` copian datos del producto para preservar historia:
- Si un producto cambia precio después, las ventas antiguas mantienen el precio original
- Siempre envía `productId` al crear, el backend hace el snapshot automáticamente
- Los campos de lote (`batch_id`, `batch_number`, `actual_weight`) también se copian como snapshot

### 4. Manejo de Inventario
- **trackInventory = true**: El producto se controla en inventario
- Las ventas COMPLETED restan del stock
- Las ventas CANCELLED suman de vuelta al stock
- Los pedidos NO afectan inventario hasta convertirse en venta
- **Productos al vacío**: Cada lote es una unidad independiente con su propio peso y precio

### 5. Sesiones de Caja
- REGLA CRÍTICA: Solo UNA sesión OPEN por terminal
- Validar estado antes de intentar abrir nueva sesión
- Las ventas requieren una sesión abierta

### 6. Códigos de Barras
- **3 tipos soportados**: `STANDARD` (comercial), `INTERNAL` (personalizado), `WEIGHT_EMBEDDED` (balanza)
- El campo `barcode` es **obligatorio** desde la creación
- Para productos comerciales: almacenar código completo (8-13 dígitos)
- Para productos pesados/al vacío: almacenar solo segmento W (6 dígitos)
- Se valida unicidad y formato según tipo
- Implementar parsing en frontend para extraer PLU y peso de códigos embebidos

### 7. SKU Auto-generado
- **El SKU se genera automáticamente** al crear el producto
- El usuario **NO** ingresa el SKU, solo el barcode
- Formato: `{PREFIJO}-{NÚMERO}` donde:
  - PREFIJO: Primeras 4 letras de la categoría (ej: CARN, AVES, EMBU)
  - NÚMERO: Secuencial de 4 dígitos por categoría (0001, 0002, ...)
- **Es inmutable**: No puede modificarse después de creado
- Cada categoría tiene su propio contador independiente
- Si se cambia el nombre de la categoría, los productos existentes mantienen su SKU original

---

**Continúa en:** `API_GUIDE_PART2_ENDPOINTS.md`
