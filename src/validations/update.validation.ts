import Joi from 'joi';

export const createUpdateSchema = Joi.object({
  comment: Joi.string().min(5).required().messages({
    'string.min': 'O comentário deve ter pelo menos 5 caracteres',
    'any.required': 'O comentário é obrigatório'
  }),
  updatedBy: Joi.string().max(100).required().messages({
    'string.max': 'O nome do responsável deve ter no máximo 100 caracteres',
    'any.required': 'O responsável pela atualização é obrigatório'
  })
});
