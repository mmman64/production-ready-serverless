const fs = require('fs');
const axios = require('axios');
const Mustache = require('mustache');
const aws4 = require('../lib/aws4');
const URL = require('url');

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
  await aws4.init();
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
