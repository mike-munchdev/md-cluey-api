const { gql } = require('apollo-server-express');

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type Company {
    id: ID!
    name: String!
    brandUrl: String
    brandLogoUrl: String
    parentCompanies: [ParentCompany!]
    productTypes: [ProductType!]
    categories: [Category!]
  }

  type CompaniesResponse {
    ok: Boolean!
    companies: [Company!]
    error: Error
    searchText: String
  }
  type CompanyResponse {
    ok: Boolean!
    company: Company!
    error: Error
  }

  type Query {
    getCompaniesByName(name: String!, exact: Boolean): CompaniesResponse!
    getCompaniesByCategory(id: String!): CompaniesResponse!
    getCompaniesByProductType(id: String!): CompaniesResponse!
    getCompanyById(id: String!): CompanyResponse!
  }
`;

module.exports = typeDefs;
