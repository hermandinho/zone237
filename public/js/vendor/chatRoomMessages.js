/**
 * Created by El-PC on 22/09/2015.
 */
var db = require("../DB").db_connexion;

var postMessage = function (message, room, by, callable) {
    var d = new Date();
    var date = d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();

    db.query("INSERT INTO chat_room_message(Chat_Room_Message_By,Id_Chat_Room,Chat_Room_Message_Content,Chat_Room_Message_Date) VALUES("+by+","+room+",'"+message+"','"+date+"')", function (err, res) {
      if(err){
          callable(false);
          throw err;
      }else{
          callable(true);
      }
    });
};

var loadMessages = function (room, callback) {
    db.query("SELECT * FROM chat_room_message,chat_room,users WHERE chat_room_message.Chat_Room_Message_By = users.Id_User" +
              " AND chat_room_message.Id_Chat_Room = chat_room.Id_Chat_Room AND chat_room.Id_Chat_Room = "+room+"", function (err, rows, fields) {
        var messages = [];
        if(err){
            callback(false);
            throw err;
        }else{
            for(var i=0;i<rows.length;i++){
                messages.push(rows[i]);
            }
            callback(messages);
        }
    });
};

exports.postMessage = postMessage;
exports.loadMessage = loadMessages;