const { default: Bugsnag } = require('@bugsnag/js');

module.exports.createUserResponse = ({ ok, user = null, error = null }) => {
  if (error) Bugsnag.notify(error);
  return {
    ok,
    user,
    error,
  };
};

module.exports.createFriendsResponse = ({
  ok,
  friends = null,
  error = null,
}) => {
  if (error) Bugsnag.notify(error);
  return {
    ok,
    friends,
    error,
  };
};

module.exports.createGeneralResponse = ({
  ok,
  message = null,
  error = null,
}) => {
  if (error) Bugsnag.notify(error);
  return {
    ok,
    message,
    error,
  };
};

module.exports.createAuthenticationResponse = ({
  ok,
  token = null,
  refreshToken = null,
  user = null,
  error = null,
}) => {
  if (error) Bugsnag.notify(error);
  return {
    ok,
    token,
    refreshToken,
    user,
    error,
  };
};

module.exports.createProductsResponse = ({
  ok,
  products = null,
  error = null,
  searchText = null,
}) => {
  if (error) Bugsnag.notify(error);
  return {
    ok,
    products,
    error,
  };
};
module.exports.createCompaniesResponse = ({
  ok,
  companies = null,
  error = null,
  searchText = null,
}) => {
  if (error) Bugsnag.notify(error);
  return {
    ok,
    companies,
    error,
  };
};
module.exports.createCompanyResponse = ({
  ok,
  company = null,
  error = null,
}) => {
  if (error) Bugsnag.notify(error);
  return {
    ok,
    company,
    error,
  };
};

module.exports.createCategoriesResponse = ({
  ok,
  categories = null,
  error = null,
}) => {
  if (error) Bugsnag.notify(error);
  return {
    ok,
    categories,
    error,
  };
};

module.exports.createProductTypesResponse = ({
  ok,
  productTypes = null,
  error = null,
  searchText = null,
}) => {
  if (error) Bugsnag.notify(error);
  return {
    ok,
    productTypes,
    error,
  };
};

module.exports.createCompanyResponseResponse = ({
  ok,
  companyResponse = null,
  error = null,
}) => {
  if (error) Bugsnag.notify(error);

  return {
    ok,
    companyResponse,
    error,
  };
};
module.exports.createCompanyResponsesResponse = ({
  ok,
  companyResponses = null,
  error = null,
}) => {
  if (error) Bugsnag.notify(error);
  return {
    ok,
    companyResponses,
    error,
  };
};
