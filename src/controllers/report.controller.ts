import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service';
import { ApiResponse, createPagination } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export class ReportController {
  static async createReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await ReportService.createReport(req.body);
      const response = ApiResponse.success(
        'Denúncia registrada com sucesso',
        report
      );
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getReports(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        categoryId,
        status,
        priority,
        startDate,
        endDate
      } = req.query;
      const { page, limit, skip } = req.pagination;

      const filters: any = {};
      if (categoryId) filters.categoryId = parseInt(categoryId as string);
      if (status) filters.status = status;
      if (priority) filters.priority = priority;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const { data, total } = await ReportService.getReports(
        filters,
        { page, limit, skip }
      );

      const pagination = createPagination(page, limit, total);
      const response = ApiResponse.successWithPagination(
        'Denúncias listadas com sucesso',
        data,
        pagination
      );

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const report = await ReportService.getReportById(parseInt(id));
      const response = ApiResponse.success(
        'Denúncia encontrada',
        report
      );
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async updateReportStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const report = await ReportService.updateReportStatus(
        parseInt(id),
        req.body
      );
      const response = ApiResponse.success(
        'Status da denúncia atualizado com sucesso',
        report
      );
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
