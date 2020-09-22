const { expect } = require('chai');
const { init } = require('../steps/init');
const when = require('../steps/when');
const cheerio = require('cheerio');

describe(`When we invoke the GET endpoint`, () => {
  before(async () => await init());

  it(`Should return the index page with 8 restaurants`, async () => {
    const res = await when.we_invoke_get_index();

    console.log(`This is res`, res);
    const $ = cheerio.load(res.data);
    const restaurants = $('.restaurant', '#restaurantsUl');

    expect(res.status).to.equal(200);
    expect(res.headers['content-type']).to.equal('text/html; charset=UTF-8');
    expect(res.data).to.not.be.null;
    expect(restaurants.length).to.equal(8);
  });
});
