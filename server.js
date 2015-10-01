/**
 * Created by El-PC on 18/09/2015.
 */

var express = require("express"),
    app = express(),
    hds = require("hbs"),
    body_parser = require("body-parser"),
    session = require("express-session"),
    expressHbs = require('express3-handlebars'),
    server = require("http").createServer(app),
//    bd = require("./public/js/DB"),
    io = require('socket.io').listen(server)
    vendor = require("./public/js/vendor/vendor");//Contains all my DB Entities

server.listen(process.env.PORT|| 8081);

app.set('view engine','html');
app.engine('html',expressHbs({extname:'html', defaultLayout:'main.html'}));

app.use('/css',express.static(__dirname+'/public/css'));
app.use('/js',express.static(__dirname+'/public/js'));
app.use('/images',express.static(__dirname+'/public/images'));
app.use('/fonts',express.static(__dirname+'/public/fonts'));
app.use('/media',express.static(__dirname+'/public/media'));
app.use('/socket.io',express.static("../config/js/node_modules/socket.io/node_modules/socket.io-client"));
app.use(session({secret:'my session secrete here'}));
app.use(body_parser.json());
app.use(body_parser.urlencoded());

var user_session;
var active_chats = [],
    myChatRooms = {},
    myRoomIndexes = {},
    oppendChatWindows = [],
    activeUsers = [],
    ALL_USERS = {};

io.sockets.on('connection', function (socket) {
    socket.USER = user_session;
    socket.ACTIVE_TABS = [];
    socket.ACTIVE_USERS = activeUsers;
    io.sockets.ACTIVE_USERS = activeUsers;
    //io.sockets.ACTIVE_USERS = [];

    //if(socket) console.log(io.sockets.ACTIVE_USERS.length+" Users");

    socket.on("signUp", function (data) {
        vendor.USERS.signIn(data.login,data.password,data.avatar,data.color, function (data) {
            switch (data){
                case "LOGIN_ERR"://login already exists
                    socket.emit("LOGIN_ERR","Login error: This login is already taken. Choose another :( ");
                    break;
                case "SIGNUP_ERR":
                    socket.emit("SIGNUP_ERR","An Unknown error occured :( ");
                    break;
                case "SIGNUP_SUCCESS":
                    socket.emit("SIGNUP_SUCCESS","Sigun Success");
                    break;
            }
        });
    });

    socket.on('addRoom', function (data) {
        var d = new Date();
        data.Owner_Chat_Room = user_session.Id_User;
        data.Created_On = d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
        //console.log(data);

        vendor.CHAT_ROOM.addRoom(data, function (callback) {
            //console.log(data);
            switch (callback){
                case "ROOM_EXISTS":
                    socket.emit("ROOM_EXISTS","Change your room name ");
                    break;
                case "NEW_ROOM_SUCCESS":
                    //res.redirect("/");
                    socket.emit("NEW_ROOM_SUCCESS","Room Successfully created <a href='/'>Back to chat Rooms</a>");
                    io.sockets.emit('new_public_Room',"");//data.data.Name_Chat_Room
                    break;
            }
        });
    });

    socket.on("reset_chat_boxes", function (data){
        active_chats = [];
        //console.log(user_session);
        for(var i=0;i<socket.USER.MY_ROOMS.length;i++){
            //var key = socket.USER.MY_ROOMS[i]["Name_Chat_Room"]+"_"+socket.USER.MY_ROOMS[i]["Id_Chat_Room"];
            var key = "room_"+socket.USER.MY_ROOMS[i]["Id_Chat_Room"];
            myChatRooms[key] = io.sockets;
            myRoomIndexes[socket.USER.MY_ROOMS[i]["Id_Chat_Room"]] = i;
            //console.log(myChatRooms);
        }
    });

    socket.on("open_chat_window", function (data) {
        //active_chats.indexOf(data.chatTitle) == -1
        //console.log("Opening ...");
        if(socket.ACTIVE_TABS.indexOf(data.chatTitle) == -1){
            var tmp = data.chatTitle;
            tmp = tmp.split(" ").join("_");
            var tab_head = "<li data-id='"+data.box_id+"' data-content='"+tmp+"' class='tab_items item_"+tmp+" room_chat_box' role='"+tmp+"'><a href='#'>"+data.chatTitle+" <i style='float: right' title='Close' class='close glyphicon glyphicon-remove-circle'></i></a></li>";
            var content = "<div id='"+tmp+"' style='border:solid;overflow: auto;height:59%' class='tab-pane fade in' ></div>";
            //oppendChatWindows.push(data.chatTitle);
            socket.ACTIVE_TABS.push(data.chatTitle);

            socket.emit("new_chat_box",{active_room:data.box_id,head:tab_head,content:content,tab:tmp});
        }else{
            //console.log(data.chatTitle+" exists at "+socket.ACTIVE_TABS.indexOf(data.chatTitle));
            socket.emit("open_existing_chat_window",{chatWindow:data.chatTitle.split(" ").join("_"),active_room:data.box_id});
        }
    });

    socket.on("init_pm_chat_window", function (data) {
        //active_chats.indexOf(data.chatTitle) == -1
        //console.log("Opening PM CHAT WINDOW ...");
        if(socket.ACTIVE_TABS.indexOf(data.chatTitle) == -1){
            var tmp = data.chatTitle;
            tmp = tmp.split(" ").join("_");
            var tab_head = "<li data-id='"+data.box_id+"' data-content='"+tmp+"' class='tab_items item_"+tmp+" pm_chat_header pm_chat_box' role='"+tmp+"'><a href='#'>"+data.chatTitle+" <i style='float: right' title='Close' class='close glyphicon glyphicon-remove-circle'></i></a></li>";
            var content = "<div id='"+tmp+"' style='border:solid;overflow: auto;height:59%' class='tab-pane fade in' ></div>";

            socket.ACTIVE_TABS.push(data.chatTitle);
            //console.log('Openning... '+data.chatTitle);
            var u_name = data.chatTitle.split(" - ")[1];
            socket.emit("new_pm_chat_box",{chat_id:data.box_id,head:tab_head,content:content,tab:tmp,correspondant:u_name});

            //console.log('************* This is new ');
            //ALL_USERS[u_name].emit("new_pm_chat_box",{chat_id:data.box_id,head:tab_haed,content:content,tab:tmp});

        }else{
            //console.log('Exists :( '+data.chatTitle);
            //console.log('************* This is not new ');
            socket.emit("open_existing_pm_chat_window",{chatWindow:data.chatTitle.split(" ").join("_"),chat_id:data.box_id});
        }
    });

    socket.on("join_chat_room", function (room) {
        vendor.CHAT_ROOM.joinRoom(user_session.Id_User,room, function (status) {
            //console.log(user_session.OTHER_ROOMS);
            //console.log("Join Reqeust ");
            socket.emit('join_room_status',{status:status,room:room});
        });
    });

    socket.on("new_room_message", function (data) {
        //console.log("New message from "+socket.USER.MY_ROOMS[0].Id_Chat_Room+" to room "+data.room);
        var room_name = user_session.MY_ROOMS[myRoomIndexes[data.room]].Name_Chat_Room;
        room_name = room_name.split(" ").join("_");

        vendor.CHAT_ROOM_MESSAGES.postMessage(data.message,data.room,socket.USER['Id_User'], function (res) {
            //console.log("Message sent !!");
            //Send callback to user so as to play sound
        });
        var html = "<div class='alert alert-info'> <a href='#' class='dropdown-toggle' id='"+socket.USER['Id_User']+"' data-toggle='dropdown' aria-haspopup='true' aria-expanded='true' data-toggle='tooltip' title='"+socket.USER['Login_User']+"'><img src='/images/avatar/"+socket.USER['Avatar']+"' width='25' /></a> " +
            ": <span style='font-familly:fantasy;color: "+socket.USER['Color_User']+"';'>"+vendor.GENERICS.parseMessage(data.message)+"</div>";
        myChatRooms['room_'+data.room].emit("new_room_chat_message",{msg:html,room:room_name});
    });

    socket.on("init_new_user", function (data) {
        //console.log("reloading for "+socket.USER.Login+" AND X = "+socket.ACTIVE_TABS.length);
        //socket.ACTIVE_TABS = [];
        if(data.user in ALL_USERS){
            //callback(false);
        }else{
            //callback(true);
            socket.thisUser = data.user;
            //console.log("Hello "+data.user);
            ALL_USERS[socket.thisUser] = socket;

        }
    });

    socket.on("new_pm_room_message", function (data) {
        vendor.USERS.userInfos(data.correspondant, function (infos) {
            if(infos.Login_User in ALL_USERS){
                //console.log("*** Chat init with "+infos.Login_User);

                vendor.PRIVATE_MESSANGING.sendPM(socket.USER['Id_User'],data.correspondant,data.message, function (res) {
                    //console.log(socket.USER['Login']+" sent "+data.message+" to "+data.correspondant+" with status "+res);
                    //<a href='#' class='' ><img src='/images/avatar/"+socket.USER['Avatar']+"' width='25' /></a>
                    var broadcast_msg = "<div class='alert alert-info' style='text-align: left;width: auto;height: auto'><a href='#' class='' ><img src='/images/avatar/"+socket.USER['Avatar']+"' width='25' /></a>" +
                        " <span style='width:auto;font-familly:fantasy;color: "+socket.USER['Color_User']+"';'>"+vendor.GENERICS.parseMessage(data.message)+" </span> </div>";

                    var private_msg = "<div class='alert alert-info' style='text-align: right;width: auto;height: auto'>" +
                        " <span style='width:auto;font-familly:fantasy;color: "+socket.USER['Color_User']+"';'>"+vendor.GENERICS.parseMessage(data.message)+" </span> </div>";

                    //console.log("Sending to "+infos.Login_User+" TOTAL ("+Object.keys(ALL_USERS).length+") ...");
                    //console.log(socket.ACTIVE_TABS);
                    ALL_USERS[infos.Login_User].emit("new_pm",{from: socket.USER.Login, from_id: socket.USER.Id_User, message: broadcast_msg});
                    socket.emit("my_new_pm",{from: infos.Login_User, from_id:infos.Id_User, message: private_msg});
                    //console.log(socket.ACTIVE_TABS);
                    //console.log(data.message+" sent to "+data.correspondant);
                });

            }
            //console.log(ALL_USERS);
            //console.log("Chat init with "+infos.Login_User+" AND all = "+AL);
        });
        //myChatRooms['room_'+data.room].emit("new_room_chat_message",{msg:html,room:room_name});
    });

    socket.on("is_typing_to", function (user) {
        vendor.USERS.userInfos(user.correspondant, function (infos) {
            ALL_USERS[infos.Login_User].emit("is_typing_to_me",{who:socket.USER.Login});
        });
    });

    socket.on("stop_typing_to", function (user) {
        vendor.USERS.userInfos(user.correspondant, function (infos) {
            ALL_USERS[infos.Login_User].emit("stopped_typing_to_me",{who:socket.USER.Login});
        });
    });

    socket.on("load_pm_messages", function (data) {
        //console.log("Loading data for "+room.room+" ...");
        vendor.PRIVATE_MESSANGING.loadChat(socket.USER.Id_User,data.correspondant_id, function (msgs) {
            for(var i=0;i<msgs.length;i++){
                var style = "",img = "",color = "",html = "";
                if(msgs[i]['Id_Sender'] === socket.USER['Id_User']){
                    //extra = "<ul class='dropdown-menu dropup' aria-labelledby='roomMsg_"+msgs[i]['Id_User']+"'> <li><a href='#' class='start_pm' id='pmWith_"+msgs[i]['Id_User']+"'>Start PM</a></li> </ul>";
                    style = "text-align:right";
                    img = "";
                    color = msgs[i]['Sender_Color'];
                }else{
                    style = "text-align:left";
                    color = msgs[i]['Reciever_Color'];
                    img = "<a href='#' id='pmMsg_"+msgs[i]['Id_PM']+"'><img src='/images/avatar/"+msgs[i]['Avatar_Sender']+"' width='25'/></a>";
                }
                html = "<div class='alert alert-info' style='"+style+"; width:auto'> " +img+" <span style='font-familly:fantasy;color: "+color+"';'>"+vendor.GENERICS.parseMessage(msgs[i]['pm_message'])+"</div>";

                socket.emit("new_pm_chat_message",{msg:html,chatingWith:data.correspondant_login});

            }
        });
    });

    socket.on("get_this_message", function (data) {
        //console.log(data.owner+" needs some help ");
        //Load send back newlly sent message to owner
    });

    socket.on("load_room_messages", function (room) {
        //console.log("Loading data for "+room.room+" ...");
        vendor.CHAT_ROOM_MESSAGES.loadMessage(room.room, function (msgs) {
           var html = "";
            var room_name = user_session.MY_ROOMS[myRoomIndexes[room.room]].Name_Chat_Room;
            room_name = room_name.split(" ").join("_");
            for(var i=0;i<msgs.length;i++){
                var extra = "";
                if(msgs[i]['Id_User'] !== socket.USER['Id_User']){
                    //extra = "<ul class='dropdown-menu dropup' aria-labelledby='roomMsg_"+msgs[i]['Id_User']+"'> <li><a href='#' class='start_pm' id='pmWith_"+msgs[i]['Id_User']+"'>Start PM</a></li> </ul>";
                }else{
                    extra = "";
                }
                html = "<div class='alert alert-info dropdown'> <a href='#' class='dropdown-toggle' id='roomMsg_"+msgs[i]['Id_User']+"' data-toggle='dropdown' aria-haspopup='true' aria-expanded='true' data-toggle='tooltip' title='"+msgs[i]['Login_User']+"'><img src='/images/avatar/"+msgs[i]['Avatar_User']+"' width='25'/></a> " +
                    extra+": <span style='font-familly:fantasy;color: "+msgs[i]['Color_User']+"';'>"+vendor.GENERICS.parseMessage(msgs[i]['Chat_Room_Message_Content'])+"</div>";

                socket.emit("new_room_chat_message",{msg:html,room:room_name});

            }
        });
    });

    socket.on("start_private_chat", function (correnspondant) {
        vendor.USERS.userInfos(correnspondant.user, function (infos) {
            var chat_window_data = {
                chatTitle: "PM - "+infos.Login_User,
                box_id: infos.Id_User
            };
            socket.emit("open_pm_chat_window",chat_window_data);
        });
        //console.log("PM with "+correnspondant);
    });

    socket.on("update_active_users_list", function (user) {
        var u = [];
        //console.log(io.sockets.ACTIVE_USERS.length+" Users VS "+socket.ACTIVE_USERS.length+" VS "+activeUsers.length);
        //console.log("List Update requested by : "+user_session.Login);
        for(var i=0;i<io.sockets.ACTIVE_USERS.length;i++){
            if(activeUsers[i].login !== user){
                u.push({login: activeUsers[i].login, Id : io.sockets.ACTIVE_USERS[i].Id,Avatar:io.sockets.ACTIVE_USERS[i].Avatar});
            }
           //console.log(" > "+activeUsers[i].login);

        }//console.log("*********************************************************");
        //console.log(u);
        //console.log("____________________________________________________________");
        socket.emit("update_user_list",u);
    });

    socket.on("get_active_users", function () {
        //console.log("get_active_users : "+user_session.Login);
        socket.broadcast.emit("new_user_logged_in",user_session);
        //socket.broadcast.emit("update_user_list",activeUsers[activeUsers.length-1]);
    });

    socket.on('logout', function (data) {
        if(!socket.USER) return;
        var index;
        delete ALL_USERS[socket.thisUser];
        for(var i=0;i<activeUsers.length;i++){
            if(activeUsers[i].login === data){
                activeUsers.splice(i,1);
                break;
            }
        }
        socket.broadcast.emit("user_gone");
    });

    socket.on("close_chating_box", function (infos) {
        socket.ACTIVE_TABS.splice(socket.ACTIVE_TABS.indexOf(infos.box),1);
        //console.log(socket.ACTIVE_TABS);
        //console.log("closing box "+infos.box+" By "+socket.USER.Login+" EXTRA : "+socket.ACTIVE_TABS.indexOf(infos.box));
    });

    socket.on("leave_room", function (data) {
        vendor.CHAT_ROOM.leaveRoom(data.room,socket.USER.Id_User, function (callback) {
            if(callback == true){
                socket.emit("You_left_room");
            }else{
                socket.emit("room_leaving_err",{err:"Error. Please try again after"});
            }
        });
    });

    socket.on("disconnect", function () {
        //console.log("socket Disconnected");
    });
});

app.get("/", function (req, res) {
    user_session = req.session;

    if(user_session.is_loggedIn == true){
        var my_rooms = []
            other_rooms = [],
            is_new_login = true;
/*
        for(var i=0;i<io.sockets.ACTIVE_USERS.length;i++){
            //console.log(i+" ====> "+io.sockets.ACTIVE_USERS[i].login);
            if(io.sockets.ACTIVE_USERS[i].login == user_session.Login){
                //console.log(i+" new user is "+io.sockets.ACTIVE_USERS[i].login);
                is_new_login = false;
            }else{
                //console.log(i+" old user is "+io.sockets.ACTIVE_USERS[i].login);
                //activeUsers.push({login:user_session.Login,Id:user_session.Id_User,Avatar:user_session.Avatar});
                is_new_login = true;
                break;
            }
        }

        if(is_new_login == true){
            console.log("____Adding "+user_session.Login+" And curreunt Amount = "+io.sockets.ACTIVE_USERS.length);
            //activeUsers.push({login:user_session.Login,Id:user_session.Id_User,Avatar:user_session.Avatar});
            //io.sockets.ACTIVE_USERS.push({login:user_session.Login,Id:user_session.Id_User,Avatar:user_session.Avatar});
        }else{
            console.log("____Cannot add "+user_session.Login+" And current Amount is "+io.sockets.ACTIVE_USERS.length);
        } */

        vendor.CHAT_ROOM.loadPublicRooms(user_session.Id_User, function (data) {

            //console.log(data);
            if(data.IS_MINE == true){
                my_rooms.push(data);
                user_session.MY_ROOMS = my_rooms;
            }else{
                other_rooms.push(data);
                user_session.OTHER_ROOMS = other_rooms;
            }
        });

        //console.log(user_session.MY_ROOMS);
        //console.log("****"+ activeUsers.length);
        res.render("home/index",{title:"Welcome to Chat",userData:user_session});
    }else{
        res.render("home/login",{title:"Login",someValue:"Merde"});
    }
});

app.post("/", function (req, res) {
    user_session = req.session;

    vendor.USERS.Login(req.body.login,req.body.password, function (data) {
        switch (data){
            case "UNKNOWN_LOGIN_ERROR":
                //socket.emit("UNKNOWN_LOGIN_ERROR","Sorry an Unknown error occured while connecting to server !!!");
                break;
            case "INVALID_LOGIN_DETAILS":
                //socket.emit("INVALID_LOGIN_DETAILS","Unknwon user or invalid password ");
                break;
            default :
                user_session.is_loggedIn = true;
                user_session.Login = data.Login;
                user_session.Password = data.Password;
                user_session.Avatar = data.Avatar;
                user_session.Color = data.Color;
                user_session.Id_User = data.Id_User;
                break;
        }

        var exists = false;

        for(var i=0;i<activeUsers.length;i++){
            if(activeUsers[i].login == user_session.Login){
                exists = true;break;
            }
        }
        if(!exists){
            activeUsers.push({login:user_session.Login,Id:user_session.Id_User,Avatar:user_session.Avatar});
        }
        //console.log("******************************************************* ");
        //console.log(activeUsers);
        //console.log("____________________________________________________________ ");
        //io.sockets.ACTIVE_USERS = activeUsers;
        res.redirect("/");
    });
});

app.get("/signup", function (req, res) {
    res.render("home/signup",{title:"Sign Up"});
});

app.get("/logout", function (req, res) {
    req.session.destroy(function (err) {
        if(err){
            console.log(err);
        }else{
            res.redirect("/");
        }
    });
});

app.get("/room", function (req, res) {
    user_session = req.session;

    if(user_session.is_loggedIn == true){
        res.render("home/addRoom");
    }else{
        res.redirect("/");
    }
});

//app.listen(8080);