import * as puppeteer from 'puppeteer';
import { type Browser, type Page } from 'puppeteer';
import { type ProductArticleDetails, type Image, type colorAttributes, type productSchema } from './productSchema';
import * as fs from 'fs';
import { join } from 'path';
import { type Product, type Category } from '@prisma/client';
import prisma from '../api/model/prisma';
import { saveProduct } from '../api/controllers/products.controller';

export const saveImagesToSystem = async (images: Image[], browser: Browser, sku: string): Promise<void> => {
  images.forEach((imageUrls, idx) => {
    for (const key in imageUrls) {
      if (imageUrls[key as keyof Image].includes('DESCRIPTIVESTILLLIFE') && key === 'zoom') {
        const mainImage = images.splice(idx, 1);
        images.unshift(mainImage[0])
      }
    }
  })

  await asyncForEach(images, async (imageUrls, idx) => {
    const newPage = await browser.newPage();
    newPage.setDefaultNavigationTimeout(0);

    for (const key in imageUrls) {
      const response = await newPage.goto(`https:${imageUrls[key as keyof Image]}`);
      await newPage.content();
      const imageBuffer = await response?.buffer();

      fs.mkdir(join(__dirname, '../../public', `/images/${sku}/`), () => {
        fs.mkdir(join(__dirname, '../../public', `/images/${sku}/${idx}`), async () => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          await fs.promises.writeFile(join(__dirname, '../../public', `/images/${sku}/${idx}/${sku}_${key}.jpg`), imageBuffer!, { flag: 'w' });
        });
      });
    }

    await newPage.close();
  })
}

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export const withBrowser = async (fn: (browser: puppeteer.Browser) => Promise<void[]>): Promise<void[]> => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--disable-features=site-per-process', '--ignore-certificate-errors']
  });

  try {
    return await fn(browser);
  } finally {
    await browser.close();
  }
}

export const withPage = (browser: puppeteer.Browser) => async (fn: (product: puppeteer.Page) => Promise<void>) => {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 })
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36');
  page.setDefaultNavigationTimeout(0);

  try {
    await fn(page);
  } finally {
    await page.close();
  }
}

export const addColorAttributes = (productArticleDetails: ProductArticleDetails): ProductArticleDetails => {
  const attributes: colorAttributes = {
    name: 'Color',
    options: []
  }

  for (const key in productArticleDetails) {
    if (!key.match(/[a-zA-Z]/g)) {
      attributes.options.push({
        name: productArticleDetails[key].name,
        value: productArticleDetails[key].rgb
      });
    }
  }

  productArticleDetails.colors = {
    ...attributes
  }

  return productArticleDetails
}

export const findOrCreateCategory = async (categoryName: string, parentCategoryId?: number, description?: string): Promise<Category> => {
  let currentCategory = await prisma.category.findFirst({
    where: {
      AND: [
        {
          name: { equals: categoryName, }
        },
        {
          parentId: { equals: parentCategoryId ?? undefined }
        }
      ]
    }
  })

  if (!currentCategory) {
    currentCategory = await prisma.category.create({
      data: {
        name: categoryName,
        description: description ?? undefined,
      }
    })
  }

  if (parentCategoryId) {
    await prisma.category.update({
      where: {
        id: currentCategory.id
      },
      data: {
        parent: {
          connect: {
            id: parentCategoryId
          }
        }
      }
    })
  }

  return currentCategory
}

export const connectVariants = async (productVariants: Product[], variants: Array<{ id: number }> | any[]): Promise<void> => {
  await asyncForEach(productVariants, async (product: Product) => {
    await prisma.product.update({
      where: {
        id: product.id
      },
      data: {
        variants: {
          connect: variants.filter((variant) => variant.id !== product.id)
        }
      }
    })
  })
}

export const createProduct = async (url: string, page: Page, altBrowser: Browser, currentCategory: Category, parentCategory: Category): Promise<Product | null> => {
  await page.goto(`${url}`);

  let createdProduct = null;

  await page.waitForXPath('//script[contains(., "productArticleDetails")]').then(async () => {
    let productArticleDetails = await page.evaluate('productArticleDetails') as ProductArticleDetails;

    const productScripts = await page.$$('[type="application/ld+json"], #product-schema');
    const productSchema: productSchema = JSON.parse(await page.evaluate(el => el?.innerHTML, productScripts[1]));

    productArticleDetails = addColorAttributes(productArticleDetails);

    createdProduct = await saveProduct(productSchema, productArticleDetails, currentCategory.id);

    const images: Image[] = productArticleDetails[productSchema.sku].images;

    await saveImagesToSystem(images, altBrowser, productSchema.sku);

    await prisma.category.update({
      where: {
        id: parentCategory.id,
      },
      data: {
        products: {
          connect: {
            id: createdProduct.id
          }
        }
      }
    })
  })

  return createdProduct;
}

export async function asyncForEach<T> (array: T[], callback: (item: T, index: number) => Promise<void>): Promise<any> {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index);
  }
}
