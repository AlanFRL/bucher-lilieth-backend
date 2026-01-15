# 🗃️ Guía de Base de Datos y Seeders

## 📚 Índice
1. [Comandos de Base de Datos](#comandos-de-base-de-datos)
2. [Comportamiento de `npm run start:dev`](#comportamiento-de-npm-run-startdev)
3. [Seeders Disponibles](#seeders-disponibles)
4. [Orden de Ejecución](#orden-de-ejecución)
5. [Cambios Recientes](#cambios-recientes)

---

## 🔧 Comandos de Base de Datos

### Comandos Básicos

| Comando | Descripción | Elimina datos | Crea tablas |
|---------|-------------|---------------|-------------|
| `npm run start:dev` | Inicia el servidor en modo desarrollo | ❌ No | ❌ No |
| `npm run schema:drop` | **ELIMINA todas las tablas** | ✅ Sí | ❌ No |
| `npm run schema:sync` | Sincroniza schema (crea/actualiza tablas) | ⚠️ Puede modificar | ✅ Sí |
| `npm run seed` | Ejecuta seed de usuarios | ❌ No | ❌ No |
| `npm run seed:products` | Ejecuta seed de productos y categorías | ❌ No | ❌ No |
| `npm run seed:all` | Ejecuta TODOS los seeders en orden | ❌ No | ❌ No |

### Comandos de Reset Completo

#### Opción 1: Reset Rápido (Sin confirmación)
```bash
npm run db:reset
```
**¿Qué hace?**
1. Elimina todas las tablas (`schema:drop`)
2. Recrea las tablas desde las entidades (`schema:sync`)
3. Ejecuta todos los seeders en orden (`seed:all`)

**⚠️ ADVERTENCIA:** Este comando elimina TODOS los datos sin pedir confirmación.

#### Opción 2: Reset con Confirmación (Recomendado)
```bash
npm run db:reset-all
```
**¿Qué hace?**
1. Te pregunta si estás seguro (debes escribir "SI")
2. Elimina todas las tablas
3. Recrea las tablas
4. Ejecuta todos los seeders en orden
5. Muestra un resumen de lo que se creó

**✅ RECOMENDADO:** Este comando es más seguro porque pide confirmación.

---

## 🚀 Comportamiento de `npm run start:dev`

### ¿Qué hace `npm run start:dev`?

```bash
npm run start:dev
# Ejecuta: nest start --watch
```

**Respuesta corta:** **NO reestablece la base de datos**.

### Detalles Técnicos

Cuando ejecutas `npm run start:dev`:

1. **Compila el código TypeScript** a JavaScript
2. **Inicia el servidor NestJS** en modo "watch"
3. **Conecta a la base de datos** existente
4. **NO modifica el schema** (porque `synchronize: false` en data-source.ts)
5. **NO ejecuta seeders** automáticamente
6. **NO elimina datos** existentes

### Modo Watch

El modo `--watch` significa que:
- **Detecta cambios** en archivos `.ts`
- **Recompila automáticamente** cuando guardas un archivo
- **Reinicia el servidor** solo si hay cambios en el código
- **Mantiene la conexión** a la base de datos
- **NO afecta** los datos existentes

### Configuración Importante

En [data-source.ts](c:\Users\tengo\OneDrive\Documentos\proyectos_reales\butcher_lilieth\backend\src\database\data-source.ts):

```typescript
export const AppDataSource = new DataSource({
  // ...
  synchronize: false,  // ⚠️ CRÍTICO: Desactivado en producción
  logging: true,
});
```

**`synchronize: false`** significa:
- ✅ El schema NO se sincroniza automáticamente
- ✅ Los cambios en entidades NO se aplican automáticamente
- ✅ Debes usar migraciones o `schema:sync` manualmente
- ✅ Los datos NO se modifican al iniciar

**Si fuera `synchronize: true`:**
- ⚠️ TypeORM intentaría sincronizar el schema en cada inicio
- ⚠️ Podría modificar tablas automáticamente
- ⚠️ Podría causar pérdida de datos en producción
- ⚠️ NO recomendado para producción

---

## 📦 Seeders Disponibles

### 1. Seed de Usuarios (`npm run seed`)
**Archivo:** [seed.ts](c:\Users\tengo\OneDrive\Documentos\proyectos_reales\butcher_lilieth\backend\src\database\seed.ts)

**Crea:**
- 4 usuarios con diferentes roles:
  - `admin` / PIN: `1234` (ADMIN)
  - `gerente` / PIN: `5678` (MANAGER)
  - `cajero1` / PIN: `1111` (CASHIER)
  - `cajero2` / PIN: `2222` (CASHIER)

### 2. Seed de Productos (`npm run seed:products`)
**Archivo:** [seed-products.ts](c:\Users\tengo\OneDrive\Documentos\proyectos_reales\butcher_lilieth\backend\src\database\seed-products.ts)

**Crea:**
- **4 Categorías:**
  - Carnes Rojas
  - Aves
  - Embutidos
  - Productos al Vacío

- **8 Productos:**
  - **Por peso (WEIGHT):** 4 productos
    - Lomo de Res (CARNE-001)
    - Costilla de Cerdo (CARNE-002)
    - Pechuga de Pollo (AVE-001)
    - Muslos de Pollo (AVE-002)
  - **Unitarios (UNIT):** 2 productos
    - Chorizo Argentino (EMB-001)
    - Salchicha Hot Dog (EMB-002)
  - **Al Vacío (VACUUM_PACKED):** 2 productos
    - Filete de Res al Vacío (VAC-001)
    - Pechuga de Pollo al Vacío (VAC-002)

### 3. Seed de Terminales (`npm run seed:terminals`)
**Archivo:** [seed-terminals.ts](c:\Users\tengo\OneDrive\Documentos\proyectos_reales\butcher_lilieth\backend\src\database\seed-terminals.ts)

**Crea:**
- 2 terminales/cajas:
  - Caja 1 (principal)
  - Caja 2 (secundaria)

### 4. Seed de Sesiones de Caja (`npm run seed:cash-sessions`)
**Archivo:** [seed-cash-sessions.ts](c:\Users\tengo\OneDrive\Documentos\proyectos_reales\butcher_lilieth\backend\src\database\seed-cash-sessions.ts)

**Crea:**
- 1 sesión de caja ABIERTA en Caja 1
- Usuario: cajero1
- Monto inicial: $500

### 5. Seed de Ventas (`npm run seed:sales`)
**Archivo:** [seed-sales.ts](c:\Users\tengo\OneDrive\Documentos\proyectos_reales\butcher_lilieth\backend\src\database\seed-sales.ts)

**Crea:** 3 ventas de ejemplo

**Venta 1: Efectivo**
- Productos: Lomo de Res (2.5 kg) + Pechugas (3 kg)
- Total: ~$196.50
- Pago: $200 efectivo
- Vuelto: ~$3.50

**Venta 2: Transferencia** ✅ ACTUALIZADO
- Productos: Chorizo (2 paq) + Salchicha (3 paq)
- Total: $135
- Pago: Transferencia
- Cliente: Juan Pérez
- ⚠️ **CAMBIO:** Antes era con tarjeta (CARD), ahora es transferencia (TRANSFER)

**Venta 3: Pago Mixto** ✅ ACTUALIZADO
- Productos: Filete al Vacío (5 paq)
- Total: $275
- Pago: $100 efectivo + $175 transferencia
- Cliente: María García
- ⚠️ **CAMBIO:** Antes usaba tarjeta (cardAmount), ahora transferencia (transferAmount)

### 6. Seed de Pedidos (`npm run seed:orders`)
**Archivo:** [seed-orders.ts](c:\Users\tengo\OneDrive\Documentos\proyectos_reales\butcher_lilieth\backend\src\database\seed-orders.ts)

**Crea:** 3 pedidos en diferentes estados

**Pedido 1: PENDING**
- Cliente: Juan Pérez
- Entrega: Mañana a las 10:00
- Total: ~$202 (5kg Lomo + 3kg Pechugas)
- Depósito: $50

**Pedido 2: CONFIRMED**
- Cliente: María García
- Entrega: Próxima semana a las 08:00
- Total: ~$390 (10 Chorizo + 15 Salchicha + 8 Filete)
- Descuento: $50
- Depósito: $200

**Pedido 3: READY**
- Cliente: Carlos Rodríguez
- Entrega: Hoy a las 16:00
- Total: ~$155 (2kg Lomo + 3 Filete)
- Depósito: $100

---

## 🔄 Orden de Ejecución

### Orden Correcto de Seeders

**IMPORTANTE:** Los seeders deben ejecutarse en este orden por las dependencias:

```
1. npm run seed               # Usuarios (sin dependencias)
   ↓
2. npm run seed:products      # Productos y Categorías (sin dependencias)
   ↓
3. npm run seed:terminals     # Terminales (sin dependencias)
   ↓
4. npm run seed:cash-sessions # Sesiones (requiere usuarios y terminales)
   ↓
5. npm run seed:sales         # Ventas (requiere sesión y productos)
   ↓
6. npm run seed:orders        # Pedidos (requiere usuarios y productos)
```

### Ejecutar Todos Automáticamente

```bash
# Opción 1: Comando rápido
npm run seed:all

# Opción 2: Reset completo con confirmación
npm run db:reset-all
```

---

## 🔄 Cambios Recientes

### ✅ Cambios Aplicados (14 de enero 2026)

#### 1. Eliminación de Ventas con Tarjeta

**Antes:**
- Venta 2: `paymentMethod: 'CARD'`, `cardAmount: 135`
- Venta 3: `paymentMethod: 'MIXED'`, `cashAmount: 100`, `cardAmount: 175`

**Ahora:**
- Venta 2: `paymentMethod: 'TRANSFER'`, `transferAmount: 135`
- Venta 3: `paymentMethod: 'MIXED'`, `cashAmount: 100`, `transferAmount: 175`

**Razón:** Actualmente no hay ventas con tarjeta en el sistema de producción, solo efectivo y transferencias.

**⚠️ NOTA IMPORTANTE:** 
- Los campos `cardAmount` **SÍ existen** en la base de datos
- Los métodos de pago `CARD` **SÍ están disponibles** en el enum
- Solo los **seeders** no crean ventas con tarjeta
- Si en el futuro quieres ventas con tarjeta, solo necesitas usarlas desde el frontend

#### 2. Nuevos Scripts en package.json

**Agregado:**
```json
{
  "seed:all": "npm run seed && npm run seed:products && ...",
  "db:reset": "npm run schema:drop && npm run schema:sync && npm run seed:all",
  "db:reset-all": "ts-node ... reset-and-seed.ts"
}
```

**Mejorado:**
- `db:reset`: Ahora ejecuta `seed:all` en lugar de solo `seed`
- `db:reset-all`: Nuevo comando con confirmación interactiva

#### 3. Nuevo Script: reset-and-seed.ts

**Ubicación:** [reset-and-seed.ts](c:\Users\tengo\OneDrive\Documentos\proyectos_reales\butcher_lilieth\backend\src\database\reset-and-seed.ts)

**Características:**
- ✅ Pide confirmación antes de ejecutar
- ✅ Ejecuta todos los seeders en orden
- ✅ Muestra progreso detallado
- ✅ Maneja errores gracefully
- ✅ Muestra resumen final con credenciales

### Consistencia con las Guías

#### ✅ API_GUIDE_PART1_DATABASE.md

**Verificado:**
- ✅ Entidades coinciden con seeders
- ✅ Enums coinciden con seeders
- ✅ Relaciones correctas
- ✅ Tipos de datos correctos
- ✅ Reglas de negocio documentadas
- ✅ Descripción de lotes y batch management

#### ✅ API_GUIDE_PART2_ENDPOINTS.md

**Verificado:**
- ✅ Endpoints de ventas soportan CARD, CASH, TRANSFER, MIXED
- ✅ Ejemplos de request bodies coinciden
- ✅ Estructura de respuestas coincide
- ✅ Validaciones documentadas correctamente
- ✅ Flujos de trabajo actualizados
- ✅ Endpoint PATCH /orders/:id documentado con edición de items

**Nota:** Aunque los seeders no crean ventas con tarjeta, la API **SÍ las soporta** completamente.

---

## 🎯 Casos de Uso Comunes

### Caso 1: Empezar desde cero

```bash
# Con confirmación (recomendado)
npm run db:reset-all

# Rápido (sin confirmación)
npm run db:reset
```

### Caso 2: Solo agregar más datos de prueba

```bash
# Agregar más ventas
npm run seed:sales

# Agregar más pedidos
npm run seed:orders
```

### Caso 3: Reiniciar solo usuarios

```bash
# Eliminar y recrear usuarios
npm run seed
```

### Caso 4: Después de cambios en entidades

```bash
# 1. Sincronizar schema
npm run schema:sync

# 2. (Opcional) Reejecutar seeders
npm run seed:all
```

### Caso 5: Desarrollo normal del día a día

```bash
# Solo iniciar el servidor
npm run start:dev

# La base de datos NO se modifica
# Los datos existentes se mantienen
```

---

## 🔐 Credenciales de Prueba

Después de ejecutar `db:reset` o `db:reset-all`:

| Usuario | PIN | Rol | Uso |
|---------|-----|-----|-----|
| `admin` | `1234` | ADMIN | Administración completa |
| `gerente` | `5678` | MANAGER | Gestión y reportes |
| `cajero1` | `1111` | CASHIER | Operación de caja |
| `cajero2` | `2222` | CASHIER | Operación de caja |

---

## ⚠️ Advertencias Importantes

### 1. Pérdida de Datos

Los siguientes comandos **ELIMINAN TODOS LOS DATOS**:
- `npm run schema:drop`
- `npm run db:reset`
- `npm run db:reset-all`

**Siempre haz backup** de datos importantes antes de ejecutar estos comandos.

### 2. Orden de Seeders

**NO ejecutes** los seeders fuera de orden:
```bash
# ❌ MAL - Causará errores
npm run seed:sales     # Error: No hay sesión abierta
npm run seed:orders    # Error: No hay productos
```

```bash
# ✅ BIEN
npm run seed:all       # Ejecuta en orden correcto
```

### 3. Sesión de Caja

Los seeders crean **1 sesión ABIERTA** en Caja 1.

Para crear ventas en otras cajas:
1. Cierra la sesión actual (desde el frontend o API)
2. Abre una nueva sesión en la caja deseada

### 4. Productos al Vacío

Los seeders NO crean lotes (batches) automáticamente.

Para crear lotes:
- Usa el endpoint `POST /product-batches`
- O créalos desde el frontend (cuando esté implementado)

---

## 📞 Soporte

Si tienes problemas con los seeders:

1. **Verifica el orden de ejecución**
   ```bash
   npm run seed:all
   ```

2. **Revisa la conexión a PostgreSQL**
   ```bash
   psql -U postgres -d butcher_lilieth
   ```

3. **Reinicia completamente**
   ```bash
   npm run db:reset-all
   ```

4. **Revisa los logs**
   Los seeders muestran mensajes detallados de éxito/error

---

**Última actualización:** 14 de enero de 2026
