const MapState = require('../solver/node/MapState');
const GameMap = require('../solver/GameMap');
const Node = require('../solver/node/Node');
const Moves = require('../solver/Moves');

describe('Forced moves', () => {
    let node;

    beforeEach(() => {
        GameMap.clearAll();
        const map = [    
            ['R', '0', '0', '0', '0', 'R'],
            ['B', '0', '0', '0', 'B', 'R'],
            ['0', '0', '0', '0', '0', 'Y'],
            ['0', 'G', 'A', '0', '0', '0'],
            ['0', '0', '0', '0', 'G', 'A'],
            ['Y', 'O', '0', '0', '0', 'O'],
        ];
        GameMap.initializeMap(map);
        node = new Node();
    });

    test("Node doesn't have forced move", () => {
        node.mapState.map = [    
            ['R', 'R', '0', '0', '0', 'R'],
            ['B', 'R', '0', '0', 'B', 'R'],
            ['B', '0', '0', '0', '0', 'Y'],
            ['0', 'G', 'A', '0', '0', '0'],
            ['0', '0', '0', '0', 'G', 'A'],
            ['Y', 'O', '0', '0', '0', 'O'],
        ]
        node.mapState.current[0] = {Y: 1, X: 1}
        node.mapState.current[1] = {Y: 2, X: 0}

        expect(Moves.forcedMoves(node)).toEqual(-1);
    });

    test("Node doesn't have forced move", () => {
        node.mapState.map = [    
            ['R', 'R', 'R', '0', '0', '0'],
            ['B', '0', 'R', '0', 'B', 'R'],
            ['0', '0', '0', '0', '0', 'Y'],
            ['0', 'G', 'A', '0', '0', '0'],
            ['0', '0', '0', '0', 'G', 'A'],
            ['Y', 'O', '0', '0', '0', 'O'],
        ]
        node.mapState.current[0] = {Y: 1, X: 2}

        expect(Moves.forcedMoves(node)).toEqual(-1);
    });

    test("Node doesn't have forced move", () => {
        node.mapState.map = [    
            ['R', 'R', '0', '0', '0', '0'],
            ['B', '0', '0', '0', 'B', 'R'],
            ['0', '0', '0', '0', '0', 'Y'],
            ['0', 'G', 'A', '0', '0', '0'],
            ['0', '0', '0', '0', 'G', 'A'],
            ['Y', 'O', '0', '0', '0', 'O'],
        ]
        node.mapState.current[0] = {Y: 0, X: 1}

        expect(Moves.forcedMoves(node)).toEqual(-1);
    });

    test("Node has forced move", () => {
        node.mapState.map = [    
            ['R', 'R', 'R', 'R', 'R', 'R'],
            ['B', 'B', '0', '0', 'B', 'R'],
            ['0', 'B', 'B', 'B', '0', 'Y'],
            ['0', 'G', 'A', '0', '0', '0'],
            ['0', '0', '0', '0', 'G', 'A'],
            ['Y', 'O', '0', '0', '0', 'O'],
        ]
        node.mapState.current[0] = {Y: 1, X: 5}
        node.mapState.current[1] = {Y: 2, X: 3}
        GameMap.finishedPoints.push(0);

        expect(Moves.forcedMoves(node)).not.toEqual(-1);
    });

    test("Node has forced move", () => {
        node.mapState.map = [    
            ['R', 'R', 'R', 'R', 'R', 'R'],
            ['B', '0', '0', '0', 'B', 'R'],
            ['B', 'B', 'B', '0', '0', 'Y'],
            ['0', 'G', 'A', '0', '0', '0'],
            ['0', '0', '0', '0', 'G', 'A'],
            ['Y', 'O', '0', '0', '0', 'O'],
        ]
        node.mapState.current[0] = {Y: 1, X: 5}
        node.mapState.current[1] = {Y: 2, X: 2}
        GameMap.finishedPoints.push(0);
        
        expect(Moves.forcedMoves(node)).not.toEqual(-1);
    });

    test("Node has forced move", () => {
        node.mapState.map = [    
            ['R', 'R', 'R', '0', '0', '0'],
            ['B', '0', 'R', '0', 'B', 'R'],
            ['0', '0', 'R', '0', '0', 'Y'],
            ['0', 'G', 'A', '0', '0', '0'],
            ['0', '0', '0', '0', 'G', 'A'],
            ['Y', 'O', '0', '0', '0', 'O'],
        ]
        node.mapState.current[0] = {Y: 2, X: 2}
        node.mapState.current[1] = {Y: 1, X: 0}
        expect(Moves.forcedMoves(node)).not.toEqual(-1);
    });

    afterAll(() => {
        GameMap.clearAll();
    });
});
