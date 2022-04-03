require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const shortid = require('shortid')
const dns = require('dns');


// Basic Configuration
const port = process.env.PORT || 3000;

const mongoose = require('mongoose')

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
const db = mongoose.connection
db.on("error", error => console.log(error))
db.once('open', () => console.log('Connected to Mongoose'))


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }))

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});


app.post("/api/shorturl", function (req, res) {
  const paramURL = req.body.url;
  const urlDomain = paramURL.match(/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)/igm);
  const finalParam = urlDomain[0].replace(/^https?:\/\//i, "");

  dns.lookup(finalParam, (err, addresses) => {
    if (err) {
      res.json({ error: 'invalid url' });
    } else {
      const newUrl = new ShortUrl({
        originalUrl: paramURL,
        shortUrl: shortid.generate(),
      });

      newUrl.save(function (err, newUrl) {
        if (err) return console.error(err);
        res.json({
          original_url: newUrl.originalUrl,
          short_url: newUrl.shortUrl,
        });
      });
    }
  });
});

// redirect shorturl api
app.get("/api/shorturl/:short_url", function (req, res) {
  const shortParam = req.params.short_url;
  
  const query = ShortUrl.findOne({ shortUrl: shortParam });
  query.select("originalUrl");

  query.exec(function (err, shorturl) {
    if (err) return console.error(err);

    if (!shorturl) {
      res.json({ error: 'url not found' });
    } else {
      const redirectUrl = shorturl.originalUrl.match(/^https?:\/\//i) ?
      shorturl.originalUrl :
      "https://" + shorturl.originalUrl;
      res.redirect(301, redirectUrl);
    }
  });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
