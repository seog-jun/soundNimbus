const express = require("express");
const app = express();
const path = require("path");
const musicData = require("./musicData.js");

const HTTP_PORT = process.env.port || 8080;
const onHTTPStart = () => {
  console.log(`Express server is listening on port ${HTTP_PORT}🚀`);
};

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect("/home");
});

app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/index.html"));
});

app.get("/about", (req, res) => {
  res.send("hello about");
});

app.get("/lyrics", (req, res) => {
  musicData
    .getAlbums()
    .then((data) => {
      res.json(data); // =res.send(data);
    })
    .catch((error) => {
      console.log(error);
      res.status(404).send("ERROR!");
    });
});

app.get("/lyrics/:id", (req, res) => {
  musicData
    .getAlbums()
    .then((data) => {
      //   res.send(req.params.id]); // res.params.id is coming from end point that I write after /lyrics/123
      // resolved promise Data[id from request params].field
      res.send(data[req.params.id - 1].lyrics);
    })
    .catch((error) => {
      console.log(error);
      res.status(404).send("ERROR!");
    });
});

app.get("/music", (req, res) => {
  res.send("hello music");
});

app.use((req, res) => {
  res.status(404).send("PAGE NOT FOUND!!");
});

app.listen(8080, onHTTPStart);
