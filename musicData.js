const fs = require("fs");

let albums = [];

module.exports.getAlbums = function () {
  return new Promise((resolve, reject) => {
    fs.readFile("./data/albums.json", "utf-8", (error, data) => {
      if (error) {
        reject(error);
      } else {
        albums = JSON.parse(data);
        console.log(albums);
        resolve(albums);
      }
    });
  });
};
