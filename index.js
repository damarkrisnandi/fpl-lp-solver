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
 * fpl money
 */
const money = 101.5

const checkGw = null;


const fplData = require('./fpl-data')

const playerData = fplData.playerData;
const fixturesData = fplData.fixturesData;

Promise.all([playerData, fixturesData]).then(([{elements, events, teams}, fixtures]) => {
    const gameWeek = events.find(o => o.is_current).id;
    console.log('\n')
    console.log(`====== FPL gameweek ${checkGw || (gameWeek + 1)} Optimization =====`)
    console.log('\n')
    
    /**
     * create variable models
     * @param {string} suffix 
     * @param {function} filterCat 
     * @param {Array} addEntries 
     * @returns 
     */
    const createVariables = (suffix, filterCat, addEntries, inputGw=null) => Object.fromEntries(elements.map(e => {
        const picksData = { picks: [
            {
                element: parseInt(e.id),
                multiplier: 1
            }
        ]}
        
        
        let entries = Object.fromEntries([
            [`${e.web_name}${suffix}`, 1],
            ...addEntries,
            ['fwd', e.element_type == 4 ? 1 : 0],
            ['mid', e.element_type == 3 ? 1 : 0],
            ['def', e.element_type == 2 ? 1 : 0],
            ['gkp', e.element_type == 1 ? 1 : 0],
            ['xp', fplData.getTotalXPMultiplies({elements, teams}, gameWeek, inputGw && inputGw > gameWeek ? (inputGw - gameWeek) : 1, picksData, fixtures).totalXPoints],
            [`team_${e.team_code}`, 1],
        ]);

        
        return {
            ...e, 
            max_pick: 1, 
            ...entries,
        }})
            .filter(filterCat)
            .map(e => [`${e.web_name}${suffix}`, e]));

    /**
     * 
     * 
     * transfer opt
     * 
     */

    // variables
    const fplVariables = createVariables('', (v) => { return v }, [], checkGw);

    // constraints
    const maxPick = Object.fromEntries(elements.map(e => [e.web_name, {"max": 1, "min": 0}]));
    const posConstraints = {
        "gkp": {"equal": 2},
        "def": {"equal": 5},
        "mid": {"equal" : 5},
        "fwd": {"equal": 3}
    };
    const playerConstraints = Object.fromEntries(mandatoryPlayer.map(p => [p, {"equal": 1}]))
    const teamConstaints = Object.fromEntries(elements.map(e => [`team_${e.team_code}`, {"max": 3}]))
    
    // only integers
    const fplInts = Object.fromEntries(elements.map(e => [e.web_name, 1]))
    
    var solver = require("javascript-lp-solver/src/solver"),
    // transfer optimization model
    model = {
        "optimize": "xp",
        "opType": "max",
        "constraints": {
            ...maxPick,
            "now_cost": {"max": money * 10},
            ...posConstraints,
            ...playerConstraints,
            ...teamConstaints
        },
        "variables": {
            ...fplVariables
        },
        "ints": {
            ...fplInts
        }
    }
    console.log('--- tranf opt ---')
    const solution = solver.Solve(model);
    console.table(solution);
    const optimizedSquad = Object.keys(solution).filter(a => a != 'feasible' && a != 'result' && a!= 'bounded' && a != 'isIntegral')

    /**
     * 
     * 
     * pick opt
     * 
     * 
     */

    // variables
    const fplVariables2 = createVariables('', (v) => optimizedSquad.includes(v.web_name), [], checkGw)
    const fplCaptaincyVariables2 = createVariables('*', (v) => optimizedSquad.includes(v.web_name), [[`capt_check`, 1],], checkGw)
    
    // constraints
    const maxPick2 = Object.fromEntries(elements.map(e => [e.web_name, {"max": 1, "min": 0}]));
    const posConstraints2 = {
        "gkp": {"min": 1, "max": 2},
        "def": {"min": 3, "max": 6},
        "mid": {"min": 2, "max": 6},
        "fwd": {"min": 1, "max": 4}
    };
    const playerConstraints2 = Object.fromEntries(mandatoryPlayer.map(p => [p, {"min": 0, "max": 1}]))
    const captaincyConstraints = Object.fromEntries(elements.map(e => [`capt_check`, {"max": 1}]))
    
    // pick optimization model
    model = {
        "optimize": "xp",
        "opType": "max",
        "constraints": {
            ...maxPick2,
            // "now_cost": {"max": money},
            ...posConstraints2,
            ...playerConstraints2,
            ...teamConstaints,
            ...captaincyConstraints,
            "max_pick": {"max": 12}
        },
        "variables": {
            ...fplVariables2,
            ...fplCaptaincyVariables2
        },
        "ints": {
            ...fplInts
        }
    }

    console.log('--- pick opt ---')
    const solution2 = solver.Solve(model);
    console.table(solution2);


    /**
     * 
     * 
     * cost
     * 
     * 
     */

    let cost = 0;
    for (let p of optimizedSquad) {
        let eee = elements.find(e => e.web_name == p);
        cost += eee.now_cost;
    }
    console.log('cost:', cost/10);

    const buys = optimizedSquad.filter(o => !mandatoryPlayer.includes(o))
    console.log('>> recommend to buy:', buys.join(', '))

    console.log('\n')
    console.log(`================`)
    console.log('\n')
})

