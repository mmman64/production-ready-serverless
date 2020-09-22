const AWS = require('aws-sdk');
AWS.config.region = 'eu-west-2';
const cognito = new AWS.CognitoIdentityServiceProvider();

const an_authenticated_user = async user => {
  let req = {
    UserPoolId: process.env.cognito_user_pool_id,
    Username: user.username,
  };

  await cognito.adminDeleteUser(req).promise();

  console.log(`[${user.username}] - user deleted`);
};

module.exports = {
  an_authenticated_user,
};
