export interface productSchema {
  sku: string
  name: string
  color: string
  availability: string
  category: Category
  description: string
}

export interface sourceCategory {
  name: string
  description?: string
  url?: string
  subcategories?: sourceCategory[]
}

export interface Category {
  id: number
  name: string
}

export interface CategorySchema {
  itemListElement: Category[]
}

export interface Image {
  fullscreen: string
  image: string
  thumbnail: string
  zoom: string
}

interface Size {
  name: string
}

export type ProductArticleDetails = Record<string, ProductArticleDetailsInfo> & {
  colors: colorAttributes
};

interface ProductArticleDetailsInfo {
  url: string
  productAttributes: ProductAttributes
  images: Image[]
  sizes: Size[]
  whitePriceValue: string
  redPriceValue: string
  name: string
  rgb: string
}

export interface ProductAttributes {
  values: Record<string, ProductAttributesValues>
}
export interface ProductAttributesValues {
  articleNumber: string
  careInstructions: string[]
  composition: string[]
  countryOfProductionMessage: boolean
  customerCare: string
  description: string
  detailedDescriptions: string[]
  disclaimer: string
  fits: string[]
  garmentLength: string[]
  imported: string
  manufacturedDate: string
  material: string[]
  priceDetails: string
  productCountryOfProduction: string
  waistRise: string
  yearOfProduction: string
}

export interface colorAttributes {
  name: string
  options: colorOption[] | any[]
}

interface colorOption {
  name: string
  value: string
}
