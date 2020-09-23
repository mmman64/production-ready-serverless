const AWS = require('aws-sdk');
AWS.config.region = 'eu-west-2';
const cognito = new AWS.CognitoIdentityServiceProvider();
const chance = require('chance').Chance();

// needs number, special char, upper and lower case
const random_password = () => `${chance.string({ length: 8 })}B!gM0uth`;

const an_authenticated_user = async () => {
  const userpoolId = process.env.cognito_user_pool_id;
  const clientId = process.env.cognito_server_client_id;

  const firstName = chance.first();
  const middleName = chance.first();
  const lastName = chance.last();
  const username = `test-${firstName}-${middleName}-${lastName}`;
  const password = random_password();
  const email = `${username}@big-mouth.com`;

  // create authenticated user
  const createReq = {
    UserPoolId: userpoolId,
    Username: username,
    MessageAction: 'SUPPRESS', // stop congnito sending email to user
    TemporaryPassword: password,
    UserAttributes: [
      { Name: 'given_name', Value: firstName },
      { Name: 'family_name', Value: lastName },
      { Name: 'email', Value: email },
    ],
  };
  await cognito.adminCreateUser(createReq).promise();

  console.log(`[${username}] - user is created`);

  // initiate auth flow
  const req = {
    AuthFlow: 'ADMIN_NO_SRP_AUTH',
    UserPoolId: userpoolId,
    ClientId: clientId,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
    },
  };
  const resp = await cognito.adminInitiateAuth(req).promise();

  console.log(`[${username}] - initialised auth flow`);

  const challengeReq = {
    UserPoolId: userpoolId,
    ClientId: clientId,
    ChallengeName: resp.ChallengeName,
    Session: resp.Session,
    ChallengeResponses: {
      USERNAME: username,
      NEW_PASSWORD: random_password(),
    },
  };

  // set a new password for user
  const challengeResp = await cognito
    .adminRespondToAuthChallenge(challengeReq)
    .promise();

  console.log(`[${username}] - responded to auth challenge`);

  return {
    username,
    firstName,
    lastName,
    idToken: challengeResp.AuthenticationResult.IdToken,
  };
};

module.exports = {
  an_authenticated_user,
};
