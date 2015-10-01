/**
 * Created by El-PC on 19/09/2015.
 */
var users = require("./users");
var chat_room = require("./chatRoom");
var chat_room_messages = require("./chatRoomMessages");
var generics = require("./generics");
var pm = require("./PM");

exports.USERS = users;
exports.CHAT_ROOM = chat_room;
exports.CHAT_ROOM_MESSAGES = chat_room_messages;
exports.GENERICS = generics;
exports.PRIVATE_MESSANGING = pm;