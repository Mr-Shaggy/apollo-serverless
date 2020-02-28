const arc = require('@architect/functions')
const { ApolloServer, gql } = require('apollo-server-lambda')
const uuid = require('uuid')
const ItemProvider = require("./itemprovider-mongodb").ItemProvider
const itemProvider = new ItemProvider()

const typeDefs = gql`
type Query {
  student(sid: ID): Student
  allStudents: [Student]
  search(field: String, query: String, sort: String, direction: Int): [Student]
}
type Mutation {
  addStudent(input: StudentInput): Student
  updateStudent(input: StudentInput): Student
  deleteStudent(input: DeleteInput): DeleteResponse
}
type DeleteResponse {
  ok: Boolean
  deletedCount: Int
}
input DeleteInput {
  sid: ID
}
input StudentInput {
  name: NameInput
  dob: String
  picture: PictureInput
  location: LocationInput
  phone: String
  cell: String
  email: String
  major: String
  gpa: String
  registered: Int
  sid: ID
  modified: Float
  modifiedby: String
}
input NameInput {
  first: String
  last: String
}
input PictureInput {
  large: String
}
input LocationInput {
  street: String
  city: String
  state: String
  postcode: String
}
type Student {
  name: Name
  dob: String
  picture: Picture
  location: Location
  phone: String
  cell: String
  email: String
  registered: String
  major: String
  gpa: String
  sid: ID!
  modified: String
  modifiedby: String
}
type Name {
  first: String
  last: String
}
type Picture {
  large: String
}
type Location {
  street: String
  city: String
  state: String
  postcode: String
}
`

itemProvider.open(function (err, db) { console.log(err, db) })

const resolvers = {
  Query: {
    student(_, { sid }, context, info) {
      return itemProvider.findOne({
        collection: "students",
        query: { sid: sid },
        limit: 0,
        sort: {},
        fields: {}
      })
    },
    allStudents() {
      return itemProvider.findItems(
        {
          collection: "students",
          query: {},
          limit: 0,
          sort: {},
          fields: {}
        })
    },
    search(_, { field, query, sort, direction = 1 }) {
      return itemProvider.findItems(
        {
          collection: "students",
          query: { [field]: { $regex: query } },
          limit: 0,
          sort: { [sort]: direction },
          fields: {}
        })
    }
  },
  Mutation: {
    addStudent(_, { input: student }) {
      console.log(student)
      student.sid = uuid.v4()
      student.modified = student.registered = Date.now()
      student.dob = new Date(student.dob)
      return itemProvider.saveItem({
        collection: 'students',
        student
      })
    },
    updateStudent(_, { input: student }) {
      student.modified = Date.now()
      return itemProvider.updateItem({
        collection: 'students',
        query: { sid: student.sid },
        action: { $set: student }
      })
    },
    deleteStudent(_, { input: { sid } }) {
      return itemProvider.deleteItem({
        collection: 'students',
        query: { sid: sid }
      })
    }
  }
}

const server = new ApolloServer({ typeDefs, resolvers })
const handler = server.createHandler({
  cors: {
    origin: '*',
    credentials: true,
  }
})

exports.handler = function (event, context, callback) {
  const body = arc.http.helpers.bodyParser(event)
  // Body is now parsed, re-encode to JSON for Apollo
  event.body = JSON.stringify(body)
  handler(event, context, callback)
}
