module.exports.transformCompany = (company) => {
  console.log('CompanySchema transform');
  //Rename fields

  company.id = company._id;

  if (company.productTypes) {
    company.productTypes = company.productTypes.map((c) => {
      c.id = c._id;
      // delete c._id;
      return c;
    });
  }

  if (company.categories) {
    company.categories = company.categories.map((c) => {
      c.id = c._id;
      // delete c._id;
      return c;
    });
  }

  if (company.parentCompanies) {
    company.parentCompanies = company.parentCompanies.map((c) => {
      c.id = c._id;
      if (c.politicalContributions) {
        c.politicalContributions = c.politicalContributions.map((p) => {
          p.id = p._id;
          return p;
        });
      }
      return c;
    });
  }

  return company;
};
