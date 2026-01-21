import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductCategory } from './product-category.entity';

export enum SaleType {
  UNIT = 'UNIT',
  WEIGHT = 'WEIGHT',
}

export enum InventoryType {
  UNIT = 'UNIT',
  WEIGHT = 'WEIGHT',
  VACUUM_PACKED = 'VACUUM_PACKED',
}

export enum BarcodeType {
  STANDARD = 'STANDARD',
  NONE = 'NONE',
  WEIGHT_EMBEDDED = 'WEIGHT_EMBEDDED',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  sku: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: SaleType,
    name: 'sale_type',
  })
  saleType: SaleType;

  @Column({
    type: 'enum',
    enum: InventoryType,
    name: 'inventory_type',
  })
  inventoryType: InventoryType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'cost_price',
  })
  costPrice?: number;

  @Column({ length: 100, nullable: true })
  barcode?: string;

  @Column({
    type: 'enum',
    enum: BarcodeType,
    default: BarcodeType.STANDARD,
    name: 'barcode_type',
  })
  barcodeType: BarcodeType;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 3,
    default: 0,
    name: 'stock_quantity',
  })
  stockQuantity: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 3,
    default: 0,
    name: 'min_stock',
  })
  minStock: number;

  @Column({ length: 20, nullable: true })
  unit?: string;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ default: false, name: 'track_inventory' })
  trackInventory: boolean;

  @Column({ type: 'uuid', name: 'category_id' })
  categoryId: string;

  @ManyToOne(() => ProductCategory, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category: ProductCategory;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
