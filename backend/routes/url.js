const express = require('express');
const { query, body, validationResult } = require('express-validator');
const Url = require('../models/Url');
const { authorizeRoles } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: URLs
 *   description: URL management
 */

/**
 * @swagger
 * /api/urls:
 *   get:
 *     summary: Get URLs for the authenticated user with search, sort, and pagination
 *     tags: [URLs]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for title or originalUrl
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, title]
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of URLs
 */
router.get('/', async (req, res) => {
  const userId = req.user.id;
  const { search, sortBy = 'createdAt', order = 'desc', page = 1, limit = 10 } = req.query;

  const query = { userId };
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { originalUrl: { $regex: search, $options: 'i' } },
    ];
  }

  try {
    const urls = await Url.find(query)
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Url.countDocuments(query);

    res.json({
      data: urls,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/urls:
 *   post:
 *     summary: Create a new short URL
 *     tags: [URLs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - originalUrl
 *             properties:
 *               title:
 *                 type: string
 *               originalUrl:
 *                 type: string
 *               customUrl:
 *                 type: string
 *               expirationTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: URL created successfully
 */
router.post('/', [
  body('title').notEmpty(),
  body('originalUrl').isURL(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { title, originalUrl, customUrl, expirationTime } = req.body;
  const userId = req.user.id;

  try {
    // Check if customUrl exists for the same user
    if (customUrl) {
      const existing = await Url.findOne({ shortUrl: customUrl, userId });
      if (existing) {
        return res.status(400).json({ message: 'Custom URL already exists for this user' });
      }
    }

    // Generate shortUrl if not provided
    let shortUrl = customUrl;
    if (!shortUrl) {
      shortUrl = Math.random().toString(36).substr(2, 6);
      // Ensure uniqueness
      while (await Url.findOne({ shortUrl })) {
        shortUrl = Math.random().toString(36).substr(2, 6);
      }
    }

    const url = new Url({
      title,
      userId,
      originalUrl,
      customUrl: customUrl || null,
      shortUrl,
      expirationTime: expirationTime ? new Date(expirationTime) : null,
      is_temporary: expirationTime ? true : false,
    });

    await url.save();
    res.status(201).json(url);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/urls/{id}:
 *   delete:
 *     summary: Delete a URL by ID
 *     tags: [URLs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: URL ID
 *     responses:
 *       200:
 *         description: URL deleted successfully
 *       404:
 *         description: URL not found
 */
router.delete('/:id', async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const url = await Url.findOneAndDelete({ _id: id, userId });
    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }
    res.json({ message: 'URL deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/urls/{id}:
 *   put:
 *     summary: Update a URL by ID
 *     tags: [URLs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: URL ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               originalUrl:
 *                 type: string
 *               customUrl:
 *                 type: string
 *               expirationTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: URL updated successfully
 *       404:
 *         description: URL not found
 */
router.put('/:id', [
  body('title').optional().isString(),
  body('originalUrl').optional().isURL(),
  body('customUrl').optional().isString(),
  body('expirationTime').optional().isISO8601(),
], async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const updates = req.body;

  try {
    const url = await Url.findOne({ _id: id, userId });
    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    // Update fields
    if (updates.title !== undefined) url.title = updates.title;
    if (updates.originalUrl !== undefined) url.originalUrl = updates.originalUrl;
    if (updates.customUrl !== undefined) url.customUrl = updates.customUrl;
    if (updates.expirationTime !== undefined) url.expirationTime = new Date(updates.expirationTime);

    await url.save();
    res.json(url);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
