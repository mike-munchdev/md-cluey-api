module.exports.transformCompany = (company) => {
  //Rename fields

  company.id = company._id;

  if (company.productTypes) {
    company.productTypes = company.productTypes.map((c) => {
      c.id = c._id;

      return c;
    });
  }

  if (company.categories) {
    company.categories = company.categories.map((c) => {
      return this.transformParentCompany(c);
    });
  }

  if (company.parentCompanies) {
    const parentCompanies = company.parentCompanies.map((p) =>
      this.transformParentCompany(p)
    );
    company.parentCompanies = parentCompanies;
  }

  if (company.tags) {
    company.tags = company.tags.map((t) => {
      t.id = t._id;

      return t;
    });
  }

  return company;
};

module.exports.transformParentCompany = (parentCompany) => {
  parentCompany.id = parentCompany._id;
  if (parentCompany.politicalContributions) {
    parentCompany.politicalContributions = parentCompany.politicalContributions.map(
      (p) => {
        p.id = p._id;
        return p;
      }
    );
  }

  return parentCompany;
};
