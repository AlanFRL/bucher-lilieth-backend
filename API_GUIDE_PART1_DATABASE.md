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
| `sku` | VARCHAR(50) | string | UNIQUE, NOT NULL | Código de producto |
| `name` | VARCHAR(200) | string | NOT NULL | Nombre del producto |
| `description` | TEXT | string \| null | NULLABLE | Descripción |
| `sale_type` | ENUM | SaleType | NOT NULL | Tipo de venta |
| `inventory_type` | ENUM | InventoryType | NOT NULL | Tipo de inventario |
| `price` | DECIMAL(10,2) | number | NOT NULL | Precio de venta |
| `cost_price` | DECIMAL(10,2) | number \| null | NULLABLE | Precio de costo |
| `barcode` | VARCHAR(100) | string \| null | NULLABLE | Código de barras |
| `barcode_type` | ENUM | BarcodeType | NOT NULL, DEFAULT 'STANDARD' | Tipo de código de barras |
| `stock_quantity` | DECIMAL(10,3) | number | NOT NULL, DEFAULT 0 | Cantidad en stock |
| `min_stock` | DECIMAL(10,3) | number | NOT NULL, DEFAULT 0 | Stock mínimo (alerta) |
| `unit` | VARCHAR(20) | string \| null | NULLABLE | Unidad de medida |
| `is_active` | BOOLEAN | boolean | NOT NULL, DEFAULT true | Estado activo |
| `track_inventory` | BOOLEAN | boolean | NOT NULL, DEFAULT false | Seguimiento de inventario |
| `category_id` | UUID | string | FOREIGN KEY | Referencia a categoría |
| `created_at` | TIMESTAMP | Date | NOT NULL, AUTO | Fecha de creación |
| `updated_at` | TIMESTAMP | Date | NOT NULL, AUTO | Fecha de actualización |

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

### 4. TERMINALS (Tabla: `terminals`)

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

### 5. CASH_SESSIONS (Tabla: `cash_sessions`)

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

### 6. CASH_MOVEMENTS (Tabla: `cash_movements`)

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

### 7. SALES (Tabla: `sales`)

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

**Reglas de negocio:**
- Una venta COMPLETED actualiza el inventario (resta stock)
- Una venta CANCELLED restaura el inventario (suma stock)
- Para MIXED: `cash_amount + card_amount + transfer_amount = total`
- Para CASH: si `cash_amount > total`, se calcula `change_amount`

---

### 8. SALE_ITEMS (Tabla: `sale_items`)

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

**Relaciones:**
- Relación N:1 con `sales` (CASCADE DELETE)
- Relación N:1 con `products` (referencia)

**Patrón Snapshot:**
Los campos `product_name`, `product_sku` y `unit_price` se copian del producto al momento de la venta. Esto preserva los datos históricos incluso si el producto cambia después.

**Cálculo:**
```
subtotal = (unit_price * quantity) - discount
```

---

### 9. ORDERS (Tabla: `orders`)

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
  CONFIRMED = 'CONFIRMED',   // Confirmado (aceptado)
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
PENDING → CONFIRMED → READY → DELIVERED
    ↓         ↓         ↓
  CANCELLED (puede cancelarse en cualquier momento)
```

**Generación de order_number:**
Formato: `ORD{YYMMDD}{0001}`  
Ejemplo: `ORD2601120001` (12 enero 2026, pedido #1 del día)

**Reglas de negocio:**
- El depósito debe ser menor o igual al total
- No se puede modificar un pedido DELIVERED o CANCELLED
- **Se pueden editar los items (productos) del pedido mientras esté en estado PENDING, CONFIRMED o READY**
- Al editar items con lotes, se liberan automáticamente los lotes antiguos que ya no están en el pedido
- Los lotes solo se marcan como vendidos (`isSold = true`) cuando el pedido se marca como DELIVERED o cuando se cobra en POS
- Los timestamps se actualizan automáticamente según el estado

---

### 10. ORDER_ITEMS (Tabla: `order_items`)

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
  ├─→ cash_sessions (user_id)
  ├─→ cash_movements (created_by)
  ├─→ sales (cashier_id)
  └─→ orders (created_by)

terminals
  └─→ cash_sessions (terminal_id)

product_categories
  └─→ products (category_id)

products
  ├─→ sale_items (product_id) [snapshot]
  └─→ order_items (product_id) [snapshot]

cash_sessions
  ├─→ cash_movements (session_id)
  └─→ sales (session_id)

sales
  └─→ sale_items (sale_id) [CASCADE]

orders
  └─→ order_items (order_id) [CASCADE]
```

---

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

### 4. Manejo de Inventario
- **trackInventory = true**: El producto se controla en inventario
- Las ventas COMPLETED restan del stock
- Las ventas CANCELLED suman de vuelta al stock
- Los pedidos NO afectan inventario hasta convertirse en venta

### 5. Sesiones de Caja
- REGLA CRÍTICA: Solo UNA sesión OPEN por terminal
- Validar estado antes de intentar abrir nueva sesión
- Las ventas requieren una sesión abierta

---

**Continúa en:** `API_GUIDE_PART2_ENDPOINTS.md`
