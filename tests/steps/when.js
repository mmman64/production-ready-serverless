const APP_ROOT = '../../';

const _ = require('lodash');
const aws4 = require('../../lib/aws4');
const URL = require('url');
const axios = require('axios');
const mode = process.env.TEST_MODE;

const signHttpRequest = (url, config) => {
  let urlData = URL.parse(url);
  let opts = {
    host: urlData.hostname,
    path: urlData.pathname,
  };

  aws4.sign(opts);

  const headers = {
    Host: opts.headers['Host'],
    'X-Amz-Date': opts.headers['X-Amz-Date'],
    Authorization: opts.headers['Authorization'],
  };

  // for assumed role with temporary credentials (not available when running locally)
  if (opts.headers['X-Amz-Security-Token']) {
    headers['X-Amz-Security-Token'] = opts.headers['X-Amz-Security-Token'];
  }

  config['headers'] = headers;
};

const viaHttp = async (relPath, method, opts) => {
  const root = process.env.TEST_ROOT;
  const url = `${root}/${relPath}`;
  console.log(`invoking via HTTP ${method} ${url}`);

  try {
    let config = {
      method,
      url,
    };

    // when making a post request to search by theme
    const data = _.get(opts, 'body');

    if (data) {
      config['data'] = data;
    }

    if (_.get(opts, 'iam_auth', false) === true) {
      signHttpRequest(url, config);
    }

    const authHeader = _.get(opts, 'auth');
    if (authHeader) {
      const headers = { Authorization: authHeader };
      config = {
        ...config,
        headers,
      };
    }

    const res = await axios(config);

    return {
      statusCode: res.status,
      headers: res.headers,
      body: res.data,
    };
  } catch (err) {
    if (err.status) {
      return {
        status: err.status,
        headers: err.response.headers,
      };
    } else {
      throw err;
    }
  }
};

const viaHandler = async (event, functionName) => {
  const handler = require(`${APP_ROOT}/functions/${functionName}`).handler;
  console.log(`invoking via handler function ${functionName}`);

  const context = {};
  const response = await handler(event, context);
  const contentType = _.get(
    response,
    'headers.content-type',
    'application/json'
  );

  if (response.body && contentType === 'application/json') {
    response.body = JSON.parse(response.body);
  }

  return response;
};

const we_invoke_get_index = async () => {
  const res =
    mode === 'handler'
      ? await viaHandler({}, 'getIndex')
      : await viaHttp('', 'GET');

  return res;
};

const we_invoke_get_restaurants = async () => {
  const res =
    mode === 'handler'
      ? await viaHandler({}, 'getRestaurants')
      : await viaHttp('restaurants', 'GET', { iam_auth: true });

  return res;
};

const we_invoke_search_restaurants = async (theme, user) => {
  const body = JSON.stringify({ theme });
  const auth = user.idToken;

  const res =
    mode === 'handler'
      ? viaHandler({ body }, 'searchRestaurants')
      : viaHttp('restaurants/search', 'POST', { body, auth });

  return res;
};

module.exports = {
  we_invoke_get_index,
  we_invoke_get_restaurants,
  we_invoke_search_restaurants,
};
