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
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'price',
    transformer: {
      to: (value) => value,
      from: (value) => (value ? parseFloat(value) : 0),
    },
  })
  price: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'cost_price',
    transformer: {
      to: (value) => value,
      from: (value) => (value ? parseFloat(value) : null),
    },
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
    transformer: {
      to: (value) => value,
      from: (value) => (value ? parseFloat(value) : 0),
    },
  })
  stockQuantity: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 3,
    default: 0,
    name: 'min_stock',
    transformer: {
      to: (value) => value,
      from: (value) => (value ? parseFloat(value) : 0),
    },
  })
  minStock: number;

  @Column({ length: 20, nullable: true })
  unit?: string;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'discount_price',
    transformer: {
      to: (value) => value,
      from: (value) => value ? parseFloat(value) : null,
    },
  })
  discountPrice?: number;

  @Column({ default: false, name: 'discount_active' })
  discountActive!: boolean;

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
