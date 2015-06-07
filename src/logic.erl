-module(logic).
-define(DB_FILENAME, "data\\file.tab").
-author("roctbb").
-behaviour(gen_server).
-export([terminate/2,init/1, start_link/0, handle_call/3, handle_cast/2]).
-export([checkTurn/4, getWinner/1, addPlayer/2,getPlayers/1, verifyCell/3,start_game/0,leave_game/2, handle_info/2, code_change/3 ]).
-record(situation, {waitingPlayers=[], playing=[], winner=no, field = dict:new()}).
%%% Реализация процесса игровой логики
%%%   start_link – запуск процесса
%%%   init – создание начального состояния
%%%   handle_call – обработка сообщений, которые требуют ответ
%%%   handle_cast – обработка сообщений, которые не требуют ответs



start_link() -> gen_server:start_link({global, logic}, ?MODULE, [], []).
init([]) ->{ ok, logic:start_game() }.
handle_call( {getPlayers} , _, State) -> { reply, getPlayers(State), State } ;
handle_call( {getWinner} , _, State) -> {reply, getWinner(State), State};
handle_call( {verifyCell, X, Y}, _, State) -> {reply, verifyCell(X, Y, State), State};
handle_call( {getField}, _, State) -> {reply, State#situation.field, State};
handle_call( {makeTurn, PlayerName, X, Y}, _, State) ->
  {Status, NewState} = logic:checkTurn(X, Y, PlayerName, State),
  {reply, Status, NewState};
handle_call( {join, Name}, _, State) ->
  {Status, NewState} = addPlayer(Name, State),
  {reply, Status, NewState}.
handle_cast( {reset}, _ ) -> {noreply, #situation{}};
handle_cast( {leave, Name}, State) ->  {noreply, leave_game(Name, State)}.

checkTurn(X,Y,PlayerName,State) ->
  IsPlaying = lists:member(PlayerName,State#situation.playing),
  CellIsFree = verifyCell(X,Y,State),
  if true == IsPlaying ->
    if CellIsFree == free ->
      if State#situation.winner == no -> makeTurn(X,Y,PlayerName,State);%{ok, dict:append(State#situation.field,{X,Y},PlayerName)};
        State#situation.winner /= no -> {end_game,State}
      end;
      CellIsFree /= free -> {busy,State}
    end;
    true /= IsPlaying -> {not_your_turn, State}
  end.

firstElement([X|_]) ->
  X;
firstElement([]) ->
  [].
deleteFirst([H|T]) ->
  T;
deleteFirst([])->[].

getPlayers(State) ->
  State#situation.playing ++ State#situation.waitingPlayers.

getWinner(State) -> State#situation.winner.

verifyCell(X, Y, State) ->
  Field = State#situation.field,
  A = dict:find({X,Y},Field),
  if A == error -> free;
    A /= error -> ok
  end.

makeTurn(X,Y,PlayerName,State) ->
  Name = PlayerName,
  Field = dict:append({X,Y},Name,State#situation.field),
  Won = checkGame(X,Y,Name,Field),

  if Won == Name -> {end_game,State#situation{winner = Name}};
    Won /= Name ->
      New_playing = firstElement(State#situation.waitingPlayers),
      New_waitingPlayers = deleteFirst(State#situation.waitingPlayers),
      New = lists:append([Name],New_waitingPlayers),
      {no_winner,State#situation{waitingPlayers = New, playing = [New_playing], field = Field}}
  end.

checkGame(X,Y,Name,Field) ->
  N = 5,
  Bool = checkLine(X,Y,Name,Field,N),
  if Bool == true -> Name;
    Bool /= true -> no_winner
  end.

checkLine(X,Y,Name,Field,N) ->
  Hor = checkLine(X,Y,Name,Field,right,N) - checkLine(X,Y,Name,Field,left,N) - 1,
  Ver = checkLine(X,Y,Name,Field,up,N) - checkLine(X,Y,Name,Field,down,N) - 1,
  Diag_up = checkLine(X,Y,Name,Field,right_up,N) - checkLine(X,Y,Name,Field,left_down,N) - 1,
  Diag_down =  checkLine(X,Y,Name,Field,right_down,N) - checkLine(X,Y,Name,Field,left_up,N) - 1,
if ((Hor >= N) or (Ver >= N) or (Diag_up >= N) or (Diag_down >= N)) -> true;
  true -> false
end.

checkLine(X,Y,Name,Field,Dir,N) ->
  A = dict:find({X,Y},Field),
  io:write(A),
  case Dir of
    right ->
      case dict:find({X,Y},Field) of {ok, [Name]} -> checkLine(X+1,Y,Name,Field,Dir,N);
        _ ->  X
      end;
    left ->
      case dict:find({X,Y},Field) of {ok, [Name]} -> checkLine(X-1,Y,Name,Field,Dir,N);
        _Else -> X
      end;
    up ->
      case dict:find({X,Y},Field) of {ok, [Name]} -> checkLine(X,Y+1,Name,Field,Dir,N);
        _Else -> Y
      end;
    down ->
      case dict:find({X,Y},Field) of {ok, [Name]} -> checkLine(X,Y-1,Name,Field,Dir,N);
        _Else -> Y
      end;
    right_up ->
      case dict:find({X,Y},Field) of {ok, [Name]} -> checkLine(X+1,Y+1,Name,Field,Dir,N);
        _Else -> X
      end;
    left_up ->
      case dict:find({X,Y},Field) of {ok, [Name]} -> checkLine(X-1,Y+1,Name,Field,Dir,N);
        _Else -> X
      end;
    right_down ->
      case dict:find({X,Y},Field) of {ok, [Name]} -> checkLine(X+1,Y-1,Name,Field,Dir,N);
        _Else -> X
      end;
    left_down ->
      case dict:find({X,Y},Field) of {ok, [Name]} -> checkLine(X-1,Y-1,Name,Field,Dir,N);
        _Else -> X
      end
  end.





addPlayer(Name, State) ->
  Playing = State#situation.playing,
  Players = State#situation.playing ++ State#situation.waitingPlayers,
  Bool_c = lists:member(Name,Players),
  if Bool_c == true -> {not_ok, State};
     Bool_c /= true ->
       if Playing == [] ->
         {ok, State#situation{playing = [Name]}};
         Players /= [] -> {ok, State#situation{waitingPlayers = State#situation.waitingPlayers ++ [Name]}}
         end
  end
.

leave_game(Name,State) ->
  Waiting = State#situation.waitingPlayers,
  Playing = State#situation.playing,
  Bool = lists:member(Name,Playing),
  if Bool == true -> State#situation {playing = lists:delete(Name,Playing)},
    State#situation {playing = lists:append(firstElement(Waiting),Playing)},
    State#situation {waitingPlayers = deleteFirst(Waiting)};
    Bool == false -> State#situation {waitingPlayers = lists:delete(Name,Waiting)}
  end
.

start_game() -> #situation{}

.

terminate(_Reason, _State) -> ok.
handle_info(_Info, State) -> {noreply, State}.
code_change(_OldVsn, State, _Extra) -> {ok, State}.