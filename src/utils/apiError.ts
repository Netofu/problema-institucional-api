export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Recurso não encontrado') {
    super(404, message);
  }
}

export class ValidationError extends ApiError {
  constructor(message: string = 'Dados inválidos') {
    super(400, message);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Conflito de dados') {
    super(409, message);
  }
}
