"use strict";

const request = require("supertest");

const app = require("../app");

const db = require("../db");

/** Set up test company before each test */
let testCompany;

beforeEach(async function () {
  await db.query("DELETE FROM companies");
  let result = await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ('BBC',
    'Brians Big Company',
    'This is Brians company called Brians Big Company..')
    RETURNING code, name, description`);
  testCompany = result.rows[0];
  testCompany.invoices = [];
});

/** GET /companies - returns `{companies: [cat, ...]}` */

describe("GET /companies", function () {
  test("Gets list", async function () {
    const resp = await request(app).get(`/companies`);
    expect(resp.body).toEqual({
      companies: [{
        code: testCompany.code,
        name: testCompany.name
      }]
    });
  });
});

/** GET /companies/[code] - return data about one company: `{company: company}` */
describe("GET /companies/:code", function () {
  test("Gets single company", async function () {
    const resp = await request(app).get(`/companies/${testCompany.code}`);

    expect(resp.body).toEqual({ company: testCompany });
  });

  test("404 if not found", async function () {
    const resp = await request(app).get(`/companies/0`);
    expect(resp.statusCode).toEqual(404);
  });
});



/** POST /companies - create cat from data; return `{company: company}` */

describe("POST /companies", function () {
  test("Create new company", async function () {
    const resp = await request(app)
        .post(`/companies`)
        .send({code:"BBC2",
              name:"Brians Second Company",
              description:"He has 2!"});

    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({company: {
                                code:"BBBC2",
                                name:"Brians Second Company",
                                description:"He has 2!"}});
  });

  test("400 if empty request body", async function () {
    const resp = await request(app)
        .post(`/companies`)
        .send();
    expect(resp.statusCode).toEqual(400);
  });
});




afterAll(async function () {
  // close db connection --- if you forget this, Jest will hang
  await db.end();
});