/**
 * @author wpatterson
 */
const C = require('./config.js')
const MongoClient = require('mongodb').MongoClient

const ItemProvider = function() {}

// Connection URL
const url = C.host

const errorResponse = { ok: false, error: 'Oops something went wrong!' }

// Open connection to DB server
ItemProvider.prototype.open = function(cb) {
  MongoClient.connect(url, { useUnifiedTopology: true }, (err, client) => {
    if (err) {
      this.err = err
      cb(err)
    } else {
      const db = client.db(C.name)
      this.db = db
      cb(null, db)
    }
  })
}

// find items in collection
ItemProvider.prototype.findItems = function ({ collection, query, limit, sort, fields }) {
  let coll = {}
  try {
    coll = this.db.collection(collection)
  } catch(err) {
    return Promise.reject(this.err)
  }
  return new Promise((resolve, reject) => {
    coll.find(query).project(fields).sort(sort || { _id: -1 }).limit(limit || 0).toArray((err, results) =>{
      if (err) {
        reject(errorResponse)
      } else {
        resolve(results)
      }
    })
  })

}

// find single item
ItemProvider.prototype.findOne = function ({ collection, query }) {
  const coll = this.db.collection(collection)
  return new Promise((resolve, reject) => {
    coll.find(query).limit(1).toArray((err, results) => {
      if (err) {
        reject(errorResponse)
      } else {
        resolve(results[0])
      }
    })
  })
}

// save item or items
ItemProvider.prototype.saveItem = function ({ collection, student }) {
  const coll = this.db.collection(collection)
  return coll.insertOne(student)
    .then(({ result }) => {
      if (result.ok && result.nModified > 0) {
        return this.findOne({ collection, query: { sid: student.sid }})
      } else {
        return errorResponse
      }
    })
    .catch(() => errorResponse)
}

// update item or items
ItemProvider.prototype.updateItem = function({ collection, query, action }) {
  const coll = this.db.collection(collection)
  return coll.updateOne(
      query,
      action
    ).then(({ result }) => {
      if(result.ok && result.nModified > 0) {
        return this.findOne({ collection, query })
      } else {
        return errorResponse
      }
    })
    .catch(() => errorResponse)
}

// delete item or items
ItemProvider.prototype.deleteItem = function ({ collection, query }) {
  const coll = this.db.collection(collection)
  return coll.deleteOne(query)
    .then(res => res)
    .catch(() => errorResponse)
}

exports.ItemProvider = ItemProvider