import { type Prisma } from '@prisma/client'

export type ProductsWithAttribs = Prisma.ProductGetPayload<{
  include: {
    attributes: true
    details: true
  }
}>
