const { gql } = require("apollo-server");

// Schema
const typeDef = gql`
  type Query {
    obtenerCurso: String
  }
`;

module.exports = typeDef;
