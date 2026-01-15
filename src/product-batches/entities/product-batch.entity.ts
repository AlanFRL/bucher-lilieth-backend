import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity('product_batches')
export class ProductBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'batch_number', type: 'varchar', length: 50 })
  batchNumber: string;

  @Column({ name: 'actual_weight', type: 'decimal', precision: 10, scale: 3 })
  actualWeight: number;

  @Column({ name: 'unit_cost', type: 'decimal', precision: 10, scale: 2 })
  unitCost: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ name: 'is_sold', type: 'boolean', default: false })
  isSold: boolean;

  @Column({ name: 'packed_at', type: 'date' })
  packedAt: Date;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
