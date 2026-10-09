import { DataType, Model } from 'sequelize-typescript';

/**
 * @description: Mapper and exclude fields from entity for 1 value
 * */
export const serializeModel = <T extends Model>(
  value: T,
  includeFields: (keyof T)[],
  excludeFields: (keyof T)[],
): Partial<T> => {
  return serialize(serializeNullValues(value), includeFields, excludeFields);
};

/**
 * @description: Mapper and exclude fields from entity for array of values
 * */
export const serializeModels = <T extends Model>(
  value: T[],
  includeFields: (keyof T)[],
  excludeFields: (keyof T)[],
): Partial<T>[] => {
  return value.map((model) => serialize(serializeNullValues(model), includeFields, excludeFields));
};

/**
 * @description: Parse null values to empty value
 * */
export const serializeNullValues = <T extends Model>(model: T): T => {
  const values = model.dataValues;

  // Access model's attribute definitions
  const modelAttributes = (model.constructor as typeof Model).rawAttributes;

  Object.keys(modelAttributes).forEach((key) => {
    const attribute = modelAttributes[key];
    const value = values[key];
    // Check for null values and convert based on the field type
    if (value === null) {
      if (attribute.type instanceof DataType.TEXT) {
        values[key] = '';
      } else if (
        attribute.type instanceof DataType.INTEGER ||
        attribute.type instanceof DataType.DECIMAL ||
        attribute.type instanceof DataType.NUMBER
      ) {
        values[key] = 0;
      } else if (attribute.type instanceof DataType.DATE) {
        values[key] = '0001-01-01T00:00:00Z';
      }
    }
  });

  return model;
};

const serialize = <T extends Model>(model: T, includeFields: (keyof T)[], excludeFields: (keyof T)[]): Partial<T> => {
  const values = model.dataValues;

  // Access model's attribute definitions
  const modelAttributes = (model.constructor as typeof Model).rawAttributes;

  if (!includeFields.length) {
    includeFields = Object.keys(modelAttributes) as (keyof T)[];
  }

  for (const key of Object.keys(modelAttributes)) {
    if (includeFields.length && includeFields.includes(key as keyof T) && !excludeFields.includes(key as keyof T)) {
      continue;
    } else {
      delete values[key];
    }
  }

  return model;
};
