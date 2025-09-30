const express = require('express');
const Click = require('../models/Click');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Clicks
 *   description: Click tracking
 */

/**
 * @swagger
 * /api/clicks/{urlId}:
 *   get:
 *     summary: Get clicks for a URL
 *     tags: [Clicks]
 *     parameters:
 *       - in: path
 *         name: urlId
 *         required: true
 *         schema:
 *           type: string
 *         description: URL ID
 *     responses:
 *       200:
 *         description: List of clicks
 */
router.get('/:urlId', async (req, res) => {
  const { urlId } = req.params;
  try {
    const clicks = await Click.find({ urlId });
    res.json(clicks);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/clicks:
 *   post:
 *     summary: Add a click record
 *     tags: [Clicks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               urlId:
 *                 type: string
 *               city:
 *                 type: string
 *               country:
 *                 type: string
 *               device:
 *                 type: string
 *     responses:
 *       201:
 *         description: Click added successfully
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res) => {
  const { urlId, city, country, device } = req.body;
  try {
    const click = new Click({
      urlId,
      city,
      country,
      device,
    });
    await click.save();
    res.status(201).json({ message: 'Click added successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
