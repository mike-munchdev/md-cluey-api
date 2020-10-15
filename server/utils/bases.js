const { default: Bugsnag } = require('@bugsnag/js');
const axios = require('axios').default;
const fs = require('fs');
const fetch = require('node-fetch');

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
const ParentCompany = require('../models/ParentCompany');
const PoliticalContribution = require('../models/PoliticalContribution');

const Airtable = require('airtable');
const { camelizeKeys } = require('./case');
Airtable.configure({
  endpointUrl: 'https://api.airtable.com',
  apiKey: process.env.AIRTABLE_API_KEY,
});

const base = Airtable.base(process.env.AIRTABLE_BASE_ID);

const bases = [
  {
    name: 'Retailers & Marketplaces (COMPLETE)',
    isActive: true,
    logoUrl: 'retailers.jpg',
  },
  {
    name: 'Personal Care & Beauty (COMPLETE)',
    isActive: true,
    logoUrl: 'beauty.jpg',
  },
  { name: 'Health & Nutrition', isActive: false, logoUrl: 'health.jpg' },
  { name: 'Pet Care', isActive: false, logoUrl: 'pet-care.jpg' },
  {
    name: 'Household Goods (COMPLETE)',
    isActive: true,
    logoUrl: 'household.jpg',
  },
  { name: 'Baby & Kids', isActive: false, logoUrl: 'baby.jpg' },
  { name: 'Outdoors & Backyard', isActive: false, logoUrl: 'outdoors.jpg' },
  {
    name: 'Furniture, Home Appliances, Bed, & Bath',
    isActive: false,
    logoUrl: 'furniture.jpg',
  },
  { name: 'Electronics', isActive: false, logoUrl: 'electronics.jpg' },
  { name: 'Grocery (COMPLETE)', isActive: true, logoUrl: 'grocery.jpg' },
  {
    name: 'Dining & Entertainment (COMPLETE)',
    isActive: true,
    logoUrl: 'dining-entertainment.jpg',
  },
  {
    name: 'Apparel, Shoes, & Accessories',
    isActive: false,
    logoUrl: 'apparel.jpg',
  },
  {
    name: 'Parent Companies (COMPLETE)',
    isActive: true,
    logoUrl: 'parent-companies.jpg',
  },
];

const convertOpenSecretsData = (data) => {
  return data.map((d) => d['@attributes']);
};

const getOrgIdFromParentCompany = (parentCompany) => {
  return parentCompany.politicalContributions.length > 0
    ? parentCompany.politicalContributions[0].org_id
    : null;
};

function limiter(fn, wait) {
  let isCalled = false,
    calls = [];

  let caller = function () {
    if (calls.length && !isCalled) {
      isCalled = true;
      calls.shift().call();
      setTimeout(function () {
        isCalled = false;
        caller();
      }, wait);
    }
  };

  return function () {
    calls.push(fn.bind(this, ...arguments));
    // let args = Array.prototype.slice.call(arguments);
    // calls.push(fn.bind.apply(fn, [this].concat(args)));

    caller();
  };
}
// #1
module.exports.importCategories = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      await connectDatabase();
      // Product Types

      await asyncForEach(bases, async (b, index, array) => {
        try {
          const isActive = b.name.indexOf('(COMPLETE)') >= 0;
          await Category.findOneAndUpdate(
            {
              name: b.name.replace(' (COMPLETE)', ''),
            },
            {
              name: b.name.replace(' (COMPLETE)', ''),
              isActive,
              logoUrl: b.logoUrl,
            },
            { upsert: true }
          );
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
        bases.filter((b) => b.isActive),

        async (b, index, array) => {
          try {
            console.log('Getting products from base:', b);
            const records = await base(b.name)
              .select({ view: 'Grid view' })
              .all();
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

const populatePoliticalContributionsData = (cycle) => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(
        `https://www.opensecrets.org/api/?method=clueyOrgs&apikey=${process.env.OPEN_SECRETS_API_KEY}&cycle=${cycle}&output=json`
      );
      const json = await response.json();
      const data = convertOpenSecretsData(json.response.org);

      await asyncForEach(data, async (d) => {
        await PoliticalContribution.findOneAndUpdate(
          { org_id: d.org_id, cycle: d.cycle },
          { ...d },
          {
            upsert: true,
          }
        );
      });
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
// #1
module.exports.importPoliticalContributionData = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      await connectDatabase();

      populatePoliticalContributionsData(2020);
      populatePoliticalContributionsData(2018);
      populatePoliticalContributionsData(2016);

      resolve();
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });
};
// #2
module.exports.importParentCompanies = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      await connectDatabase();
      // Parent Company(ies)
      // console.log(
      //   'process.env.OPEN_SECRETS_API_KEY',
      //   process.env.OPEN_SECRETS_API_KEY
      // );

      await asyncForEach(
        bases.filter((b) => b.isActive),
        async (b, index, array) => {
          try {
            console.log('Getting parent companies from base:', b);
            const baseName = b.name.replace(' (COMPLETE)', '');
            const records = await base(b.name)
              .select({ view: 'Grid view' })
              .all();
            await asyncForEach(records, async (record, index, array) => {
              if (record.fields['Parent Company(ies)']) {
                // const orgs = [];
                // const orgIds = record.fields['OrgID(s)'];
                // // get political info

                await asyncForEach(
                  record.fields['Parent Company(ies)'],
                  async (parentCompany, index, array) => {
                    // find one and update
                    const parentCompanyDb = await ParentCompany.findOneAndUpdate(
                      { name: parentCompany },
                      {
                        name: parentCompany,
                      },
                      { upsert: true, new: true }
                    );
                  }
                );
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
      // console.log('error', error);
      Bugsnag.notify(error);
      reject(error);
    }
  });
};

// #4
module.exports.importCompanies = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      await connectDatabase();
      // Search by name (primary query)
      let brands = [];
      await asyncForEach(
        bases.filter((b) => b.isActive),

        async (b, index, array) => {
          const baseName = b.name.replace(' (COMPLETE)', '');
          const currentCategory = await Category.findOne({
            name: baseName,
          });
          try {
            console.log('Getting companies from base:', b);
            const records = await base(b.name)
              .select({ view: 'Grid view' })
              .all();

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
                    const brandNameUrl = getDomainNameBrandUrl(
                      record.fields['Brand URL']
                    );
                    existingCompany.brandUrl = record.fields['Brand URL'];
                    existingCompany.brandLogoUrl = `${brandNameUrl}.png`;
                  }

                  // add parent companies
                  if (
                    record.fields['Parent Company(ies)'] &&
                    record.fields['Parent Company(ies)'].length > 0
                  ) {
                    const parentCompanies = await ParentCompany.find({
                      name: { $in: record.fields['Parent Company(ies)'] },
                    });
                    existingCompany.parentCompanies = parentCompanies;
                  }

                  // add political contributions
                  if (
                    record.fields['OrgID(s)'] &&
                    record.fields['OrgID(s)'].length > 0
                  ) {
                    const politicalContributions = await PoliticalContribution.find(
                      {
                        org_id: { $in: record.fields['OrgID(s)'] },
                      }
                    );
                    existingCompany.politicalContributions = politicalContributions;
                  }
                  // add category
                  const existingCategory = existingCompany.categories.find(
                    (c) => {
                      console.log('c', c);
                      return c.id === currentCategory._id;
                    }
                  );
                  // console.log('existingCategory', existingCategory);
                  // console.log('currentCategory', currentCategory);

                  if (!existingCategory) {
                    existingCompany.categories.push(currentCategory.id);
                  }

                  existingCompany.isActive = true;
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
        bases.filter((b) => b.isActive),

        async (b, index, array) => {
          try {
            console.log('Getting tags from base:', b);
            const records = await base(b.name)
              .select({ view: 'Grid view' })
              .all();
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

// #3
module.exports.importProductTypes = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      await connectDatabase();
      // Product Types
      let productTypes = [];
      await asyncForEach(
        bases.filter((b) => b.isActive),
        async (b, index, array) => {
          try {
            const baseName = b.name.replace(' (COMPLETE)', '');
            const category = await Category.findOne({ name: baseName });
            console.log('Getting product types from base:', baseName);
            const records = await base(b.name)
              .select({ view: 'Grid view' })
              .all();
            await asyncForEach(records, async (record, index, array) => {
              if (record.fields['Product Type']) {
                let productType = await ProductType.findOne({
                  name: record.fields['Product Type'],
                });

                if (!productType) {
                  productType = await ProductType.create({
                    isActive: true,
                    name: record.fields['Product Type'],
                  });
                }

                const existingProductType = await Category.findOne({
                  _id: category._id,
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

module.exports.getMissingLogos = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const missingLogos = [];
      const companies = await Company.find({}).sort({ brandLogoUrl: 1 });
      await asyncForEach(companies, async (company, index, array) => {
        const brandNameUrl = getDomainNameBrandUrl(company.brandUrl);
        console.log(
          `starting image lookup for ${company.name} with for ${brandNameUrl}`
        );

        const imagePath = path.join(
          __dirname,
          '../../',
          'public/logos',
          `${brandNameUrl}.png`
        );
        // check for existing file
        const fileFound = fs.existsSync(imagePath);
        if (!fileFound) {
          missingLogos.push(`${brandNameUrl}.png`);
        }
      });
      const allFiles = missingLogos.join('\r\n');
      console.log(allFiles);
      const data = new Uint8Array(Buffer.from(allFiles));

      fs.writeFile(
        path.join(__dirname, '../../', 'public/logos', `missingLogos.txt`),
        data,
        (err) => {
          if (err) throw err;
          console.log('The file has been saved!');
        }
      );

      resolve();
    } catch (error) {
      console.log('error', error);
      reject(error);
    }
  });
};
const getLogoFromRiteKit = (company) => {
  return new Promise(async (resolve, reject) => {
    try {
      const brandNameUrl = getDomainNameBrandUrl(company.brandUrl);
      console.log(
        `starting image lookup for ${company.name} with for ${brandNameUrl}`
      );

      const imagePath = path.join(
        __dirname,
        '../../',
        'public/logos',
        `${brandNameUrl}.png`
      );
      // check for existing file
      const fileFound = fs.existsSync(imagePath);
      if (!fileFound) {
        const riteKitResponse = await axios.get(
          `https://api.ritekit.com/v2/company-insights/logo?domain=${brandNameUrl}&client_id=${process.env.RITE_KIT_CLIENT_ID}`
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
          { brandLogoUrl: `${brandNameUrl}.png`, isActive: true }
        );
      }
      console.log(`done with ${company.name}`);
      resolve();
    } catch (error) {
      console.log('error', error);
      reject(error);
    }
  });
};
// #7
module.exports.importLogos = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      (async () => {
        const getImagesLimited = limiter(async (companies) => {
          await asyncForEach(companies, async (company, index, array) => {
            // await getLogoFromRiteKit(company);
            await getLogoFromUplead(company);
          });
        }, 1000);

        const companies = await Company.find({
          // brandUrl: { $ne: null },
          // brandLogoUrl: { $eq: null },
        }).sort({ brandLogoUrl: 1 });
        let start = 0;

        const last = companies.length - 1;
        const batchSize = 6;
        let end = batchSize;
        while (end < last) {
          getImagesLimited(companies.slice(start, end));
          start = end;
          end += batchSize;
        }
      })();

      console.log(`Done.`);
      resolve();
    } catch (error) {
      console.log('error', error);
      reject(error);
    }
  });
};

const getLogoFromUplead = (company) => {
  return new Promise(async (resolve, reject) => {
    try {
      const brandNameUrl = getDomainNameBrandUrl(company.brandUrl);
      console.log(
        `starting image lookup for ${company.name} with for ${brandNameUrl}`
      );

      const imagePath = path.join(
        __dirname,
        '../../',
        'public/logos',
        `${brandNameUrl}.png`
      );
      // check for existing file
      const fileFound = fs.existsSync(imagePath);
      if (!fileFound) {
        const upLeadResponse = await axios.get(
          `https://logo.uplead.com/${brandNameUrl}`,
          {
            responseType: 'stream',
          }
        );

        upLeadResponse.data.pipe(
          fs.createWriteStream(
            path.join(
              __dirname,
              '../../',
              'public/logos',
              `${brandNameUrl}.png`
            )
          )
        );
        console.log(`saving ${company.name} image ${brandNameUrl}.png`);
        await Company.findOneAndUpdate(
          { _id: company._id },
          { brandLogoUrl: `${brandNameUrl}.png`, isActive: true }
        );
      }
      console.log(`done with ${company.name}`);
      resolve();
    } catch (error) {
      console.log('error', error);
      reject(error);
    }
  });
};
