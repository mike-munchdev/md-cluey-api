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
    politicalContributions: [PoliticalContributions!]
    categories: [Category!]
    isActive: Boolean
  }

  type CompaniesResolverResponse {
    ok: Boolean!
    companies: [Company!]
    error: Error
    searchText: String
  }
  type CompanyResolverResponse {
    ok: Boolean!
    company: Company
    error: Error
  }

  type Query {
    getCompaniesByName(
      name: String!
      exact: Boolean
    ): CompaniesResolverResponse!
    getCompaniesByCategory(id: String!): CompaniesResolverResponse!
    getCompaniesByProductType(id: String!): CompaniesResolverResponse!
    getCompanyById(id: String!): CompanyResolverResponse!
  }
`;

module.exports = typeDefs;
