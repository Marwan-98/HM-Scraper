import { type Response, type Request } from 'express';

import prisma from '../model/prisma';
import { type Category } from '@prisma/client';

export const listCategories = async (req: Request, res: Response): Promise<Response<any, Record<string, any>>> => {
  try {
    let { page, perPage, orderBy = 'id', dir = 'asc', search = '' }: Record<string, any> = req.query;
    page = Number(page) || 1;
    perPage = Number(perPage) || 10;
    orderBy = ['id', 'name', 'description'].includes(String(orderBy).toLowerCase()) ? String(orderBy).toLowerCase() : 'id'
    dir = ['asc', 'desc'].includes(String(dir).toLowerCase()) ? String(dir).toLowerCase() : 'asc';

    const where = {
      parentId: null,
      name: {
        contains: String(search)
      }
    }

    const categories: Array<Partial<Category>> = await prisma.category.findMany({
      where,
      orderBy: {
        [orderBy]: dir
      },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        name: true,
        description: true,
        subcategories: {
          select: {
            id: true,
            name: true,
            description: true,
          }
        },
      }
    });

    const total = await prisma.category.count({ where });

    return res.status(200).json({
      data: {
        categories
      },
      meta: {
        current_page: page,
        total,
        per_page: perPage,
        last_page: Math.ceil(total / perPage),
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      message: 'Server error.',
    });
  }
};

export const getCategory = async (req: Request, res: Response): Promise<Response<any, Record<string, any>>> => {
  try {
    const { id } = req.params

    const category: Partial<Category> | null = +id
      ? await prisma.category.findUnique({
        where: { id: +id },
        select: {
          id: true,
          name: true,
          description: true,
          subcategories: {
            select: {
              id: true,
              name: true,
              description: true,
              createdAt: true,
            }
          },
        }
      })
      : null

    if (!category) {
      return res.status(404).json({
        message: 'No category found!',
      })
    }

    return res.status(200).json(category);
  } catch (error: any) {
    return res.status(500).json({
      message: 'Server error',
    });
  }
};
