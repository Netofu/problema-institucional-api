import { Request, Response, NextFunction } from 'express';
import { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from '../utils/constants';

export const pagination = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const page = parseInt(req.query.page as string) || DEFAULT_PAGE;
  const limit = parseInt(req.query.limit as string) || DEFAULT_LIMIT;

  req.pagination = {
    page: page < 1 ? DEFAULT_PAGE : page,
    limit: limit > MAX_LIMIT ? MAX_LIMIT : limit < 1 ? DEFAULT_LIMIT : limit,
    skip: (page - 1) * limit
  };

  next();
};

declare global {
  namespace Express {
    interface Request {
      pagination: {
        page: number;
        limit: number;
        skip: number;
      };
    }
  }
}
