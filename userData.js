var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const env = require("dotenv");
env.config();

var userSchema = new Schema({
  username: {
    type: String,
    unique: true,
  },
  password: String,
  email: String,
  loginHistory: [
    {
      dateTime: Date,
      userAgent: String,
    },
  ],
});

let User;

module.exports.initialize = function () {
  return new Promise((resolve, reject) => {
    let db = mongoose.createConnection(process.env.MONGO_URI_STRING);

    db.on("error", (err) => {
      reject(err); // reject the promise with the provided error
    });
    db.once("open", () => {
      User = db.model("users", userSchema); // Regitster the User Model using the userSchema
      resolve();
    });
  });
};

module.exports.registerUser = function (userData) {
  return new Promise((resolve, reject) => {
    if (userData.paasword === userData.password2) {
      let newUser = new User(userData);
      newUser.save((err) => {
        if (err) {
          console.log(err);
        } else {
          console.log(newUser);
          resolve(newUser);
        }
      });
    }

    // if (userData) {
    //   console.log(userData);
    //   resolve();
    // } else {
    //   reject();
    // }
  });
};
