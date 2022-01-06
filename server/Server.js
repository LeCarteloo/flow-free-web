const express = require('express')
const { makeid, validateData, validateNickname } = require('./Utility')
const app = express()
const port = 3000
const server = app.listen(port)
const io = require('socket.io')(server)
const { performance, PerformanceObserver } = require('perf_hooks');
const Generator = require('./generator/Generator');
const Solver = require('./solver/Solver')
const Points = require('./Points')
const LobbySettings = require('./LobbySettings')

// Static file for express server
app.use(express.static('client'));

// Rooms information
var rooms = {};

// Function to find index of Array
Array.prototype.indexOfArray = function(array) {
  const arrayJSON = JSON.stringify(array);
  const mainJSON = this.map(JSON.stringify);

  return mainJSON.indexOf(arrayJSON);
}

// Event for whenever a connection is established between the server and a client
io.on('connection', (socket) => { 
  socket.on('setNickname', (nickname) => {
    socket.nickname = nickname;
  });

  socket.on('createRoom', () => {
    // Validating nickname
    if(!validateNickname(socket)) {
      return;
    }

    let roomCode = makeid(5);
    // Emit roomCode to client side
    socket.emit('displayGameCode', roomCode)
    
    // Join to the room that was just created
    socket.join(roomCode);

    socket.emit('serverMsg', roomCode)

    // TODO: Add options from lobby to room object
    // Create room object
    rooms[roomCode] = {
      options: {},
      maps: [],
      players: [],
    };

    rooms[roomCode].players.push({
      id: socket.id, 
      nickname: socket.nickname, 
      finishedMaps: [], 
      currentPoints: 0, 
      points: 0, 
      hints: 0
    });

    // Show connected players
    io.to(roomCode).emit('userConnected', rooms[roomCode].players);
    socket.emit('displayAlert', {type: 'success', text: 'Lobby has been created!'});
  });

  socket.on('joinRoom', (gameCode) => {
    // Validating nickname
    if(!validateNickname(socket)) {
      return;
    }

    // Check if game code exists
    const clients = io.sockets.adapter.rooms.get(gameCode);
    
    // Room with given game code doesn't exist
    if (!clients) {
      socket.emit('displayAlert', {type: 'error', text: 'Unknown room!'});
      return;
    }
    
    let numberOfClients = clients.size;

    // Room is full
    if(numberOfClients > 1) {
      socket.emit('displayAlert', {type: 'error', text: 'Room is full!'});
      return;
    }

    // Join to given game code
    socket.join(gameCode);
    socket.emit('serverMsg', gameCode);
    // Change scene
    socket.emit('init');
    
    // Add player to room
    rooms[gameCode].players.push({
      id: socket.id,
      nickname: socket.nickname, 
      finishedMaps: [],
      currentPoints: 0, 
      points: 0, 
      hints: 0
    });
    
    //! Debug
    console.log(rooms);
    console.log(numberOfClients, clients);

    // Emit userConnected event to everyone connected to current room
    io.to(gameCode).emit('userConnected', rooms[gameCode].players);
    socket.emit('displayAlert', {type: 'success', text: 'Successfully joined the room!'});
  });

  socket.on('startGame', (options) => {
    const clients = io.sockets.adapter.rooms.get(options.roomCode);

    // Adding number of hints to all connected clients
    for (const id of clients) {
      const player = rooms[options.roomCode].players.find(player => player.id == id);
      player.hints = parseInt(options.hintsAmount);
      for (let i = 0; i < 2; i++) {
        player.finishedMaps.push([]);
      }
    }

    // Check who is starting the game (only the creator of lobby can start)
    if(clients.entries().next().value[0] != socket.id) {
      socket.emit('displayAlert', {type: 'error', text: 'You are not a lobby creator!'});
      return;
    }

    // Game cannot be started when there is only one user connected
    // if (clients.size <= 1) {
    //   socket.emit('displayAlert', {type: 'error', text: 'Not enough players!'});
    //   return;
    // }

    start = performance.now();
    LobbySettings.canTouch = options.canTouch;
    let generator = new Generator();
    let genMaps = generator.generateMap(
      parseInt(options.mapSize),
      parseInt(options.colorAmount), 
      parseInt(options.mapNumber)
    );
    LobbySettings.canTouch = false;
    io.to(socket.id).emit('testMessage', {map: genMaps.debugMaps, solvedColors: 'Nic'});

    end = performance.now();
    time = `${(end - start) / 1000} seconds`;
    console.log(`It took ${time}`);

    // Add generated maps to the room info
    rooms[options.roomCode].maps = genMaps.maps;
    rooms[options.roomCode].options = options;

    // TODO: It should start only when maps are generated
    setTimeout(() => {
      const players = rooms[options.roomCode].players;
      const mostPoints = Math.max.apply(Math, players.map(player => (player.points + player.currentPoints)));

      // Checking if there is a tie
      let result = 0;
      for (const player of players) {
        if(player.points + player.currentPoints == mostPoints) {
          result++;
        }
        // If user didn't provide one of maps it is added from started maps
        for (let i = 0; i < player.finishedMaps.length; i++) {
          if(player.finishedMaps[i].length == 0) {
            player.finishedMaps[i] = rooms[options.roomCode].maps[i];
          }
        }
      }

      // Handling tie
      if(result == 2) {
        io.to(options.roomCode).emit('displayResult', 'Tie!');
        io.to(options.roomCode).emit('gameEnded', {
          won: players[0],
          lost: players[1],
          size: options.mapSize,
          colors: options.colorAmount
        });
        return;
      }
      
      // Finding the winning and losing player
      const winningPlayer = players.find(player => (player.points + player.currentPoints) == mostPoints);
      const losingPlayer = players.find(player => (player.points + player.currentPoints) != mostPoints);

      // Sending the results to client
      io.to(winningPlayer.id).emit('displayResult', 'You won!');
      io.to(losingPlayer.id).emit('displayResult', 'You lost!');
      io.to(options.roomCode).emit('gameEnded', {
        won: winningPlayer,
        lost: losingPlayer,
        size: options.mapSize,
        colors: options.colorAmount
      });

      //! Disconnect player after finish (stack)
      // socket.leave();

      //! CHANGED TIME * 60000
    }, options.timeLimit * 6000);

    io.to(options.roomCode).emit('startTimer', options.timeLimit);
    io.to(options.roomCode).emit('hostGameStart', genMaps.maps[0]);
  });

  socket.on('changeMap', (mapInfo) => {
    const mapIndex = rooms[mapInfo.gameCode].maps.indexOfArray(mapInfo.startMap);
    
    // Map not found so map sent by client is fake
    if(mapIndex == -1) {
      io.to(socket.id).emit('displayAlert', {type: 'error', text: 'Provided wrong data!'});
      return;
    }

    const nextMap = rooms[mapInfo.gameCode].maps[mapIndex + 1];

    if(mapIndex == rooms[mapInfo.gameCode].maps.length - 1) {
      io.to(socket.id).emit('hideButton');
      return;
    }

    // After changing the map saving the current points
    const player = rooms[mapInfo.gameCode].players.find(player => player.id == socket.id);
    player.points = player.currentPoints;

    // Changing the map only for user that clicks the button (socket.id)
    io.to(socket.id).emit('changeMap', {
      map: nextMap, 
      colors: rooms[mapInfo.gameCode].options.colorAmount,
      size: rooms[mapInfo.gameCode].options.mapSize
    }); 
  });

  socket.on('countPoints', (mapInfo) => {
    const pointsClass = new Points(mapInfo.startMap, mapInfo.currentMap, mapInfo.solvedColors)
    const player = rooms[mapInfo.gameCode].players.find(player => player.id == socket.id);
    const points = pointsClass.countPoints();

    if(points == -1) {
      io.to(socket.id).emit('displayAlert', {type: 'error', text: 'Provided wrong data!'});
      return;
    }

    const pt = Math.abs(player.currentPoints - points);
    player.currentPoints += pt;
    const mapIndex = rooms[mapInfo.gameCode].maps.indexOfArray(mapInfo.startMap);
    player.finishedMaps[mapIndex] = mapInfo.currentMap;

    io.to(socket.id).emit('displayPoints', player.currentPoints + player.points);
  });

  socket.on('removePoints', (mapInfo) => {
    const pointsClass = new Points(mapInfo.startMap, mapInfo.currentMap, mapInfo.solvedColors)
    const player = rooms[mapInfo.gameCode].players.find(player => player.id == socket.id);
    const points = pointsClass.countPoints();
    
    if(points == -1) {
      io.to(socket.id).emit('displayAlert', {type: 'error', text: 'Provided wrong data!'});
      return;
    }
    
    player.currentPoints = points;
    const mapIndex = rooms[mapInfo.gameCode].maps.indexOfArray(mapInfo.startMap);
    player.finishedMaps[mapIndex] = mapInfo.currentMap;

    io.to(socket.id).emit('displayPoints', player.currentPoints + player.points);
  });

  socket.on('getHint', (mapInfo) => {
    const player = rooms[mapInfo.roomCode].players.find(player => player.id == socket.id);

    // if(player.hints <= 0) {
    //   socket.emit('displayAlert', {type: 'info', text: 'All available hints used!'});
    //   return;
    // }

    // Check if map is valid
    if(validateData(mapInfo.startMap, mapInfo.currentMap, mapInfo.solvedColors)) {
      io.to(socket.id).emit('displayAlert', {type: 'error', text: 'Provided wrong data!'});
      return;
    }

    
    // Solving given map with moves done by user
    LobbySettings.canTouch = rooms[mapInfo.roomCode].options.canTouch;
    let solver = new Solver(mapInfo.startMap);
    io.to(socket.id).emit('testMessage', {map: mapInfo.currentMap, solvedColors: mapInfo.solvedColors});
    const result = solver.init({map: mapInfo.currentMap, solvedColors: mapInfo.solvedColors});
    LobbySettings.canTouch = false;

    io.to(socket.id).emit('displayHintAmount', --player.hints);

    // TODO: Handle this in client side
    if(!result.isSolved) {
      console.log("Map is unsolvable");
      socket.emit('displayAlert', {type: 'info', text: 'Map is unsolvable!'});
      return;
    }

    // Diffrence between two arrays: 1: [A, B, C], 2: [A], Result: [B, C]
    const intersection = result.foundColors.filter(x => !mapInfo.solvedColors.includes(x));
    const randomColor = intersection[Math.floor(Math.random() * intersection.length)];

    const size = mapInfo.startMap.length;
    let hintMap = Array(size).fill().map(() => Array(size).fill('0'));

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if(result.map[y][x] == randomColor) {
          hintMap[y][x] = randomColor;
        }
      }
    }

    socket.emit('displayHint', {
      map: hintMap, 
      color: randomColor
    });

  });

  socket.on('updateInput', (data) => {
    if(rooms[data.roomCode].players.length <= 1 ||
      socket.id != rooms[data.roomCode].players[0].id) {
      return;
    }
    
    const player = rooms[data.roomCode].players.find(player => player.id != socket.id);
    io.to(player.id).emit('updateInput', data);
  });

  socket.on('updateSwitch', (data) => {
    if(rooms[data.roomCode].players.length <= 1 ||
      socket.id != rooms[data.roomCode].players[0].id) {
      return;
    }

    const player = rooms[data.roomCode].players.find(player => player.id != socket.id);
    io.to(player.id).emit('updateSwitch', data);
  });

  socket.on('disconnect', () => {
  });
});