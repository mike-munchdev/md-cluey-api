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
    obj.parentCompanies = company.parentCompanies.map((p) => {
      p.id = p._id;
      return p;
    });
  }

  if (company.tags) {
    obj.tags = company.tags.map((t) => {
      t.id = t._id;
      return t;
    });
  }

  if (company.politicalContributions) {
    obj.politicalContributions = company.politicalContributions.map((pc) => {
      pc.id = pc._id;
      return pc;
    });
  }

  return obj;
};
