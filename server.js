var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var cheerio = require("cheerio");

var db = require("./models");

var PORT = 3000;

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

mongoose.Promise = Promise;
mongoose.connect("mongodb://localhost/foodnetwork", {
  useMongoClient: true
});

var MONGODB_URI = process.env.MONGODB_URI || "damp-hamlet-63724";

app.get("/scrape", function(req, res) {
  request("http://www.foodnetwork.com", (function(error, response) {
    var $ = cheerio.load(response.data);

    $("article h2").each(function(i, element) {
      var result = {};

      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");

      db.Article
        .create(result)
        .then(function(dbArticle) {
          res.send("Scrape Complete");
        })
        .catch(function(err) {
          res.json(err);
        });
    });
  });
});

app.get("/articles", function(req, res) {
  db.Article
    .find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.get("/articles/:id", function(req, res) {
  db.Article
    .findOne({ _id: req.params.id })
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.post("/articles/:id", function(req, res) {
  db.Note
    .create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.listen(3000, function() {
  console.log("App running on port 3000");
});
