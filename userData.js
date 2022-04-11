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
    if (userData.password === userData.password2) {
      //bcrpt.hash(userData.password,10).then((hash)=>{
      // userData.password = hash
      //
      //})
      let newUser = new User(userData);
      newUser.save((err) => {
        if (err) {
          console.log(err);
          reject("Error creating new user:" + err);
        } else {
          console.log(newUser);
          resolve(newUser);
        }
      });
    } else {
      reject("PASSWORD DO NOT MATCH!!");
    }
  });
};

module.exports.verifyLogin = function (userData) {
  return new Promise((resolve, reject) => {
    User.findOne({ username: userData.username })
      .exec()
      .then((mongoData) => {
        // bcrpyt.compare(userData.password,mongoData.password).then((result)=>{
        //   if(reuslt == true){
        //    login successful stuff
        //}
        //})
        if (mongoData.password === userData.password) {
          console.log("SUCCESSFUL LOGIN");

          mongoData.loginHistory.push({
            dateTime: new Date(),
            userAgent: userData.userAgent,
          });
          User.updateOne(
            { username: mongoData.username },
            { $set: { loginHistory: mongoData.loginHistory } }
          )
            .exec()
            .then(() => {
              resolve(mongoData);
            });
        } else {
          reject("LOGIN UNSUCCESSFUL - PASSWORD INCORRECT");
        }
      })
      .catch((error) => {
        console.log(error);
        reject("LOGIN UNSUCCESSFUL - ERROR:" + error);
      });
  });
};
