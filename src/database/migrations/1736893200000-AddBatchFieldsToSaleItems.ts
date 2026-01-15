import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBatchFieldsToSaleItems1736893200000 implements MigrationInterface {
  name = 'AddBatchFieldsToSaleItems1736893200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add batch-related fields to sale_items table
    await queryRunner.query(`
      ALTER TABLE "sale_items" 
      ADD COLUMN "batch_id" uuid,
      ADD COLUMN "batch_number" character varying(100),
      ADD COLUMN "actual_weight" numeric(10,3)
    `);

    // Add foreign key constraint for batch_id
    await queryRunner.query(`
      ALTER TABLE "sale_items" 
      ADD CONSTRAINT "FK_sale_items_batch" 
      FOREIGN KEY ("batch_id") 
      REFERENCES "product_batches"("id") 
      ON DELETE SET NULL 
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "sale_items" 
      DROP CONSTRAINT "FK_sale_items_batch"
    `);

    // Drop columns
    await queryRunner.query(`
      ALTER TABLE "sale_items" 
      DROP COLUMN "actual_weight",
      DROP COLUMN "batch_number",
      DROP COLUMN "batch_id"
    `);
  }
}
