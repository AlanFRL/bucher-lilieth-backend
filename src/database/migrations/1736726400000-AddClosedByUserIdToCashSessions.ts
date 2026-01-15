import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddClosedByUserIdToCashSessions1736726400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add closed_by_user_id column
    await queryRunner.addColumn(
      'cash_sessions',
      new TableColumn({
        name: 'closed_by_user_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      'cash_sessions',
      new TableForeignKey({
        columnNames: ['closed_by_user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
        name: 'FK_cash_sessions_closed_by_user',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey('cash_sessions', 'FK_cash_sessions_closed_by_user');

    // Drop column
    await queryRunner.dropColumn('cash_sessions', 'closed_by_user_id');
  }
}
