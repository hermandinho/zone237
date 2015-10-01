/**
 * Created by El-PC on 23/09/2015.
 */

var smilleyManager = function(code){
    var img = "";
    switch (code){
        case ":A":
            img = "Adore.png";break;
        case ":C":
            img = "Cool.png";break;
        case ":CR":
            img = "Cry.png";break;
        case ":F":
            img = "Furious.png";break;
        case ":)":
            img = "Laugh.png";break;
        case ":(":
            img = "Pudently.png";break;
        case ":ST":
            img = "Struggle.png";break;
        case ":S":
            img = "Study.png";break;
        case ":SA":
            img = "Sweet-angel.png";break;
    }
    return img;
};

var parseMessage = function(message){
    var codes = [':A',':C',':CR',':F',':)',':(',":ST",':S',':SA'],
        tmp = message.split(" "),
        res = "";

    for(var i=0;i<tmp.length;i++){
        if(codes.indexOf(tmp[i]) !== -1){
            tmp[i] = "<img src='/images/smilleys/"+smilleyManager(tmp[i])+"' width='25' />";
        }
        res += tmp[i]+" ";
    }
    return res;
};

exports.parseMessage = parseMessage;