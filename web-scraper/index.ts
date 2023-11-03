/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as puppeteer from 'puppeteer';
import bluebird from 'bluebird';
import { type ProductArticleDetails, type Image, type productSchema } from '../utils/productSchema';
import { connectVariants, createProduct, findOrCreateCategory, withBrowser, withPage } from '../utils/scraper';
import { categories } from '../utils/categories';
import { type Product } from '@prisma/client';

export const startScraper = async (): Promise<void> => {
  const altBrowser = await puppeteer.launch({
    args: ['--disable-features=site-per-process'],
    defaultViewport: {
      width: 1920,
      height: 1080
    },
  });
  const page = await altBrowser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36');
  page.setDefaultNavigationTimeout(0);

  const pageSize = 1;
  let index = 1;

  const productImages: Image[] = [];

  let variants: Array<{ id: number } > | any[] = [];
  let productVariants: Product[] | any[] = [];

  for (let j = 0; j < categories.length; j++) {
    const parentCategory = await findOrCreateCategory(categories[j].name)

    for (let i = 0; i < categories[j].subcategories!.length; i++) {
      await page.goto(categories[j].subcategories![i].url + `?page-size=${pageSize}`);
      await page.content();

      const currentCategory = await findOrCreateCategory(categories[j].subcategories![i].name, parentCategory.id, categories[j].subcategories![i].description)

      const products = await page.$$('.product-item');

      await withBrowser(async (browser) => {
        return await bluebird.map(products, async (product: puppeteer.ElementHandle) => {
          await withPage(browser)(async (page) => {
            const url = await product.$eval('.item-link', el => el.getAttribute('href'));

            await page.goto(`https://www2.hm.com${url}/`);

            await page.waitForXPath('//script[contains(., "productArticleDetails")]').then(async () => {
              const productArticleDetails = await page.evaluate('productArticleDetails') as ProductArticleDetails;

              const productScripts = await page.$$('[type="application/ld+json"], #product-schema');
              const productSchema: productSchema = JSON.parse(await page.evaluate(el => el?.innerHTML, productScripts[1]));

              const createdProduct = await createProduct(`https://www2.hm.com${url}/`, page, altBrowser, currentCategory, parentCategory);

              variants.push({ id: createdProduct!.id })
              productVariants.push(createdProduct!)

              for (const key in productArticleDetails) {
                if (!key.match(/[a-zA-Z]/g) && key !== productSchema.sku) {
                  console.log('saving variant', index);

                  const url = `https://www2.hm.com${productArticleDetails[key].url}/`;

                  const createdVariant = await createProduct(url, page, altBrowser, currentCategory, parentCategory);

                  variants.push({ id: createdVariant!.id })
                  productVariants.push(createdVariant!)

                  index++;
                }
              }

              await connectVariants(productVariants, variants);

              productVariants = []
              variants = []

              console.log(`${index} products are saved`)
              index++
            }).catch(() => {
              return null;
            })
          });
        }, { concurrency: 20 })
      });
    }
  }

  console.log(`Scrapper has finished and ${productImages.length} was saved`)
}

void startScraper();
