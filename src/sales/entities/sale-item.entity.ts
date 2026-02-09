import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Sale } from './sale.entity';
import { Product } from '../../products/entities/product.entity';

/**
 * SaleItem entity represents an individual product line in a sale
 * Stores a snapshot of product data at the time of sale
 */
@Entity('sale_items')
export class SaleItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'sale_id' })
  saleId: string;

  @ManyToOne(() => Sale, (sale) => sale.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  // Snapshot of product data at time of sale
  @Column({ length: 200, name: 'product_name' })
  productName: string;

  @Column({ length: 50, name: 'product_sku' })
  productSku: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 3,
  })
  quantity: number;

  @Column({ type: 'integer', nullable: true })
  pieces?: number;

  @Column({ length: 20, nullable: true })
  unit?: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'unit_price',
  })
  unitPrice: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  discount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  subtotal: number;

  // Optional field for weight-based products (WEIGHT, VACUUM_PACKED)
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 3,
    name: 'actual_weight',
    nullable: true,
  })
  actualWeight?: number;
}
