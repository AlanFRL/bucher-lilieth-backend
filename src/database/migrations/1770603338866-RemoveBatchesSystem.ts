import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveBatchesSystem1770603338866 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Eliminar foreign keys de batch_id
        await queryRunner.query(`
            ALTER TABLE "sale_items" 
            DROP CONSTRAINT IF EXISTS "FK_sale_items_batch";
        `);
        
        await queryRunner.query(`
            ALTER TABLE "order_items" 
            DROP CONSTRAINT IF EXISTS "FK_order_items_batch";
        `);
        
        // 2. Eliminar columnas batch_id
        await queryRunner.query(`
            ALTER TABLE "sale_items" DROP COLUMN IF EXISTS "batch_id";
        `);
        
        await queryRunner.query(`
            ALTER TABLE "order_items" DROP COLUMN IF EXISTS "batch_id";
        `);
        
        // 3. Eliminar tabla product_batches
        await queryRunner.query(`
            DROP TABLE IF EXISTS "product_batches" CASCADE;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Rollback: Recrear estructura (sin datos)
        // NOTA: Los datos se pierden permanentemente
        
        await queryRunner.query(`
            CREATE TABLE "product_batches" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "product_id" uuid NOT NULL,
                "batch_number" varchar NOT NULL UNIQUE,
                "actual_weight" decimal(10,3) NOT NULL,
                "unit_cost" decimal(10,2) NOT NULL,
                "unit_price" decimal(10,2) NOT NULL,
                "packed_at" TIMESTAMP NOT NULL DEFAULT now(),
                "expiry_date" TIMESTAMP,
                "notes" text,
                "status" varchar NOT NULL DEFAULT 'AVAILABLE',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "FK_product_batches_product" FOREIGN KEY ("product_id") 
                    REFERENCES "products"("id") ON DELETE CASCADE
            );
        `);
        
        await queryRunner.query(`
            ALTER TABLE "sale_items" 
            ADD COLUMN "batch_id" uuid;
        `);
        
        await queryRunner.query(`
            ALTER TABLE "sale_items" 
            ADD CONSTRAINT "FK_sale_items_batch" 
            FOREIGN KEY ("batch_id") REFERENCES "product_batches"("id");
        `);
        
        await queryRunner.query(`
            ALTER TABLE "order_items" 
            ADD COLUMN "batch_id" uuid;
        `);
        
        await queryRunner.query(`
            ALTER TABLE "order_items" 
            ADD CONSTRAINT "FK_order_items_batch" 
            FOREIGN KEY ("batch_id") REFERENCES "product_batches"("id");
        `);
    }

}
