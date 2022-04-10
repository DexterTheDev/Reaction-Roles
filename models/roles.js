const { Schema, model } = require("mongoose");

module.exports = model(
  "reactionroles",
  new Schema({
    //String
    messageid: { type: String, default: "" },
    givenrole: { type: String, default: "" },
    removedrole: { type: String, default: "" },
    emote: { type: String, default: "" },
  })
);
