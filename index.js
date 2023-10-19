const fplData = require('./fpl-data')

fplData.playerData.then((elements) => {

    /**
     * hold players
     */
    const mandatoryPlayer = [
        'Areola',
        'Leno',
        'Pedro Porro',
        'Haaland',
        'Maddison',
        'Burn',
        'Salah',
        'Son',
        'Neto',
        'Watkins',
        'Lamptey',
        'J.Alvarez'
    ]
    /**
     * fpl money * 10
     */
    const money = 1015
    const fplVariables = Object.fromEntries(elements.map(e => {
        let entries = Object.fromEntries([
            [e.web_name, 1],
            [`captain_${e.web_name}`, 1],
            [`bench_${e.web_name}`, 1],
            ['fwd', e.element_type == 4 ? 1 : 0],
            ['mid', e.element_type == 3 ? 1 : 0],
            ['def', e.element_type == 2 ? 1 : 0],
            ['gkp', e.element_type == 1 ? 1 : 0],
            ['xp', fplData.getExpectedPoints(e, 8)],
            [`team_${e.team_code}`, 1],
            ['point_pick', fplData.getExpectedPoints(e, 8)],
            ['point_captain', fplData.getExpectedPoints(e, 8) * 2],
            ['point_bench', 0]
        ]);

        
        return {
            ...e, 
            max_pick: 1, 
            ...entries,
        }})
            .map(e => [e.web_name, e]));

    // only integers
    const fplInts = Object.fromEntries(elements.map(e => [e.web_name, 1]))
    
    const maxPick = Object.fromEntries(elements.map(e => [e.web_name, {"max": 1, "min": 0}]));
    const posConstraints = {
        "gkp": {"equal": 2},
        "def": {"equal": 5},
        "mid": {"equal" : 5},
        "fwd": {"equal": 3}
    };
    

    const playerConstraints = Object.fromEntries(mandatoryPlayer.map(p => [p, {"equal": 1}]))
    const teamConstaints = Object.fromEntries(elements.map(e => [`team_${e.team_code}`, {"max": 3}]))
    const pickConstaints = Object.fromEntries(elements.map(e => 
        [
            [`captain_${e.team_code}`, {"max": 1}],
            [`bench_${e.team_code}`, {"equal": 4}],
        ]
    ))
    var solver = require("javascript-lp-solver/src/solver"),
    model = {
        "optimize": "xp",
        "opType": "max",
        "constraints": {
            ...maxPick,
            "now_cost": {"max": money},
            ...posConstraints,
            ...playerConstraints,
            ...teamConstaints,
            ...pickConstaints
        },
        "variables": {
            ...fplVariables
        },
        "ints": {
            ...fplInts
        }
    }
    const solution = solver.Solve(model);
    console.table(solution);
    
    let cost = 0;
    const players = Object.keys(solution).filter(a => a != 'feasible' && a != 'result' && a!= 'bounded' && a != 'isIntegral');
    for (let p of players) {
        let eee = elements.find(e => e.web_name == p);
        cost += eee.now_cost;
    }
    console.log('cost:', cost/10);
})

