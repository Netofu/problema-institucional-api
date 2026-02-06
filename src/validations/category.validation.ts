import Joi from 'joi';

export const createCategorySchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    'string.min': 'O nome deve ter pelo menos 3 caracteres',
    'string.max': 'O nome deve ter no máximo 100 caracteres',
    'any.required': 'O nome é obrigatório'
  }),
  description: Joi.string().max(500).optional().messages({
    'string.max': 'A descrição deve ter no máximo 500 caracteres'
  })
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().min(3).max(100).optional().messages({
    'string.min': 'O nome deve ter pelo menos 3 caracteres',
    'string.max': 'O nome deve ter no máximo 100 caracteres'
  }),
  description: Joi.string().max(500).optional().messages({
    'string.max': 'A descrição deve ter no máximo 500 caracteres'
  }),
  isActive: Joi.boolean().optional()
});

export const categoryQuerySchema = Joi.object({
  isActive: Joi.boolean().optional(),
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).max(100).optional()
});
