"use strict";

const express = require('express');

const { NotFoundError, BadRequestError } = require("../expressError");
const router = new express.Router();

const db = require("../db");

/**
 * Get a list of invoices and return as JSON:
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
 * Get a single invoice by its id and return as JSON:
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

  if (!invoice) throw new NotFoundError(`Not found: ${id}`);

  const companyResults = await db.query(
    `SELECT code, name, description
            FROM companies
            WHERE $1 = code`,
    [invoice.comp_code]
  );
  invoice.company = companyResults.rows[0];


  //TODO: delete invoice.comp_code
  // return res.json({ invoice });
  return res.json({
    "invoice": {
      "id": invoice.id,
      "amt": invoice.amt,
      "paid": invoice.paid,
      "add_date": invoice.add_date,
      "paid_date": invoice.paid_date,
      "company": invoice.company
    }
  })
});

/**
 * Add an invoice to the database and return as JSON:
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
 * Update an invoice in the database and return as JSON:
 * {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
*/
router.put("/:id", async function (req, res, next) {
  const { amt } = req.body;
  const { id } = req.params;

  if (!amt) throw new BadRequestError('Invalid inputs');

  const results = await db.query(
    `UPDATE invoices
           SET amt=$1
           WHERE id = $2
           RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [amt, id],
  );
  const invoice = results.rows[0];

  if (!invoice) throw new NotFoundError(`Not found: ${id}`);

  return res.json({ invoice });
});

/**
 * Delete an invoice in the db and return status message as JSON:
 * { status: "Deleted" }
*/
router.delete("/:id", async function (req, res, next) {
  const { id } = req.params;

  const results = await db.query(
    `DELETE
          FROM invoices
          WHERE id = $1
          RETURNING id`,
    [id],
  );
  const invoice = results.rows[0];

  if (!invoice) throw new NotFoundError(`Not found: ${id}`);

  return res.json({ status: "Deleted" });
});

module.exports = router;