const express = require('express')
const { makeid } = require('./Utility')
const app = express()
const port = 3000
const server = app.listen(port)
const io = require('socket.io')(server)
const { performance, PerformanceObserver } = require('perf_hooks');
const Generator = require('./generator/Generator');
const Solver = require('./solver/Solver')

// Static file for express server
app.use(express.static('client'));

// Rooms information
var rooms = {};

// Event for whenever a connection is established between the server and a client
io.on('connection', (socket) => {

  // Switch background on all connected clients 
  socket.on('buttonPressed', clientRoom => {
      io.to(clientRoom).emit('switchFromServer');
  })
    
  socket.on('createRoom', () => {
    let roomCode = makeid(5);
    // Emit roomCode to client side
    socket.emit('displayGameCode', roomCode)
    
    // Join to the room that was just created
    socket.join(roomCode);

    socket.emit('serverMsg', roomCode)

    // Create room object
    rooms[roomCode] = {
      time: 5,
      maps: [],
      players: [],
    };

    rooms[roomCode].players.push(socket.id);

    // console.log(rooms);

    // Show connected players
    io.to(roomCode).emit('userConnected', rooms[roomCode].players);
  });

  socket.on('joinRoom', (gameCode) => {
    // Check if game code exists
    const clients = io.sockets.adapter.rooms.get(gameCode);
    
    // Room with given game code doesn't exist
    if (!clients) {
      socket.emit('unknownRoom');
      return;
    }
    
    let numberOfClients;
    numberOfClients = clients.size;

    // Room is full
    if(numberOfClients > 1) {
      socket.emit('fullRoom');
      return;
    }

    // Join to given game code
    socket.join(gameCode);
    
    socket.emit('serverMsg', gameCode);
    
    // Change scene
    socket.emit('init');
    
    // Add player to room
    rooms[gameCode].players.push(socket.id);
    
    //! Debug
    console.log(rooms);
    console.log(numberOfClients, clients);

    // Emit userConnected event to everyone connected to current room
    io.to(gameCode).emit('userConnected', rooms[gameCode].players);
  });

  socket.on('startGame', (options) => {
    start = performance.now();

    let generator = new Generator();
    let genMaps = generator.generateMap(
      parseInt(options.mapSize),
      5, 
      parseInt(options.mapNumber)
    );

    end = performance.now();
    time = `${(end - start) / 1000} seconds`;
    console.log(`It took ${time}`);

    setTimeout(() => {
      console.log("Uplynela 1 minuta");
    }, options.timeLimit * 60000);

    // Sent to clients test message and start the game
    io.to(options.roomCode).emit('testMessage', genMaps);

    // Add generated maps to the room info
    rooms[options.roomCode].maps = genMaps;

    // genMaps = [
    //   [ '0', '0', '0', '0', '0' ],
    //   [ 'B', 'R', '0', '0', '0' ],
    //   [ 'O', 'Y', 'Y', '0', 'B' ],
    //   [ '0', '0', '0', '0', '0' ],
    //   [ 'G', 'G', '0', 'O', 'R' ]
    // ];

    // console.log(rooms[options.roomCode].maps.length);

    io.to(options.roomCode).emit('hostGameStart', genMaps[0])
    // io.to(options.roomCode).emit('hostGameStart', genMaps)
  });

  socket.on('changeMap', (mapInfo) => {
    Array.prototype.indexOfArray = function(array) {
      const arrayJSON = JSON.stringify(array);
      const mainJSON = this.map(JSON.stringify);

      return mainJSON.indexOf(arrayJSON);
    }

    let mapIndex = rooms[mapInfo.gameCode].maps.indexOfArray(mapInfo.startMap);
    let nextMap = rooms[mapInfo.gameCode].maps[mapIndex + 1];

    io.to(mapInfo.gameCode).emit('changeMap', nextMap); 
  });

socket.on('getHint', (mapInfo) => {
    // Solving given map with optional solvedColors
    let solver = new Solver(mapInfo.startMap);
    const result = solver.init({map: mapInfo.currentMap, solvedColors: mapInfo.solvedColors});

    // console.log(result.isSolved, result.map);
    // console.log(result.foundColors);
    // console.log(mapInfo.solvedColors);

    // Diffrence between two arrays: 1: [A, B, C], 2: [A], Result: [B, C]
    const intersection = result.foundColors.filter(x => !mapInfo.solvedColors.includes(x));
    // console.log(intersection);
    const randomColor = intersection[Math.floor(Math.random() * intersection.length)];
    console.log(randomColor);

    const size = mapInfo.startMap.length;
    let hintMap = Array(size).fill().map(() => Array(size).fill('0'));

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if(result.map[y][x] == randomColor) {
          hintMap[y][x] = randomColor;
        }
      }
    }

    console.log(hintMap);

    socket.emit('displayHint', {map: hintMap, color: randomColor});
  });

  socket.on('disconnect', () => {
    console.log("disconnected");
  });
});