import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddBatchIdToOrderItems1736804400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add batch_id column
    await queryRunner.addColumn(
      'order_items',
      new TableColumn({
        name: 'batch_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      'order_items',
      new TableForeignKey({
        columnNames: ['batch_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'product_batches',
        onDelete: 'SET NULL',
        name: 'FK_order_items_batch',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey('order_items', 'FK_order_items_batch');

    // Drop column
    await queryRunner.dropColumn('order_items', 'batch_id');
  }
}
