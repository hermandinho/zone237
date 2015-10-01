/**
 * Created by El-PC on 20/09/2015.
 */
var db = require("../DB").db_connexion;

var addChatRoom = function (data, callable) {
    db.query("SELECT * FROM chat_room WHERE Name_Chat_Room = '"+data.data.Name_Chat_Room+"'", function (err, rows, fields) {
        if(err) throw err;

        if(rows.length > 0){
            callable("ROOM_EXISTS");
        }else{
            //console.log(data);
            //data = data.data;

            var name = data.data.Name_Chat_Room,
                rules = data.data.Rules_Chat_Room,
                rules = data.data.Rules_Chat_Room,
                owner= data.Owner_Chat_Room,
                logo = data.data.Logo_Chat_Room,
                type = data.data.Chat_Room_Type,
                date = data.Created_On,
                max_u = data.data.Chat_Room_Max_Users;

            var tmp = "'"+name+"','"+rules+"',"+owner+",'"+date+"','"+logo+"','"+type+"','"+max_u+"'";
            db.query("INSERT INTO chat_room(Name_Chat_Room,Rules_Chat_Room,Owner_Chat_Room,Created_On,Logo_Chat_Room,Chat_Room_Type," +
                "Chat_Room_Max_Users) VALUES("+tmp+")", function (err, res) {

                if(err) {
                    callable("NEW_ROOM_ERR");
                    throw err;
                }else{
                    callable("NEW_ROOM_SUCCESS");
                }
            });
        }

    });
}


var getPublicRooms = function (user,callable) {
    db.query("SELECT * FROM chat_room WHERE Chat_Room_Type='public'", function (err, rows, fields) {
        //callable(rows);
        getUserRooms(user,rows, function (res) {
            callable(res);
        });
    });
};

var getUserRooms = function (user, data,callable) {
    for(var i= 0;i<data.length;i++){
        var j=0;
        var X = checkIfInRoom(user,data[i].Id_Chat_Room, function (r) {
            if(r == true){
                data[j].IS_MINE = true;
                callable(data[j]);
            }else{
                data[j].IS_MINE = false;
                callable(data[j]);
            }
            j++;
        });
    }
};
function checkIfInRoom(user,room,callable){
    db.query("SELECT * FROM chat_room_users WHERE Id_User = "+user+" AND Id_Chat_Room = "+room+"", function (err, results, f) {
        if(results.length > 0){
            callable(true);
        }else{
            callable(false);
        }
    });
}

var joinRoom = function (user,room,callable) {
    var d = new Date();
    var date = d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
    db.query("INSERT INTO chat_room_users (Id_User,Id_Chat_Room,Join_Room_Date) VALUES("+user+","+room+",'"+date+"')", function (err, res) {
        if(err){
            callable(false);
            throw err;
        }else{
            callable(true);
        }
    });
};

var leaveRoom = function (room, user,callback) {
    db.query("DELETE FROM chat_room_users WHERE Id_User = "+user+" AND Id_Chat_Room = "+room+"", function (err, res) {
        if(err){
            callback(false);
            throw err;
        }else{
            callback(true);
        }
    });
};

exports.addRoom = addChatRoom;
exports.loadPublicRooms = getPublicRooms;
exports.joinRoom = joinRoom;
exports.leaveRoom = leaveRoom;