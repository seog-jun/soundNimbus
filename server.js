const express = require("express");
const app = express();

const env = require("dotenv");
env.config(); // which indicates root directory (.env)

const path = require("path");
const musicData = require("./musicData.js");
const userData = require("./userData");

const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const clientSessions = require("client-sessions");

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
app.use(express.urlencoded({ extended: true }));

app.use(
  clientSessions({
    cookieName: "session",
    secret: "soundNimbus9001April162022TopSecretPassword",
    duration: 10 * 60 * 1000, // 2minutes
    activeDuration: 1000 * 60, //
  })
);

app.use(function (req, res, next) {
  res.locals.session = req.session;
  next();
});

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

// multer middleware
const upload = multer();

// handle bars
app.engine(".hbs", exphbs.engine({ extname: ".hbs", defaultLayout: "main" }));
app.set("view engine", ".hbs");

app.get("/", (req, res) => {
  res.redirect("/home");
});

app.get("/home", (req, res) => {
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
app.get("/about", function (req, res) {
  res.render("about", {
    data: null,
    layout: "main",
  });
});

app.get("/albums/new", ensureLogin, (req, res) => {
  res.render("albums", {
    data: null,
    layout: "main",
  });
});

app.get("/albums/delete/:id", ensureLogin, (req, res) => {
  musicData
    .deleteAlbum(req.params.id)
    .then(() => {
      res.redirect("/home");
    })
    .catch((error) => {
      console.log(error);
      res.status(505).send("ERROR!");
    });
});

app.post("/albums/new", ensureLogin, upload.single("photo"), (req, res) => {
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
      .then(() => {
        res.redirect("/home");
      })
      .catch((error) => {
        res.status(500).send(error);
      });
  });
});

app.get("/songs/new", ensureLogin, (req, res) => {
  musicData.getAlbums().then((data) => {
    res.render("songs", {
      data: data,
      layout: "main",
    });
  });
});

app.post("/songs/new", ensureLogin, upload.single("song"), (req, res) => {
  let streamUpload = (req) => {
    return new Promise((resolve, reject) => {
      let stream = cloudinary.uploader.upload_stream(
        { resource_type: "raw" },
        (error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        }
      );

      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });
  };

  async function upload(req) {
    let result = await streamUpload(req);
    console.log(result);
    return result;
  }

  upload(req).then((uploaded) => {
    req.body.musicPath = uploaded.url;
    console.log(req.body);

    musicData
      .addSong(req.body)
      .then(() => {
        res.redirect("/home");
      })
      .catch((error) => {
        res.status(500).send(error);
      });
  });
});

app.get("/songs/:id", ensureLogin, (req, res) => {
  musicData.getSongsByAlbumID(req.params.id).then((data) => {
    res.render("albumSongs", {
      data: data,
      layout: "main",
    });
  });
});

app.get("/songs/delete/:id", ensureLogin, (req, res) => {
  musicData
    .deleteSong(req.params.id)
    .then(() => {
      res.redirect("/home");
      // res.redirect(`/songs/${data.albumID}`);
    })
    .catch((error) => {
      console.log(error);
      res.status(505).send("ERROR!");
    });
});

app.get("/login", (req, res) => {
  res.render("login", {
    layout: "main",
  });
});
app.post("/login", (req, res) => {
  req.body.userAgent = req.get("User-Agent");
  userData
    .checkUser(req.body)
    .then((mongoData) => {
      req.session.user = {
        userName: mongoData.userName,
        email: mongoData.email,
        loginHistory: mongoData.loginHistory,
      };

      console.log("userData:" + mongoData);
      console.log(req.session);
      res.redirect("/home");
    })
    .catch((error) => {
      res.render("login", {
        errorMessage: error,
        userName: req.body.userName,
      });
    });
});

app.get("/logout", function (req, res) {
  req.session.reset();
  res.redirect("/");
});

app.get("/register", (req, res) => {
  res.render("register", {
    layout: "main",
  });
});

app.post("/register", (req, res) => {
  userData
    .registerUser(req.body)
    .then(() => {
      res.render("register", {
        successMessage: "USER CREATED",
      });
    })
    .catch((error) => {
      res.render("register", {
        userName: req.body.userName,
        errorMessage: error,
      });
    });
});

app.use((req, res) => {
  res.render("404.hbs", { data: null, layout: null });
});

musicData
  .initialize()
  .then(userData.initialize)
  .then(() => {
    app.listen(HTTP_PORT, onHTTPStart);
  })
  .catch((error) => {
    console.log(error);
  });
