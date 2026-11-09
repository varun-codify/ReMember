const express = require('express');
const router = express.Router();
const collectionController = require('../controllers/collectionController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', collectionController.getAllCollections);
router.get('/:id', collectionController.getCollection);
router.get('/:id/items', collectionController.getCollectionItems);
router.post('/', collectionController.createCollection);
router.put('/:id', collectionController.updateCollection);
router.delete('/:id', collectionController.deleteCollection);

module.exports = router;
