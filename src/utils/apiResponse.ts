export class ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: Pagination;

  constructor(
    success: boolean,
    message: string,
    data?: T,
    pagination?: Pagination
  ) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.pagination = pagination;
  }

  static success<T>(message: string, data?: T): ApiResponse<T> {
    return new ApiResponse(true, message, data);
  }

  static successWithPagination<T>(
    message: string,
    data: T,
    pagination: Pagination
  ): ApiResponse<T> {
    return new ApiResponse(true, message, data, pagination);
  }

  static error(message: string): ApiResponse<null> {
    return new ApiResponse(false, message, null);
  }
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const createPagination = (
  page: number,
  limit: number,
  total: number
): Pagination => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
};
