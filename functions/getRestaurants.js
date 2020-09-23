const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

module.exports.handler = async event => {
  const restaurants = await getRestaurants(defaultResultsCount);

  return {
    statusCode: 200,
    body: JSON.stringify(restaurants),
  };
};

const defaultResultsCount = process.env.defaultResultsCount || 8;
const tableName = process.env.restaurants_table;

const getRestaurants = async count => {
  const req = {
    TableName: tableName,
    Limit: count,
  };

  const res = await dynamoDB.scan(req).promise();

  return res.Items;
};
