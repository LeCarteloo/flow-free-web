var gameMap = [
    ['0', '0', '0', '0', '0', '0', '0', '0'],
    ['0', 'O', '0', '0', '0', '0', '0', '0'],
    ['0', '0', '0', '0', '0', '0', '0', '0'],
    ['0', '0', '0', '0', '0', 'R', '0', '0'],
    ['0', '0', '0', 'Y', '0', '0', '0', 'G'],
    ['0', 'R', '0', '0', 'B', '0', '0', 'O'],
    ['0', '0', '0', '0', '0', '0', '0', 'G'],
    ['Y', '0', '0', '0', '0', '0', '0', 'B'],
];

var graph = [];
var size = gameMap.length;
var cells = gameMap.length * gameMap[1].length;

console.log("Map size: " + size + "x" + size);
console.log("Cells: " + cells);
console.log("Colors: " + size);

const astarColor = {
    'R': "red",
    'G': "green",
    'O': "orange",
    'B': "blue",
    'Y': "yellow",
    'A': "aqua",
}

//! Testing the Astar algorithm
// Every element in array now has position variables, g and h cost, 
// parent node (set to null), value and state


window.onload = function () {
    //! Debug divs
    before = document.getElementById('before');
    console.log(before.innerHTML)

    for(var y = 0; y < Map.size; y++) {
        for(var x = 0; x < Map.size; x++) {
            before.innerHTML += `<p style="margin:0; padding:0; display: inline-block; font-weight: bold; color:${astarColor[gameMap[y][x]]}"> ${gameMap[y][x]} </p>`;
        }
        before.innerHTML += '</br>';
    }
};

//? #################### ASTAR #################### ?//

// Initializing map
// Gathering informations (where is the start point,
// endpoint and how many colors)

console.log('%c ######### INIT MAP ###########', 'color: aqua;')

Map.initializeMap(gameMap);
console.log(`Number of colors: ${Map.numberOfColors}`)
console.log(Map.startPoint[0]);
console.log(Map.endPoint[0]);
console.log(Map.foundColors);

// console.log(graph[0][0]);
console.log(Map.size);

// console.log(graph[0][4]);
// var smth = moves.forcedMoves(graph, graph[0][4]);
// console.log(moves.makeMove(graph, graph[0][4], smth, 0));

let testNode = new Node();
// console.log(Moves.possibleMoves(testNode.mapState, 0));
// console.log(Moves.forcedMoves(testNode.mapState));

// console.log(Moves.makeAllMoves(testNode));

let astar = new Astar();
console.log(`Game map is ${astar.search()} and it created ${Global.nodeNumber} nodes`);

// testNode.setCurrent(0, 3, 2)
// console.log(testNode);
// let mapState = new MapState();
// console.log(mapState.updateMapState(testNode, 2, {From: {Y: 0, X: 4}, To: {Y: 0, X: 3}}));
