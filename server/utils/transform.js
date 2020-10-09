module.exports.transformCompany = (company) => {
  //Rename fields

  let obj = company;

  obj.id = company._id;

  if (company.productTypes) {
    obj.productTypes = company.productTypes.map((c) => {
      c.id = c._id;
      return c;
    });
  }

  if (company.categories) {
    obj.categories = company.categories.map((c) => {
      c.id = c._id;
      return c;
    });
  }

  if (company.parentCompanies) {
    const parentCompanies = company.parentCompanies.map((p) => {
      return this.transformParentCompany(p);
    });
    obj.parentCompanies = parentCompanies;
  }

  if (company.tags) {
    obj.tags = company.tags.map((t) => {
      t.id = t._id;
      return t;
    });
  }

  return obj;
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
