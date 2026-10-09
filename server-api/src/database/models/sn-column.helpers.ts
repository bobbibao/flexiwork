import { DataType } from 'sequelize-typescript';
import { ModelAttributeColumnOptions } from 'sequelize';

/**
 * BIGINT column returned as a JS number (pg returns int8 as string).
 * Converted per column on purpose: never set a global pg int8 parser (docs/ARCHITECTURE.md §16).
 */
export function bigintNumber(name: string, options: Partial<ModelAttributeColumnOptions> = {}): Partial<ModelAttributeColumnOptions> {
  return {
    type: DataType.BIGINT,
    ...options,
    get(this: any) {
      const v = this.getDataValue(name);
      return v === null || v === undefined ? v : Number(v);
    },
  };
}

/** NUMERIC column returned as a JS number (pg returns numeric as string). */
export function numericNumber(name: string, options: Partial<ModelAttributeColumnOptions> = {}): Partial<ModelAttributeColumnOptions> {
  return {
    type: DataType.DECIMAL,
    ...options,
    get(this: any) {
      const v = this.getDataValue(name);
      return v === null || v === undefined ? v : Number(v);
    },
  };
}
