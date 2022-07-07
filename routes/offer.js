const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary");

const Offer = require("../models/Offer");
const isAuthenticated = require("../middlewares/isAuthenticated");

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      //   console.log(req.headers.authorization);
      const { title, description, price, condition, city, brand, size, color } =
        req.body;
      // console.log(req.body);
      //   console.log(req.files);
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          {
            MARQUE: brand,
          },
          {
            TAILLE: size,
          },
          {
            ÉTAT: condition,
          },
          {
            COULEUR: color,
          },
          {
            EMPLACEMENT: city,
          },
        ],
        owner: req.user,
      });

      if (req.files) {
        const result = await cloudinary.uploader.upload(
          convertToBase64(req.files.picture)
        );
        newOffer.product_image = result;
      }

      await newOffer.save();
      res.json(newOffer);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// router.get("/offers", async (req, res) => {
//   try {
// FIND avec une regexp
// const regexp = /T-shirt/i;
// const regexp = new RegExp("Bleu", "i");
// const offers = await Offer.find({ product_name: regexp }).select(
//   "product_name product_price -_id"
// );

// FIND avec un fourchette de prix
// const offers = await Offer.find({
//   product_price: {
//     $lte: 150,
//     $gte: 50,
//   },
// }).select("product_name product_price -_id");

// SORT
// const offers = await Offer.find()
//   .sort({
//     product_price: -1,
//   })
//   .select("product_name product_price -_id");

// ON PEUT TOUT CHAINER
// const offers = await Offer.find({
//   product_name: new RegExp("T-shirt", "i"),
//   product_price: {
//     $gte: 15,
//     $lte: 25,
//   },
// })
//   .sort({
//     product_price: 1,
//   })
//   .select("product_name product_price -_id");

// LIMIT: le nombre de résultats à envoyer au client
// SKIP: le nombre de résultats que l'on ignore avant de compter ceux que l'on va envoyer au client

//     const offers = await Offer.find()
//       .skip(15)
//       .limit(5)
//       .select("product_name product_price -_id");

//     res.json(offers);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// });

router.get("/offers", async (req, res) => {
  try {
    const filters = {};
    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i");
    }
    if (req.query.priceMin) {
      filters.product_price = {
        $gte: Number(req.query.priceMin),
      };
    }
    if (req.query.priceMax) {
      // filters.product_price = {
      //   $lte: Number(req.query.priceMax),
      // };
      if (filters.product_price) {
        filters.product_price.$lte = Number(req.query.priceMax);
      } else {
        filters.product_price = {
          $lte: Number(req.query.priceMax),
        };
      }
    }
    // console.log(filters.product_price);

    const sort = {};
    if (req.query.sort === "price-desc") {
      sort.product_price = -1; // "desc"
    } else if (req.query.sort === "price-asc") {
      sort.product_price = 1; // "asc"
    }

    let limit = 5;
    if (req.query.limit) {
      limit = req.query.limit;
    }

    let page = 1;
    if (req.query.page) {
      page = req.query.page;
    }

    // 10 res par page = 1) skip 0, 2) skip 10, 3) skip 20
    // 3 res par page = 1) skip 0, 2) skip 3, 3) skip 6

    const skip = (page - 1) * limit;

    const results = await Offer.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const count = await Offer.countDocuments(filters);

    res.json({ count: count, offers: results });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate(
      "owner",
      "account"
    );
    res.json(offer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
