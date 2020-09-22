const { expect } = require('chai');
const { init } = require('../steps/init');
const when = require('../steps/when');

describe(`When we invoke the GET /restaurants endpoint`, () => {
  before(async () => await init());

  it(`Should return an array of 8 restaurants`, async () => {
    const res = await when.we_invoke_get_restaurants();

    expect(res.status).to.equal(200);
    expect(res.data).to.have.lengthOf(8);

    for (let restaurant of res.data) {
      expect(restaurant).to.have.property('name');
      expect(restaurant).to.have.property('image');
    }
  });
});
