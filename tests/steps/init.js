const awscred = require('../../lib/awscred');
const { promisify } = require('util');

let initialised = false;

const init = async () => {
  if (initialised) {
    return;
  }

  process.env.AWS_REGION = 'eu-west-2';
  process.env.restaurants_table = 'restaurants';
  process.env.cognito_client_id = 'mock_value';
  process.env.cognito_user_pool_id = 'eu-west-2_81YnpSexP';
  process.env.cognito_server_client_id = '39kperd6g8ac7cru67b6md93ei';
  process.env.restaurants_api_endpoint =
    'https://v3kvmcrg7f.execute-api.eu-west-2.amazonaws.com/dev/restaurants';

  // aws4 used for signing doesn't support aws profiles so we need to manually grab values
  if (!process.env.AWS_ACCESS_KEY_ID) {
    const { credentials } = await promisify(awscred.load)();

    process.env.AWS_ACCESS_KEY_ID = credentials.accessKeyId;
    process.env.AWS_SECRET_ACCESS_KEY = credentials.secretAccessKey;

    if (credentials.sessionToken) {
      process.env.AWS_SESSION_TOKEN = credentials.sessionToken;
    }
  }
  console.log('AWS credentials loaded');

  initialised = true;
};

module.exports = {
  init,
};
