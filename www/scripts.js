 var prefix = "/api/server/";
const W=100;
const H=100;
const cSize=40;
var rep = 1;
var symbols =["X", "O", "%", "*", "~", "V", "#", "@", ">", "<"];

$(document).ready(function() {
    var players = [];
    makeField();
    setInterval(updatePlayers,1000);
    setInterval(updateField,1000);
    setInterval(getWinner,1000);


    function makeField() {
        var field = $('#field');
        field.html();

        for (var x = 0; x <= H; x++)
        {
            for (var y = 0; y <= W; y++)
            {
                var o=cSize*x;
                var n=cSize*y;
                var t = "<div class='cell' X='%1' Y='%2' style='top:%3px; left:%4px; width:%5px; height:%6px;' >".replace("%1",y).replace("%2",x).replace("%3",o).replace("%4",n).replace("%5",cSize).replace("%6",cSize);

                field.append(t);
            }
        }

    }

    function login() {
        var Name = $("#name").val();
        var inp = $("#name");
        if (Name.length > 0) {
            $.ajax({
            url: prefix + "join/" + Name ,
            dataType: "text"
            }).done(function (str) {
            if ("ok" == str) {
                $("#button").attr("status","logout");
                inp.attr('disabled',true);
                $("#button").text("logout");
            }
            else if (str == "not_ok")
                alert("this name already exists. enter another name.");

            });

        }
        else
            alert("enter a name");

    }



    function logout() {
        var inp = $("#name");
        var Name = $("#name").val();
        if (Name.length > 0) {
            $.ajax({
                url: prefix + "logout/" + Name,
                dataType:"text"
            }).done(function(str){
                if (str == "ok"){
                    $("#button").attr("status","login");
                    inp.val("");
                    inp.attr("disabled", false);
                    $("#button").text("login");
                }
            });
        }

    }

    $("#button").click(function(){
        var inp = $("#name");
        var status = $(this).attr("status");

        if (status == "login") {

            login();
        }
        else {
            logout();
        }
    });

    function updatePlayers() {
        var list_html = $("#list");

        $.ajax({
            url: prefix + "getPlayers",
            dataType: "json"
        }).done(function(data) {
            var pl_list = data.players;

            var tag_html = "";

            for (var i = 0; i < pl_list.length; i++)
            {
                var c_p = pl_list[i];
                var c_s = currentSymbol(i);
                if(hasPlayer(c_p)!=1)
                    players.push({symbol:c_s,name:c_p});

                tag_html = tag_html +   "<li>"  + players[i].name + ": " + players[i].symbol+  "</li>";
            }
            list_html.html(tag_html);
        });
    }
    function hasPlayer(name){
         for (var i = 0; i < players.length; i++)
         {

              if (players[i].name == name) {
                    return 1;
              }
         }
         return 0;
    }
    function makeSymbol(name)
    {


        for (var i = 0; i < players.length; i++)
        {
            if (players[i].name == name) {


                return players[i].symbol;
            }
        }
        return "";
    }

    function currentSymbol(ind){

        if (ind < symbols.length){
            return symbols[ind];
        }
        else {
            return "" + 1;
        }
    }

    function updateField() {
        $.ajax({
            url: prefix + "getField",
            dataType: "json"
        }).done(function(data) {
            var field = data;
            for (var i = 0; i < field.length; i++)
            {
                var cell = field[i];
                var symbol = makeSymbol(cell.player);

                var l=".cell[x='"+cell.x+"'][y='"+cell.y+"']";
                $(l).text(symbol)
            }
        });
    }

    function playerTurn(name,X,Y)
    {
        $.ajax({
            url: prefix + "makeTurn" +"/" + name + "/" + X + "/" + Y,
            dataType: "text"
        }).done(function(data){
           if (data == "end_game") {
            updateField();



           }
           else if (data == "no_winner"){
                updateField();
           }
           else if (data == "not_your_turn")
           {
                alert("not your turn!");
           }
           else if (data == "busy")
           {
                alert("this cell is busy, choose another one");
           }
        });
    }
    function getWinner() {
        $.ajax({
            url: prefix + "getWinner",
            dataType: "json"
        }).done(function(data) {
            var name = $("#name").val();

            if (data.winner == name && rep == 1){
                rep=0;
                alert("you win!!!")

            }
            else if (data.winner != "no" && rep == 1) {
                rep=0;
                alert("you lose:с winner: " + data.winner);

            }

        });
    }

$(".cell").click(function(){
        var Name = $("#name").val();
        var X = $(this).attr("X");
        var Y = $(this).attr("Y");
        playerTurn(Name,X,Y);
    });

})