import Joi from 'joi';
import { PRIORITY_VALUES, STATUS_VALUES } from '../utils/constants';

export const createReportSchema = Joi.object({
  title: Joi.string().min(5).max(200).required().messages({
    'string.min': 'O título deve ter pelo menos 5 caracteres',
    'string.max': 'O título deve ter no máximo 200 caracteres',
    'any.required': 'O título é obrigatório'
  }),
  description: Joi.string().min(10).required().messages({
    'string.min': 'A descrição deve ter pelo menos 10 caracteres',
    'any.required': 'A descrição é obrigatória'
  }),
  categoryId: Joi.number().integer().min(1).required().messages({
    'number.base': 'O ID da categoria deve ser um número',
    'number.min': 'O ID da categoria deve ser maior que 0',
    'any.required': 'A categoria é obrigatória'
  }),
  location: Joi.string().min(5).max(200).required().messages({
    'string.min': 'O local deve ter pelo menos 5 caracteres',
    'string.max': 'O local deve ter no máximo 200 caracteres',
    'any.required': 'O local é obrigatório'
  }),
  priority: Joi.string()
    .valid(...PRIORITY_VALUES)
    .required()
    .messages({
      'any.only': 'Prioridade inválida',
      'any.required': 'A prioridade é obrigatória'
    }),
  reporterName: Joi.string().max(100).optional().messages({
    'string.max': 'O nome do registrante deve ter no máximo 100 caracteres'
  })
});

export const updateReportStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...STATUS_VALUES)
    .required()
    .messages({
      'any.only': 'Status inválido',
      'any.required': 'O status é obrigatório'
    }),
  updatedBy: Joi.string().max(100).required().messages({
    'string.max': 'O nome do responsável deve ter no máximo 100 caracteres',
    'any.required': 'O responsável pela atualização é obrigatório'
  })
});

export const reportQuerySchema = Joi.object({
  categoryId: Joi.number().integer().min(1).optional(),
  status: Joi.string()
    .valid(...STATUS_VALUES)
    .optional(),
  priority: Joi.string()
    .valid(...PRIORITY_VALUES)
    .optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).max(100).optional()
});
