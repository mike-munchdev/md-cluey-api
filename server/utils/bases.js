const { default: Bugsnag } = require('@bugsnag/js');
const axios = require('axios').default;
const fs = require('fs');
const asyncForEach = require('./asyncForEach');
const connectDatabase = require('../models/connectDatabase');
const Products = require('../models/Product');
const ProductType = require('../models/ProductType');
const Product = require('../models/Product');
const Company = require('../models/Company');
const Tag = require('../models/Tag');
const { getDomainNameBrandUrl } = require('./url');
const Category = require('../models/Category');
const User = require('../models/User');
const user = require('../resolvers/user');
const path = require('path');

const base = require('airtable').base('appQMsMsx6eE2CMWF');

const bases = [
  'Personal Care & Beauty',
  'Health & Nutrition',
  'Pet Care',
  'Household Goods',
  'Baby & Kids',
  'Outdoors & Backyard',
  'Furniture, Home Appliances, Bed, & Bath',
  'Electronics',
  'Grocery',
];

// #1
module.exports.importCategories = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      await connectDatabase();
      // Product Types

      await asyncForEach(bases, async (b, index, array) => {
        try {
          await Category.create({
            name: b,
          });
        } catch (error) {
          console.error(error);
        }
      });

      console.log('Done.');

      resolve();
    } catch (error) {
      Bugsnag.notify(error);
      reject(error);
    }
  });
};

// #6
module.exports.importProducts = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      await connectDatabase();
      // Product
      await asyncForEach(
        bases.filter((b) => b === 'Personal Care & Beauty'),
        async (b, index, array) => {
          try {
            console.log('Getting products from base:', b);
            const records = await base(b).select({ view: 'Grid view' }).all();
            await asyncForEach(records, async (record, index, array) => {
              if (record.fields['Product Name']) {
                // create product
                const product = new Product({
                  name: record.fields['Product Name'],
                });

                // get tags if any
                if (
                  record.fields['Product Tags'] &&
                  record.fields['Product Tags'].length > 0
                ) {
                  const tags = await Tag.find({
                    name: { $in: record.fields['Product Tags'] },
                  });
                  product.tags = tags;
                }

                // get brand
                if (record.fields['Search by name (primary query)']) {
                  const brand = await Company.findOne({
                    name: record.fields['Search by name (primary query)'],
                  });
                  product.brand = brand;
                }

                // get product type
                if (record.fields['Product Type']) {
                  const productType = await ProductType.findOne({
                    name: record.fields['Product Type'],
                  });

                  product.productType = productType;
                }

                await product.save();
              }
            });
          } catch (error) {
            console.error(error);
          }
        }
      );
      console.log('Done.');

      resolve();
    } catch (error) {
      Bugsnag.notify(error);
      reject(error);
    }
  });
};

// #4
module.exports.importParentCompanies = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      await connectDatabase();
      // Parent Company(ies)
      let companies = [];
      await asyncForEach(
        bases.filter((b) => b === 'Personal Care & Beauty'),
        async (b, index, array) => {
          try {
            console.log('Getting brands from base:', b);
            const records = await base(b).select({ view: 'Grid view' }).all();
            records.forEach(async (record) => {
              // create company
              if (record.fields['Parent Company(ies)']) {
                const companiesFiltered = record.fields['Parent Company(ies)']
                  .map((p) => {
                    return companies.findIndex(
                      (company) => company.name === p
                    ) < 0
                      ? {
                          name: p,
                        }
                      : null;
                  })
                  .filter((p) => p !== null);

                companies = [...companies, ...companiesFiltered];
              }
            });
          } catch (error) {
            console.error(error);
          }
        }
      );
      const uniqueCompanies = companies.map((c) => ({
        name: c.name,
        brandUrl: c.brandUrl,
      }));
      await Company.insertMany(uniqueCompanies);
      console.log('Done.');

      resolve();
    } catch (error) {
      Bugsnag.notify(error);
      reject(error);
    }
  });
};

// #3
module.exports.importCompanies = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      await connectDatabase();
      // Search by name (primary query)
      let brands = [];
      await asyncForEach(
        bases.filter((b) => b === 'Personal Care & Beauty'),
        async (b, index, array) => {
          const currentCategory = await Category.findOne({ name: b });
          try {
            console.log('Getting companies from base:', b);
            const records = await base(b).select({ view: 'Grid view' }).all();
            await asyncForEach(records, async (record, index, array) => {
              // create brand
              if (record.fields['Search by name (primary query)']) {
                let existingCompany = await Company.findOne({
                  name: record.fields['Search by name (primary query)'],
                });

                if (!existingCompany) {
                  console.log(
                    `adding new company ${record.fields['Search by name (primary query)']}`
                  );
                  existingCompany = new Company({
                    name: record.fields['Search by name (primary query)'],
                  });

                  // add brand url
                  if (record.fields['Brand URL']) {
                    existingCompany.brandUrl = record.fields['Brand URL'];
                  }

                  // add parent companies
                  if (
                    record.fields['Parent Company(ies)'] &&
                    record.fields['Parent Company(ies)'].length > 0
                  ) {
                    const parentCompanies = await Company.find({
                      name: { $in: record.fields['Parent Company(ies)'] },
                    });
                    existingCompany.parentCompanies = parentCompanies;
                  }
                  // add category
                  const existingCategory = existingCompany.categories.find(
                    (c) => {
                      console.log('c', c);
                      return c.id === currentCategory._id;
                    }
                  );

                  if (!existingCategory) {
                    existingCompany.categories.push(currentCategory.id);
                  }

                  await existingCompany.save();
                }

                if (record.fields['Product Type']) {
                  const currentProductType = await ProductType.findOne({
                    name: record.fields['Product Type'],
                  });

                  const existingProductType = await Company.findOne({
                    _id: existingCompany.id,
                    productTypes: currentProductType._id,
                  });

                  if (!existingProductType) {
                    existingCompany.productTypes.push(currentProductType._id);
                    await existingCompany.save();
                  }
                }
              }
            });
          } catch (error) {
            console.log('error adding company', error);
            // console.error(error);
          }
        }
      );

      console.log('Done.');

      resolve();
    } catch (error) {
      console.log('importBrands: error', error);
      Bugsnag.notify(error);
      reject(error);
    }
  });
};

// #5
module.exports.importTags = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      await connectDatabase();
      // Product Types
      let tags = [];
      await asyncForEach(
        bases.filter((b) => b === 'Personal Care & Beauty'),
        async (b, index, array) => {
          try {
            console.log('Getting tags from base:', b);
            const records = await base(b).select({ view: 'Grid view' }).all();
            records.forEach(async (record) => {
              // create company
              if (record.fields['Product Tags']) {
                tags = [...tags, ...record.fields['Product Tags']];
              }
            });
          } catch (error) {
            console.error(error);
          }
        }
      );
      const uniqueTags = [...new Set(tags)].map((t) => ({ name: t }));
      await Tag.insertMany(uniqueTags);
      console.log('Done.');

      resolve();
    } catch (error) {
      Bugsnag.notify(error);
      reject(error);
    }
  });
};

// #2
module.exports.importProductTypes = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      await connectDatabase();
      // Product Types
      let productTypes = [];
      await asyncForEach(
        bases.filter((b) => b === 'Personal Care & Beauty'),
        async (b, index, array) => {
          try {
            const category = await Category.findOne({ name: b });
            console.log('Getting product types from base:', b);
            const records = await base(b).select({ view: 'Grid view' }).all();
            await asyncForEach(records, async (record, index, array) => {
              if (record.fields['Product Type']) {
                let productType = await ProductType.findOne({
                  name: record.fields['Product Type'],
                });

                if (!productType) {
                  productType = await ProductType.create({
                    name: record.fields['Product Type'],
                  });
                }

                const existingProductType = await User.findOne({
                  _id: user._id,
                  productTypes: productType._id,
                });

                if (!existingProductType) {
                  category.productTypes.push(productType._id);
                  await category.save();
                }
              }
            });
          } catch (error) {
            console.error(error);
          }
        }
      );

      console.log('Done.');
      resolve();
    } catch (error) {
      Bugsnag.notify(error);
      reject(error);
    }
  });
};

module.exports.importLogos = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      const companies = await Company.find({
        brandUrl: { $ne: null },
        brandLogoUrl: { $eq: null },
      });
      await asyncForEach(companies, async (company, index, array) => {
        try {
          const brandNameUrl = getDomainNameBrandUrl(company.brandUrl);
          console.log(
            `starting image lookup for ${company.name} with for ${brandNameUrl}`
          );
          const riteKitResponse = await axios.get(
            `https://api.ritekit.com/v2/company-insights/logo?domain=${brandNameUrl}&client_id=bfa908bdd61498f0359b33d67de29ec128ba65c7bb09`
          );

          // console.log('riteKitResponse', riteKitResponse.data);
          if (riteKitResponse.data.url) {
            const imageResponse = await axios.get(riteKitResponse.data.url, {
              responseType: 'stream',
            });
            imageResponse.data.pipe(
              fs.createWriteStream(
                path.join(
                  __dirname,
                  '../../',
                  'public/logos',
                  `${brandNameUrl}.png`
                )
              )
            );
          }
          console.log(`saving ${company.name} image ${brandNameUrl}.png`);
          await Company.findOneAndUpdate(
            { _id: company._id },
            { brandLogoUrl: `${brandNameUrl}.png` }
          );

          console.log(`done with ${company.name}`);
        } catch (error) {
          console.log('error', error);
        }
      });
      console.log(`Done.`);
      resolve();
    } catch (error) {
      console.log('error', error);
      reject(error);
    }
  });
};
