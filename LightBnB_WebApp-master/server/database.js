// const properties = require('./json/properties.json');
// const users = require('./json/users.json');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

// const properties = pool.database.properties;
// const users = pool.database.users;

pool.query(`Select title FROM properties LIMIT 10;`)
.then(response => {console.log(response)});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
//this function is not working
  return pool 
    .query(
      `SELECT * FROM users WHERE email = $1;`,[email])
    .then((result) => {
      console.log("get user with email results", result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool 
    .query(
      `SELECT * FROM users WHERE id = $1;`,[id])
    .then((result) => {
      console.log("get user by id results", result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  return pool 
    .query(
      `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *;`,[user.name, user.email, user.password])
    .then((result) => {
      console.log("add user result", result.rows);
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.stack);
    });

}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit) {
  return pool
    .query(
      `SELECT reservations.*, properties.*, avg(rating) as average_rating
      FROM reservations
      JOIN properties ON reservations.property_id = properties.id
      JOIN property_reviews ON properties.id = property_reviews.property_id
      WHERE reservations.guest_id = $1
      GROUP BY properties.id, reservations.id, properties.title, cost_per_night
      ORDER BY reservations.start_date DESC
      LIMIT $2`, [guest_id, limit])
      .then((result) => {
        console.log("get all reservations result", result.rows);
        return result.rows;
      })
      .catch((err) => {
        console.log(err.message);
      });
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
  //set up array to hold parameters
  const queryParams = [];
  //start the query with all info that comes before WHERE
  let queryString = `
    SELECT properties.*, avg(property_reviews.rating) as average_rating
    FROM properties
    JOIN property_reviews ON properties.id = property_id
    `;
  //check if a city has been passed in as an option
  //add the city to the query params and create a WHERE clause for the city
  //use .length of array to get $n--since it is first parameter, will be $1
  if (options.city) {
    queryParams.push(`%${options.city}%`);//%syntax for LIKE clause must be part of parameter, not query
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }

  if (options.owner_id) {
    queryParams.push(`%${options.owner_id}%`);
    queryString += `WHERE owner_id LIKE $${queryParams.length}`;
  }

  if (options.minimum_price_per_night) {
    queryParams.push(options.minimum_price_per_night * 100);
    if (queryParams.length === 1) {
      queryString += `WHERE cost_per_night > $${queryParams.length}`;
    } else {
      queryString += `AND cost_per_night > $${queryParams.length}`;
    }
  }

  if (options.maximum_price_per_night) {
    queryParams.push(options.maximum_price_per_night * 100);
    if (queryParams.length === 1) {
      queryString += `WHERE cost_per_night$ < $${queryParams.length}`;
    } else {
      queryString += `AND cost_per_night < $${queryParams.length}`;
    }
  }
  //add any query that comes after the WHERE clause
  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;
  //console.log just to see if everything is right
  console.log("queryString", queryString, "queryParams", queryParams);
  //run the query
  return pool.query(queryString, queryParams).then((res) => res.rows);
};

exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
 const addProperty = function(property) {
  return pool 
  .query(
    `INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *;`,
    [property.owner_id, property.title, property.description, property.thumbnail_photo_url, property.cover_photo_url, property.cost_per_night, property.street, property.city, property.province, property.post_code, property.country, property.parking_spaaces, property.number_of_bathrooms, property.number_of_bedrooms])
  .then((result) => {
    console.log("add property result", result.rows);
    return result.rows[0];
  })
  .catch((err) => {
    console.log(err.stack);
  });
}
//   const propertyId = Object.keys(properties).length + 1;
//   property.id = propertyId;
//   properties[propertyId] = property;
//   return Promise.resolve(property);
 
exports.addProperty = addProperty;
