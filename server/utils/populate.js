module.exports.companyPopulate = [
  {
    path: 'parentCompanies',
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
  {
    path: 'politicalContributions',
  },
];
module.exports.companyResponsePopulate = {
  path: 'company',
  populate: this.companyPopulate,
};

module.exports.companyResponsesPopulate = {
  path: 'companyResponses',
  populate: this.companyResponsePopulate,
};

module.exports.friendshipPopulate = [
  {
    path: 'requester',
    select: 'username firstName lastName',
  },
  { path: 'recipient', select: 'username firstName lastName' },
];
