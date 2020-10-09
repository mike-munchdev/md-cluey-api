module.exports.companyResponse = {
  path: 'company',
  populate: [
    {
      path: 'parentCompanies',
      populate: {
        path: 'politicalContributions',
      },
    },
    {
      path: 'productTypes',
    },
    {
      path: 'categories',
    },
    {
      path: 'tags',
    },
  ],
};

module.exports.companyResponsesPopulate = {
  path: 'companyResponses',
  populate: this.companyResponse,
};
