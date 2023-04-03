const router = require("express").Router();
const Item = require("../models/Item");
const path = require("path");
const multer = require("multer");
const Reviews = require("../models/Review");
//MULTER CONFIG
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "Images");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Check if the file type is an image
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"));
    }
    cb(null, true);
  },
});
//create an Item
router.post("/", upload.array("images", 3), async (req, res, next) => {
  const url = req.protocol + "://" + req.get("host");
  const newItem = new Item({
    title: req.body.title,
    desc: req.body.desc,
    img: url + "/Images/" + req.files[0].filename,
    img2: url + "/Images/" + req.files[1].filename,
    img3: url + "/Images/" + req.files[2].filename,
    rating: req.body.rating,
    price: req.body.price,
    quantity: req.body.quantity,
    category: req.body.category,
    brand: req.body.brand,
  });
  try {
    const savedItem = await newItem.save();
    res.status(200).json(savedItem);
  } catch (err) {
    next(err);
  }
});

//get a single item

router.get("/:id", async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    res.status(200).json(item);
  } catch (err) {
    next(err);
  }
});

//UPDATE ITEM

router.put("/:id", async (req, res, next) => {
  try {
    const editedItem = await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json(editedItem);
  } catch (err) {
    next(err);
  }
});

//DELETE ITEM
router.delete("/:id", async (req, res, next) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    await Reviews.deleteMany({ publicationId: req.params.id });
    res.status(200).json("Item deleted");
  } catch (err) {
    next(err);
  }
});

//get items by category
router.get("/", async (req, res, next) => {
  try {
    const page = req.query.page || 1;
    const perPage = 12;
    const category = req.query.category;
    if (category !== "all") {
      //update the count each time the category changes

      const items = await Item.find({
        category: category,
        price: { $gte: req.query.min, $lte: req.query.max },
      })
        .skip((page - 1) * parseInt(perPage))
        .limit(parseInt(perPage));
      const count = await Item.countDocuments({});

      res.status(200).json({ items, count });
    } else if (category === "all") {
      const items = await Item.find({
        price: { $gte: req.query.min, $lte: req.query.max },
      })
        .skip((page - 1) * parseInt(perPage))
        .limit(parseInt(perPage));
      const count = await Item.countDocuments({});
      res.status(200).json({ items, count });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
