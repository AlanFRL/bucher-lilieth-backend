-- ================================================
-- MIGRACIÓN: Eliminar estado CONFIRMED
-- Fecha: 2026-01-14
-- ================================================

-- Este script:
-- 1. Actualiza todos los pedidos CONFIRMED a READY
-- 2. Elimina la columna confirmed_at (ya no se usa)
-- 3. Actualiza el ENUM de status (se hace vía ALTER TYPE)

BEGIN;

-- 1. Actualizar pedidos que están en CONFIRMED a READY
UPDATE orders 
SET status = 'READY' 
WHERE status = 'CONFIRMED';

-- 2. Eliminar columna confirmed_at (ya no se usa)
ALTER TABLE orders 
DROP COLUMN IF EXISTS confirmed_at;

-- 3. Actualizar el tipo ENUM para quitar CONFIRMED
-- Nota: PostgreSQL requiere recrear el enum o usar una migración más compleja
-- Opción 1: Si hay pocos datos, recrear el tipo
-- Opción 2: Simplemente dejarlo (no afecta funcionamiento si no lo usas)

-- Para recrear el tipo (SOLO si no tienes muchos datos):
/*
ALTER TABLE orders 
ALTER COLUMN status TYPE varchar(20);

DROP TYPE IF EXISTS "orders_status_enum";

CREATE TYPE "orders_status_enum" AS ENUM ('PENDING', 'READY', 'DELIVERED', 'CANCELLED');

ALTER TABLE orders 
ALTER COLUMN status TYPE "orders_status_enum" 
USING status::"orders_status_enum";
*/

-- Verificar cambios
SELECT 
  status, 
  COUNT(*) as count 
FROM orders 
GROUP BY status 
ORDER BY status;

COMMIT;

-- ================================================
-- ROLLBACK (Si algo sale mal)
-- ================================================
/*
BEGIN;

-- Restaurar estructura anterior
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP;

-- Cambiar READY de vuelta a CONFIRMED (si es necesario)
-- UPDATE orders SET status = 'CONFIRMED' WHERE status = 'READY';

COMMIT;
*/
