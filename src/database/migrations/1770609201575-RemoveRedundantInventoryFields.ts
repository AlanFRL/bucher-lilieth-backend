import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveRedundantInventoryFields1770609201575 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Actualizar valores de unit: "paquete" -> "unidad"
        await queryRunner.query(`
            UPDATE "products"
            SET "unit" = 'unidad'
            WHERE "unit" = 'paquete';
        `);

        // 2. Eliminar enum inventory_type
        await queryRunner.query(`
            ALTER TABLE "products" DROP COLUMN IF EXISTS "inventory_type";
        `);

        // 3. Eliminar columna track_inventory
        await queryRunner.query(`
            ALTER TABLE "products" DROP COLUMN IF EXISTS "track_inventory";
        `);
        
        // 4. Eliminar el tipo enum si existe
        await queryRunner.query(`
            DROP TYPE IF EXISTS "products_inventory_type_enum";
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revertir cambios (opcional, complejo porque requiere recrear enum)
        await queryRunner.query(`
            CREATE TYPE "products_inventory_type_enum" AS ENUM('UNIT', 'WEIGHT', 'VACUUM_PACKED');
        `);
        
        await queryRunner.query(`
            ALTER TABLE "products" 
            ADD COLUMN "inventory_type" "products_inventory_type_enum" DEFAULT 'UNIT';
        `);
        
        await queryRunner.query(`
            ALTER TABLE "products" 
            ADD COLUMN "track_inventory" boolean DEFAULT true;
        `);
        
        // Restaurar "unidad" -> "paquete" (solo si es necesario)
        await queryRunner.query(`
            UPDATE "products"
            SET "unit" = 'paquete'
            WHERE "unit" = 'unidad' AND "sale_type" = 'UNIT';
        `);
    }

}
