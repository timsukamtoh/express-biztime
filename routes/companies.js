"use strict";

const express = require('express');

const { NotFoundError } = require("../expressError");
const router = new express.Router();

const db = require("../db");

/**
 * the “get list of companies should return”:
 * {companies: [{code, name}, ...]}
*/
router.get("/", async function (req, res, next) {
  const results = await db.query(
    `SELECT code, name
            FROM companies`);

  return res.json({ companies: results.rows });
});

/**
 * Get a single company by its code:
 * {company: {code, name, description}}
*/
router.get("/:code", async function (req, res, next) {
  const { code } = req.params;

  const results = await db.query(
    `SELECT code, name, description
            FROM companies
            WHERE $1 = code`,
    [code]
  );
  const company = results.rows[0];
  if (!company) throw new NotFoundError(`Not found: ${code}`);

  return res.json({ company });
});

/**
 * Create a company in the database and return its JSON:
 * {company: {code, name, description}}
*/
router.post("/", async function (req, res, next) {
  const { code, name, description } = req.body;

  const results = await db.query(
    `INSERT INTO companies (code, name, description)
           VALUES ($1, $2, $3)
           RETURNING code, name, description`,
    [code, name, description],
  );
  const company = results.rows[0];

  return res.status(201).json({ company });
});

/**
 * Update a company in the database and return its JSON:
 * {company: {code, name, description}}
*/
router.put("/:code", async function (req, res, next) {
  const { name, description } = req.body;
  const { code } = req.params;

  const results = await db.query(
    `UPDATE companies
           SET name=$1,
               description=$2
           WHERE code = $3
           RETURNING code, name, description`,
    [name, description, code],
  );
  const company = results.rows[0];
  if (!company) throw new NotFoundError(`Not found: ${code}`);

  return res.status(201).json({ company });
});

/**
 * Delete a company in the db and return JSON:
 * { status: "Deleted" }
*/
router.delete("/:code", async function (req, res, next) {
  const { code } = req.params;
  const results = await db.query(
    `DELETE
          FROM companies
          WHERE code = $1
          RETURNING code, name, description`,
    [code],
  );

  const company = results.rows[0];
  if (!company) throw new NotFoundError(`Not found: ${code}`);

  return res.json({ status: "Deleted" });
});

module.exports = router;