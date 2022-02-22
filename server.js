const express = require("express");
const app = express();

const env = require("dotenv");
env.config(); // which indicates root directory (.env)

const path = require("path");
const musicData = require("./musicData.js");

const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

const exphbs = require("express-handlebars");
const { Z_STREAM_END } = require("zlib");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
  secure: true,
});

const HTTP_PORT = process.env.PORT;
const onHTTPStart = () => {
  console.log(`Express server is listening on port ${HTTP_PORT}🚀`);
};

app.use(express.static("public"));

// for form data without file
// app.use(express.urlencoded({ extended: true }));

// multer middleware
const upload = multer();

// handle bars
app.engine(".hbs", exphbs.engine({ extname: ".hbs", defaultLayout: "main" }));
app.set("view engine", ".hbs");

app.get("/", (req, res) => {
  res.redirect("/home");
});

app.get("/home", (req, res) => {
  // res.sendFile(path.join(__dirname, "/views/index.html"));

  musicData.getAlbums().then((data) => {
    res.render("index", {
      data: data,
      layout: "main",
    });
  });
});

app.get("/music", (req, res) => {
  musicData.getAlbums().then((data) => {
    res.json(data);
  });
});
app.get("/about", (req, res) => {
  res.send("hello about");
});

// app.get("/lyrics", (req, res) => {
//   musicData
//     .getAlbums()
//     .then((data) => {
//       res.json(data); // =res.send(data);
//     })
//     .catch((error) => {
//       console.log(error);
//       res.status(404).send("ERROR!");
//     });
// });

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

app.get("/info/:id", (req, res) => {
  musicData
    .getAlbums()
    .then((data) => {
      //   res.send(req.params.id]); // res.params.id is coming from end point that I write after /lyrics/123
      // resolved promise Data[id from request params].field
      res.send(data[req.params.id - 1]);
    })
    .catch((error) => {
      console.log(error);
      res.status(404).send("ERROR!");
    });
});

app.get("/albums", (req, res) => {
  // res.sendFile(path.join(__dirname, "/views/albums.html"));
  res.render("albums", {
    data: null,
    layout: "main",
  });
});

app.post("/albums/new", upload.single("photo"), (req, res) => {
  let streamUpload = (req) => {
    return new Promise((resolve, reject) => {
      let stream = cloudinary.uploader.upload_stream((error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      });

      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });
  };

  async function upload(req) {
    let result = await streamUpload(req);
    console.log(result);
    return result;
  }

  upload(req).then((uploaded) => {
    req.body.imagePath = uploaded.url;
    console.log(req.body);

    musicData
      .addAlbum(req.body)
      .then((data) => {
        res.redirect("/home");
      })
      .catch((error) => {
        res.status(500).send(error);
      });

    //res.send(JSON.stringify(req.body));
    // req.body.featureImage = uploaded.url;
  });
});

app.use((req, res) => {
  res.status(404).send("PAGE NOT FOUND!!");
});

//app.listen(8080, onHTTPStart);
musicData
  .initialize()
  .then(() => {
    app.listen(HTTP_PORT, onHTTPStart);
  })
  .catch((msg) => {
    console.log(msg);
  });
