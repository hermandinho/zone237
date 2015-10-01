/**
 * Created by El-PC on 19/09/2015.
 */
var db = require("../DB").db_connexion;

//console.log(typeof db);

var signIn = function(login,password,avatar,color,callable){

    db.query("SELECT * FROM users WHERE Login_User = '"+login+"'", function (err, rows, fields) {
        //db.end();
        if(err) { throw err; }

        if(rows.length > 0){
            console.log("Sign in Error : "+login+" is already assigned to another user");

            callable("LOGIN_ERR");
        }else{
            db.query("INSERT INTO users(Login_User,Password_User,Avatar_User,Color_User) VALUES('"+login+"','"+password+"','"+avatar+"','"+color+"')", function (err, result) {
                if(err) {
                    callable("SIGNUP_ERR");
                    throw err;
                }else{
                    var d = new Date();
                    var date = d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
                    db.query("INSERT INTO chat_room_users(Id_User,Id_Chat_Room,Join_Room_Date) VALUES("+result.insertId+",1,'"+date+"')", function (err, res) {
                        callable("SIGNUP_SUCCESS");
                    });
                    //console.log("Your Id is "+result.insertId);
                    callable("SIGNUP_SUCCESS");
                }
            });
        }
    });

};

var login = function(login,password,callable){
    db.query("SELECT * FROM users WHERE Login_User = '"+login+"' AND Password_User = '"+password+"' ", function (err, rows, fields) {
        if(err){
            callable("UNKNOWN_LOGIN_ERROR");
        }else{
            if(rows.length == 0){
                callable("INVALID_LOGIN_DETAILS");
            }else{
                var data = {};
                data.Login = rows[0].Login_User;
                data.Password = rows[0].Password_User;
                data.Avatar = rows[0].Avatar_User;
                data.Color = rows[0].Color_User;
                data.Id_User = rows[0].Id_User;
                callable(data);
            }
        }
    });
};

var getUserInfos = function (id, callable) {
    db.query("SELECT * FROM users WHERE Id_User = "+id+"", function (err, rows, f) {
        //console.log("SELECT * FROM users WHERE Id_User = "+id+"");
        if(err){
            callable(false);throw err;
        }else{
            callable(rows[0]);
        }
    });
};

exports.signIn = signIn;
exports.Login = login;
exports.userInfos = getUserInfos;