/**
 * Created by El-PC on 22/09/2015.
 */
$(document).ready(function () {
   var socket = io.connect();
    var sound = new Audio("/media/new_message_2.mp3");


    $("#send_message").on('keyup',function (e) {
        var message = $.trim($(this).val());
        var message_to;
        var destination = $('#message_destination_type').val();
        if(destination == "FOR_PM"){
            message_to = $("#active_pm_user").val();
            if($.trim($(this).val()).length > 2 && e.keyCode !== 13){
                socket.emit("is_typing_to",{correspondant:message_to});
            }else{
                socket.emit("stop_typing_to",{correspondant:message_to});
            }

        }
        if(e.keyCode == 13){
            if(message.length > 0){
                var msg = $.trim($(this).val());
                switch (destination){
                    case "FOR_ROOM":
                        message_to = $("#active_chat_room").val();
                        socket.emit("new_room_message",{room:message_to,message:msg});
                        //alert("Send message to ROOM "+$("#active_chat_room").val());
                        break;
                    case "FOR_PM":
                        message_to = $("#active_pm_user").val();
                        socket.emit("new_pm_room_message",{correspondant:message_to,message:msg});
                        socket.emit("get_this_message",{owner:$("#logout").attr("data-content")});
                        //alert("Send PM to "+$("#active_pm_user").val());
                        break;
                    default :
                        alert("Sorry. Cannot send message. Please select a Room or User ");break;
                }
                $(this).val("");
            }else{

            }

        }
    });

  /*  $("#room_chat_message").on("keyup", function (e) {
        var message_to = $("#active_chat_room").val();
        if(e.keyCode ==13){
            if($.trim(message_to).length == 0){
                alert("No opened chat box ");
            }else{
                var msg = $.trim($(this).val());
                if(msg.length > 0){
                    socket.emit("new_room_message",{room:message_to,message:msg});
                    $(this).val("");
                }else{
                    alert("Sorry. Cannot send empty messages ");
                }
            }
        }
    });

    $("#pm_chat_message").on("keyup", function (e) {
        var message_to = $("#active_pm_user").val();

        if($.trim($(this).val()).length > 2 && e.keyCode !== 13){
            socket.emit("is_typing_to",{correspondant:message_to});
        }else{
            socket.emit("stop_typing_to",{correspondant:message_to});
        }

        if(e.keyCode ==13){
            if($.trim(message_to).length == 0){
                alert("No chat correspondant found :) ");
            }else{
                var msg = $.trim($(this).val());
                if(msg.length > 0){
                    socket.emit("new_pm_room_message",{correspondant:message_to,message:msg});
                    socket.emit("get_this_message",{owner:$("#logout").attr("data-content")});
                    $(this).val("");
                }else{
                    alert("Sorry. Cannot send empty messages ");
                }
            }
        }
    }); */

    socket.on("is_typing_to_me", function (data) {
        $(".item_PM_-_"+data.who+" a").html("PM - "+data.who+" <i class='glyphicon glyphicon-console'></i> ... <i style='float: right' title='Close' class='close glyphicon glyphicon-remove-circle'></i>").css({'color':'red'});
    });

    socket.on("stopped_typing_to_me", function (data) {
        $(".item_PM_-_"+data.who+" a").html("PM - "+data.who+" <i style='float: right' title='Close' class='close glyphicon glyphicon-remove-circle'></i>").css({'color':'black'});
    });

    $(document).on('click','.start_pm',function (e) {
        e.preventDefault();
        var chat_with = $(this).attr("id").split("_")[1];
        //alert('chat with '+chat_with);
        $("#active_pm_user").val(chat_with);
        $("#message_destination_type").val("FOR_PM");
        socket.emit('start_private_chat',{user:chat_with});
    });

    $(document).on('click','.pm_chat_header', function (e) {
        $("#active_pm_user").val($(this).attr('data-id'));
        $("#message_destination_type").val("FOR_PM");
    });

    socket.on("open_pm_chat_window", function (data) {
        socket.emit('init_pm_chat_window',data);
    });

    socket.on("new_pm_chat_box", function (data) {
        $(".nav-tabs").append(data.head);
        $(".main_tab_container").append(data.content);

        $(".tab-pane").removeClass('active');
        $(".main_tab_container #"+data.tab).addClass("active");
        $(".tab_items").removeClass('active');
        $(".item_"+data.tab).addClass("active");

        $("#active_pm_user").val(data.chat_id);
        $("#message_destination_type").val("FOR_PM");
//alert(data.chat_id+" "+data.correspondant);
        //$("#active_chat_room").val(data.active_room);
        $("#active_chat_room_name").val(data.active_room);
        $("#"+data.tab).tab("show");

        socket.emit("load_pm_messages",{correspondant_id:data.chat_id,correspondant_login:data.correspondant});
    });

    socket.on("open_existing_pm_chat_window", function (data) {
        //$(".test").html(data.chatWindow);
        $(".tab-pane").removeClass('active');
        $("#"+data.chatWindow).addClass("active");
        $(".tab_items").removeClass('active');
        $(".item_"+data.chatWindow).addClass("active");

        $("#active_pm_user").val(data.chat_id);
        $("#message_destination_type").val("FOR_PM");
        //$("#active_chat_room").val(data.active_room);
        $("#"+data.chatWindow).tab("show");
        //socket.emit("load_room_messages",{room:data.active_room});
    });

    socket.on("new_pm", function (data) {
        //alert("New PM from "+data.from);
        $("#active_pm_user").val(data.from_id);

        $(".main_tab_container #PM_-_"+data.from).append(data.message);//.animate({scrollTop: $(".main_tab_container #PM_-_"+data.from)[0].scrollHeight}, 1);

        socket.emit('start_private_chat',{user:data.from_id});
    });

    socket.on("my_new_pm", function (data) {
        //alert("Affiche moi ca "+data.from);
        $(".main_tab_container #PM_-_"+data.from).append(data.message).animate({scrollTop: $(".main_tab_container #PM_-_"+data.from)[0].scrollHeight}, 1);
        $(".main_tab_container #PM_-_"+data.from).animate({scrollTop: $(".main_tab_container #PM_-_"+data.from)[0].scrollHeight}, 1);
    });

    socket.on("new_pm_chat_message", function (data) {
       //alert("This is from : "+data.chatingWith+" "+data.msg);
        $(".main_tab_container #PM_-_"+data.chatingWith).append(data.msg).animate({scrollTop: $(".main_tab_container #PM_-_"+data.chatingWith)[0].scrollHeight}, 1);
        sound.play();
    });

    $(".nav-justified").on("click",'.close', function (e) {
        var tmp = $.trim($(this).parent("a").html().split("<")[0]),
            real_name = tmp;

        tmp = tmp.split(" ").join("_");
        $(this).parents("a").parents('li').remove('li');
        $(".main_tab_container #"+tmp).remove();
        socket.emit("close_chating_box",{box:real_name});

        var tabId = $(".main_tab_container .tab-pane:first").attr('id');

        $(".nav-justified li:first").tab("show");
        $(".main_tab_container .tab-pane").removeClass('active');
        $("#"+tabId).addClass('active');
        $(".main_tab_container .tab-pane")[$(".main_tab_container .tab-pane").length - 1].addClass('active');

    });

});