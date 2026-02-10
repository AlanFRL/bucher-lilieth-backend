import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDiscountFieldsToProducts1770700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Añadir columna discount_price (nullable)
    await queryRunner.addColumn(
      'products',
      new TableColumn({
        name: 'discount_price',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true,
      }),
    );

    // Añadir columna discount_active (default false)
    await queryRunner.addColumn(
      'products',
      new TableColumn({
        name: 'discount_active',
        type: 'boolean',
        default: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir cambios
    await queryRunner.dropColumn('products', 'discount_active');
    await queryRunner.dropColumn('products', 'discount_price');
  }
}
