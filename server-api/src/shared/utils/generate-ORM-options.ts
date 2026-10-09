import { Op, OrderItem, WhereOptions } from 'sequelize';
import { BadRequestError } from './base.error';

const ASC_DIRECTION = 'ASC';
const DESC_DIRECTION = 'DESC';

/**
 * @description: Generate order options used with ORM query
 * @param sort: string
 * @param allowedOrderFields: (keyof T)[]
 * @param customOrderFields?: Record<string, OrderItem>
 * @returns OrderItem[]
 */
export function getOrderOptions<T>(
  sort: string,
  allowedOrderFields: (keyof T)[],
  customOrderFields?: Record<string, OrderItem>,
): OrderItem[] {
  const orderOptions: OrderItem[] = [];

  // Validate sort input
  if (!sort) {
    return orderOptions;
  }

  // Get sort params
  const sortParams = sort.split(':');
  if (sortParams.length !== 2) {
    throw new BadRequestError("Invalid sort format. Expected 'field:direction'.");
  }

  const sortKey = sortParams[0] as keyof T;
  let sortDirection = sortParams[1].toUpperCase();

  // Validate sort direction (ASC & DESC are allowed)
  if (![ASC_DIRECTION, DESC_DIRECTION].includes(sortDirection)) {
    sortDirection = ASC_DIRECTION;
  }

  // Check if the sortKey is in the allowed fields list
  if (allowedOrderFields.includes(sortKey)) {
    orderOptions.push([sortKey as string, sortDirection]);
  }

  // Check if there's a custom sort logic (like related models)
  if (customOrderFields && customOrderFields[sortKey as string]) {
    const customOrderValue = [...(customOrderFields[sortKey as string] as string[]), sortDirection] as OrderItem;

    orderOptions.push(customOrderValue);
  }

  return orderOptions;
}

/**
 * @description: Generate where options used with ORM query
 * @param filters: string[]
 * @param search: string
 * @param allowedFilterFields: (keyof T)[]
 * @param allowedSearchFields: (keyof T)[]
 * @param customFilterFields?: Record<string, (value: string) => WhereOptions<T>>
 * @param customSearchFields?: Record<string, (value: string) => WhereOptions<T>>
 * @returns WhereOptions<T>
 */
export function getFilterOptions<T>(
  filters: string[],
  search: string,
  allowedFilterFields: (keyof T)[],
  allowedSearchFields: (keyof T)[],
  customFilterFields?: Record<string, (value: string) => WhereOptions<T>>,
  customSearchFields?: Record<string, (value: string) => WhereOptions<T>>,
): WhereOptions<T> {
  const whereOptions: { [key: string]: unknown } = {};

  filters.forEach((filter) => {
    const [field, value] = filter.split(':');

    if (!field || !value) {
      throw new BadRequestError("Invalid filter format. Expected 'field:value'.");
    }

    // Check if the field is allowed or has custom logic
    if (allowedFilterFields.includes(field as keyof T)) {
      whereOptions[field] = value;
      if (field in customFilterFields) {
        whereOptions[field] = customFilterFields[field](value);
      }
    }
  });

  if (search) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    whereOptions[Op.or] = allowedSearchFields.map((cField) => ({
      [cField]: { [Op.iLike]: `%${search}%` },
    }));

    if (customSearchFields) {
      for (const cField in customSearchFields) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        whereOptions[Op.or] = [
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          ...whereOptions[Op.or],
          {
            [cField]: customSearchFields[cField](search),
          },
        ];
      }
    }
  }

  return whereOptions as WhereOptions<T>;
}
