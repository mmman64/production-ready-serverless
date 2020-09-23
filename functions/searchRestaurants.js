const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

module.exports.handler = async event => {
  const req = event.body ? JSON.parse(event.body) : JSON.parse(event.data);

  const restaurants = await findRestaurantsByTheme(
    req.theme,
    defaultResultsCount
  );

  return {
    statusCode: 200,
    body: JSON.stringify(restaurants),
  };
};

const defaultResultsCount = process.env.defaultResultsCount || 8;
const tableName = process.env.restaurants_table;

const findRestaurantsByTheme = async (theme, count) => {
  const req = {
    TableName: tableName,
    Limit: count,
    FilterExpression: 'contains(themes, :theme)',
    ExpressionAttributeValues: { ':theme': theme },
  };

  const res = await dynamoDB.scan(req).promise();

  return res.Items;
};
