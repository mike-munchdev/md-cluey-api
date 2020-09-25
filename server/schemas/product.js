const { gql } = require('apollo-server-express');

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type Product {
    id: ID!
    name: String!
    productType: ProductType!
    tags: [Tag!]
    brand: Company
  }
  type Tag {
    id: ID!
    name: String!
  }
  type ProductType {
    id: ID!
    name: String!
  }
  type ProductsResponse {
    ok: Boolean!
    products: [Product!]
    error: Error
    searchText: String
  }
  type Query {
    getProductsByName(name: String!, exact: Boolean): ProductsResponse
  }
`;

module.exports = typeDefs;
