const express = require("express");
const router = express.Router();
const path = require("path");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const fs = require("fs");
const url = require("url");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/client/index.html"));
});
app.use("/", router);

/*Post meta data*/
app.post("/get-preview", async (req, res, next) => {
  const { previewUrl } = req.body;

  const resp = await fetch(previewUrl).catch(error => {
    res.status(500).json({ message: "Your URL is probably INVALID" });
  });
  if (!resp) return next();

  const html = await resp.text();
  const $ = cheerio.load(html);

  const getMetaTag = name => {
    return (
      $(`meta[name=${name}]`).attr("content") ||
      $(`meta[name="og:${name}"]`).attr("content") ||
      $(`meta[name="twitter:${name}"]`).attr("content") ||
      $(`meta[property=${name}]`).attr("content") ||
      $(`meta[property="og:${name}"]`).attr("content") ||
      $(`meta[property="twitter:${name}"]`).attr("content")
    );
  };

  const metaTagData = {
    url: previewUrl,
    domain: url.parse(previewUrl).hostname,
    title: getMetaTag("title") || $(`h1`).text(),
    img: getMetaTag("image") || "./images/no-image.png",
    description:
      getMetaTag("description") || $(`p`).text() || "No description available"
  };

  let { description } = metaTagData;

  // avoiding description to be more then 200 chars
  if (description.length > 200) {
    metaTagData.description = description.substring(0, 200) + "...";
  }

  return res.status(200).json(metaTagData);
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}/`)
);
