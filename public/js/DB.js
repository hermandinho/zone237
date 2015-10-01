/**
 * Created by El-PC on 19/09/2015.
 */

var mysql = require("mysql");
var connection  = mysql.createConnection({
    host: 'localhost',
    user : 'root',
    password : '',
    database : 'chat'
});



exports.db_connexion = connection;
