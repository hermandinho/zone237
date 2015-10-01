/**
 * Created by El-PC on 25/09/2015.
 */
var db = require("../DB").db_connexion;

var sendPM = function (from, to, message, callable) {
    var d = new Date();
    var date = d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
    db.query("INSERT INTO pm(Id_PM_Sender,Id_PM_Reciever,Date_PM,PM_Status,pm_message) VALUES("+from+","+to+",'"+date+"',0,'"+message+"')", function (err, res) {
        if(err){
            callable(false);
            throw err;
        }else{
            callable(true);
        }
    });
};

var loadChat = function (me, correspondand, callback) {
    var req = "SELECT `pm`.`Id_PM`,`sender`.`Id_User` AS `Id_Sender`,`reciver`.`Id_User` AS `Id_Reciever`,`pm`.`pm_message`,`sender`.`Avatar_User` AS `Avatar_Sender`,"+
    "`reciver`.`Avatar_User` AS `Avatar_Reciver`,`sender`.`Color_User` AS Sender_Color,`reciver`.`Color_User` AS `Reciever_Color`" +
    "FROM `pm`" +
    " INNER JOIN `users` `sender` ON `pm`.`Id_PM_Sender` = `sender`.`Id_User`" +
    "  INNER JOIN `users` `reciver` ON `pm`.`Id_PM_Reciever` = `reciver`.`Id_User`" +
    "WHERE (`sender`.`Id_User` = "+me+" AND `reciver`.`Id_User` = "+correspondand+") OR (`sender`.`Id_User` = "+correspondand+" AND `reciver`.`Id_User` = "+me+") ORDER BY Id_PM ASC ";

    db.query(req,function (err, rows, fields) {

        if(err){
            callback(false);throw err;
        }    else{
            callback(rows);
        }
    });
};

exports.sendPM = sendPM;
exports.loadChat = loadChat;