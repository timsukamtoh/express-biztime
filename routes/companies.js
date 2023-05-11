"use strict";

const express = require('express')

const { NotFoundError } = require("../expressError")
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

  return res.json({companies: results.rows})
});

/**
 * the “get list of companies should return”:
 * {company: [{code, name, description}, ...]}
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
  return res.json({company});
});

module.exports = router;