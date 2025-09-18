/**
 * Defines the structure for a paginated result before it's processed
 * by the global interceptor.
 * This is the object that our service methods should return.
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
}

/**
 * A utility function to create a standardized paginated result object.
 * @param items - The array of items for the current page.
 * @param total - The total number of items in the database.
 * @param page - The current page number.
 * @param limit - The number of items per page.
 * @returns A structured paginated result object.
 */
export function paginate<T>(items: T[], total: number, page: number, limit: number): PaginatedResult<T> {
  const lastPage = Math.ceil(total / limit);
  return {
    data: items,
    meta: {
      total,
      page,
      limit,
      lastPage,
    },
  };
}
