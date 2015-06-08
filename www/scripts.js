 var prefix = "/api/server/";
const W=100;
const H=100;
const CellSize=40;
var rep = 1;
var mas_sym =["X", "O", "A", "*", "~", "V", "#", "@", ">", "<"];
$(document).ready(function() {
    var mas_player = [];
    create_field();
    setInterval(update_players,1000);
    setInterval(update_field,1000);
    setInterval(update_winner,1000);


    function create_field() {
        var field = $('#field');
        field.html();
        var offset_l = field.offset();

        doc_w = $(document).width();
        doc_h = $(document).height();
        for (var x = 0; x <= H; x++)
        {
            for (var y = 0; y <= W; y++)
            {
                var o=CellSize*x;
                var n=CellSize*y;
                var st = "<div class='cell' X='%1' Y='%2' style='top:%3px; left:%4px; width:%5px; height:%6px;' >".replace("%1",y).replace("%2",x).replace("%3",o).replace("%4",n).replace("%5",CellSize).replace("%6",CellSize);

                field.append(st);
            }
        }

    }

    function join() {
        var Name = $("#name").val();
        var inp = $("#name");
        if (Name.length > 0) {
            $.ajax({
            url: prefix + "join/" + Name ,
            dataType: "text"
            }).done(function (str) {
            if ("ok" == str) {
                $("#button").attr("status","leave");
                inp.attr('disabled',true);
                $("#button").removeClass("btn-primary").addClass("btn-danger").text("Выйти из игры");
            }
            else if (str == "not_ok")
                alert("Введите другое имя. Игрок с таким именем уже существует(");


            });

        }
        else
            alert("Введите имя");

    }



    function leave() {
        var inp = $("#name");
        var Name = $("#name").val();
        if (Name.length > 0) {
            $.ajax({
                url: prefix + "leave/" + Name,
                dataType:"text"
            }).done(function(str){
                if (str == "ok"){
                    $("#button").attr("status","join");
                    inp.val("");
                    inp.attr("disabled", false);
                    $("#button").removeClass("btn-danger").addClass("btn-primary").text("Присоединиться к игре");
                }
            });
        }

    }

    $("#button").click(function(){
        var inp = $("#name");
        var status = $(this).attr("status");
        if (status == "join") {
            join();
        }
        else {
            leave();
        }
    });

    function update_players() {
        var list_html = $("#list");

        $.ajax({
            url: prefix + "getPlayers",
            dataType: "json"
        }).done(function(data) {
            var players_list = data.players;

            var tag_html = "";

            for (var i = 0; i < players_list.length; i++)
            {

                var one_player = players_list[i];

                var symbol_c = CurrentSymbol(i);
                if(hasPlayer(one_player)!=1)
                    mas_player.push({symbol:symbol_c,name:one_player});

                tag_html = tag_html +   "<li>"  + mas_player[i].name + ": " + mas_player[i].symbol+  "</li>";
            }
            list_html.html(tag_html);
        });
    }
    function hasPlayer(name){
         for (var i = 0; i < mas_player.length; i++)
         {

              if (mas_player[i].name == name) {
                    return 1;
              }
         }
         return 0;
    }
    function playerSymbol(Name)
    {


        for (var i = 0; i < mas_player.length; i++)
        {
            if (mas_player[i].name == Name) {


                return mas_player[i].symbol;
            }
        }
        return "";
    }

    function CurrentSymbol(ind){

        if (ind < mas_sym.length){
            return mas_sym[ind];
        }
        else {
            return "" + 1;
        }
    }

    function update_field() {
        $.ajax({
            url: prefix + "getField",
            dataType: "json"
        }).done(function(data) {
            var field = data;
            for (var i = 0; i < field.length; i++)
            {
                var cell = field[i];
                var symbol = playerSymbol(cell.player);

                var l=".cell[x='"+cell.x+"'][y='"+cell.y+"']";
                $(l).text(symbol)


            }
        });
    }

    function make_turn(Name,X,Y)
    {
        $.ajax({
            url: prefix + "makeTurn" +"/" + Name + "/" + X + "/" + Y,
            dataType: "text"
        }).done(function(data){

           if (data == "end_game") {
            update_field();
            alert("Конец игры!");

           }
           else if (data == "no_winner"){
                update_field();
           }
           else if (data == "not_your_turn")
           {
                alert("Сейчас не ваш ход!");
           }
           else if (data == "busy")
           {
                alert("Данная клетка занята, выберите другую клетку");
           }
        });
    }
    function update_winner() {
        $.ajax({
            url: prefix + "getWinner",
            dataType: "json"
        }).done(function(data) {
            var Name = $("#name").val();

            if (data.winner == Name && rep == 1){
                rep=0;
                alert("Поздравляем! Вы победили.")
            }
            else if (data.winner != "no" && rep == 1) {
                rep=0;
                alert("Вы проиграли( Победил: " + data.winner);
            }

        });
    }

$(".cell").click(function(){
        var Name = $("#name").val();
        var X = $(this).attr("X");
        var Y = $(this).attr("Y");
        make_turn(Name,X,Y);
    });



})