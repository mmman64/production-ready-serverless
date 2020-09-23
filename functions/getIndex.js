const fs = require('fs');
const axios = require('axios');
const Mustache = require('mustache');
const aws4 = require('aws4');
const URL = require('url');
const awscred = require('awscred');
const { promisify } = require('util');

// populated by Lambda runtime automatically
const awsRegion = process.env.AWS_REGION;
// these need to be passed via Lambda as environment variables
const cognitoUserPoolId = process.env.cognito_user_pool_id;
const cognitoClientId = process.env.cognito_client_id;
const restaurantsApiEndpoint = process.env.restaurants_api_endpoint;
const days = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

module.exports.handler = async event => {
  const template = loadHtml();
  const restaurants = await getRestaurants();
  const dayOfWeek = days[new Date().getDay()];

  const view = {
    dayOfWeek,
    restaurants,
    awsRegion,
    cognitoUserPoolId,
    cognitoClientId,
    searchUrl: `${restaurantsApiEndpoint}/search`,
  };

  const html = Mustache.render(template, view);

  return {
    statusCode: 200,
    // overriding API Gateway's default JSON content type
    headers: {
      'content-type': 'text/html; charset=UTF-8',
    },
    body: html,
  };
};

// cache html after 1st invocation
let html;

const loadHtml = () => {
  if (!html) {
    html = fs.readFileSync('static/index.html', 'utf-8');
  }

  return html;
};

const getRestaurants = async () => {
  const url = URL.parse(restaurantsApiEndpoint);
  const opts = {
    host: url.hostname,
    path: url.pathname,
  };

  // aws4 used for signing doesn't support aws profiles so we need to manually grab values
  if (!process.env.aws_access_key_ID) {
    const { credentials } = await promisify(awscred.load)();

    process.env.aws_access_key_ID = credentials.accessKeyId;
    process.env.AWS_SECRET_ACCESS_KEY = credentials.secretAccessKey;

    if (credentials.sessionToken) {
      process.env.AWS_SESSION_TOKEN = credentials.sessionToken;
    }
  }
  console.log('AWS credentials loaded');

  // adds headers to sign the request
  aws4.sign(opts);

  const httpReqOpts = {
    Host: opts.headers['Host'],
    'X-Amz-Date': opts.headers['X-Amz-Date'],
    Authorization: opts.headers['Authorization'],
  };

  // for assumed role with temporary credentials (not available when running locally)
  if (opts.headers['X-Amz-Security-Token']) {
    httpReqOpts['X-Amz-Security-Token'] = opts.headers['X-Amz-Security-Token'];
  }

  try {
    const { data } = await axios.get(restaurantsApiEndpoint, {
      headers: httpReqOpts,
    });

    return data;
  } catch (err) {
    console.log(`This is the error!`, err);
  }
};
