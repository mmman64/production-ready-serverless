const aws4 = require('../../lib/aws4');

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

  await aws4.init();

  initialised = true;
};

module.exports = {
  init,
};
