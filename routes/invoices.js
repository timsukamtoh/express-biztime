"use strict";

const express = require('express');

const { NotFoundError, BadRequestError } = require("../expressError");
const router = new express.Router();

const db = require("../db");

/**
 * Get a list of invoices:
 * {invoices: [{id, comp_code}, ...]}
*/
router.get("/", async function (req, res, next) {
  const results = await db.query(
    `SELECT id, comp_code
            FROM invoices
            ORDER BY id`);

  return res.json({ invoices: results.rows });
});

/**
 * Get a single invoice by its code:
 * {invoice: {id, comp_code, amt, paid, add_date, paid_date,
 *    company: {code, name, description}}
 * }
*/
router.get("/:id", async function (req, res, next) {
  const { id } = req.params;

  const invoiceResults = await db.query(
    `SELECT id, comp_code, amt, paid, add_date, paid_date
            FROM invoices
            WHERE $1 = id`,
    [id]
  );
  const invoice = invoiceResults.rows[0];

  const companyResults = await db.query(
    `SELECT code, name, description
            FROM companies
            WHERE $1 = code`,
    [invoice.comp_code]
  );
  invoice.company = companyResults.rows[0];

  if (!invoice) throw new NotFoundError(`Not found: ${id}`);

  return res.json({ invoice });
});

/**
 * Add an invoice to the database:
 * {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
*/
router.post("/", async function (req, res, next) {
  const { comp_code, amt } = req.body;

  if (!comp_code || !amt) throw new BadRequestError('Invalid inputs');

  const results = await db.query(
    `INSERT INTO invoices (comp_code, amt)
           VALUES ($1, $2)
           RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [comp_code, amt],
  );
  const invoice = results.rows[0];

  return res.status(201).json({ invoice });
});

/**
 * Update a invoice in the database and return its JSON:
 * {invoice: {code, name, description}}
*/
router.put("/:code", async function (req, res, next) {
  const { name, description } = req.body;
  const { code } = req.params;

  if (!name || !description) throw new BadRequestError('Invalid inputs');

  const results = await db.query(
    `UPDATE invoices
           SET name=$1,
               description=$2
           WHERE code = $3
           RETURNING code, name, description`,
    [name, description, code],
  );
  const invoice = results.rows[0];

  if (!invoice) throw new NotFoundError(`Not found: ${code}`);

  return res.json({ invoice });
});

/**
 * Delete a invoice in the db and return JSON:
 * { status: "Deleted" }
*/
router.delete("/:code", async function (req, res, next) {
  const { code } = req.params;
  const results = await db.query(
    `DELETE
          FROM invoices
          WHERE code = $1
          RETURNING code`,
    [code],
  );

  const invoice = results.rows[0];

  if (!invoice) throw new NotFoundError(`Not found: ${code}`);

  return res.json({ status: "Deleted" });
});

module.exports = router;