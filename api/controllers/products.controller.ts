import { type Response, type Request } from 'express';

import prisma from '../model/prisma';
import { type Product } from '@prisma/client';
import { type ProductAttributesValues, type ProductArticleDetails, type productSchema } from '../../utils/productSchema';
import { join } from 'path';
import { type ProductsWithAttribs } from '../../utils/global.types';

export const listProducts = async (_: Request, res: Response): Promise<Response<any, Record<string, any>>> => {
  try {
    // Prisma query
    const products: Array<Partial<ProductsWithAttribs>> = await prisma.product.findMany({
      select: {
        id: true,
        sku: true,
        slug: true,
        name: true,
        stockStatus: true,
        category: {
          select: {
            id: true,
            name: true
          }
        },
        description: true,
        images: true,
        attributes: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            productId: true,
            options: true
          }
        },
        regular_price: true,
        discounted_price: true,
        currency: true,
        details: true,
        createdAt: true
      },
    });

    return res.status(200).json({
      data: {
        products: products.map(product => {
          product.details = product.details?.map((detail) => ({
            ...detail,
            value: JSON.parse(detail.value)
          }))
          return product;
        })
      },
    }
    );
  } catch (error: any) {
    return res.status(500).json({
      message: 'Server error',
    });
  }
};

export const getProduct = async (req: Request, res: Response): Promise<Response<any, Record<string, any>>> => {
  try {
    const { idOrSlug } = req.params

    const product: Partial<ProductsWithAttribs> | null = await prisma.product.findUnique({
      where: {
        id: +idOrSlug ? +idOrSlug : undefined,
        slug: +idOrSlug ? undefined : idOrSlug
      },

      select: {
        id: true,
        sku: true,
        slug: true,
        name: true,
        stockStatus: true,
        category: {
          select: {
            id: true,
            name: true
          }
        },
        description: true,
        images: true,
        attributes: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            productId: true,
            options: true
          },
        },
        variants: {
          select: {
            id: true,
            name: true,
            images: true,
          }
        },
        regular_price: true,
        discounted_price: true,
        currency: true,
        details: true,
      }
    })

    if (!product) {
      return res.status(404).json({
        message: 'No product found!',
      })
    }

    product.details = product.details?.map((detail) => ({
      ...detail,
      value: JSON.parse(detail.value)
    }))

    return res.status(200).json(product);
  } catch (error: any) {
    return res.status(500).json({
      message: 'Server error',
    });
  }
};

export const saveProduct = async (productSchema: productSchema, productArticleDetails: ProductArticleDetails, parentCategory: number): Promise<Product> => {
  const {
    sku,
    name,
    description,
    availability,
  } = productSchema;

  const {
    productAttributes,
    images,
    sizes,
    whitePriceValue,
    redPriceValue,
  } = productArticleDetails[sku];

  const { values } = productAttributes;

  let findProduct = await prisma.product.findUnique({
    where: {
      sku,
    }
  })

  if (!findProduct) {
    findProduct = await prisma.product.create({
      data: {
        sku,
        name,
        slug: `/${sku}`,
        stockStatus: availability === 'https://schema.org/InStock',
        category: {
          connect: {
            id: parentCategory,
          }
        },
        description,
        images: {
          create: images.map(
            (_, idx) => ({
              thumbnail: join(`/images/${sku}/${idx}/${sku}_thumbnail.jpg`),
              image: join(`/images/${sku}/${idx}/${sku}_image.jpg`),
              fullscreen: join(`/images/${sku}/${idx}/${sku}_fullscreen.jpg`),
              zoom: join(`/images/${sku}/${idx}/${sku}_zoom.jpg`),
            })
          ),
        },
        attributes: {
          create: [
            {
              name: 'Color',
              options: {
                create: productArticleDetails.colors.options.map(
                  (color) => ({
                    name: color.name,
                    value: color.value
                  })
                )
              }
            },
            {
              name: 'Size',
              options: {
                create: sizes.filter(size => size.name !== 'NOSIZE').map(
                  (size) => ({
                    name: size.name,
                    value: size.name.toLowerCase()
                  })
                )
              }
            }
          ]
        },
        details: {
          create: Object.keys(values).map(key => ({
            name: key,
            value: JSON.stringify(values[key as keyof ProductAttributesValues])
          }))
        },
        regular_price: parseFloat(whitePriceValue),
        discounted_price: redPriceValue ? parseFloat(redPriceValue) : null,
        currency: 'USD',
      },
    })
  }

  await prisma.product.update({
    where: {
      id: findProduct.id,
    },
    data: {
      slug: `/api/products/${findProduct.id}`
    }
  })

  return findProduct;
}
