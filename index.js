require('dotenv').config();
console.clear();



/**
 * hold players
 */
let mandatoryPlayer = [];

let replacesPlayer = [];
/**
 * fpl money
 */
let money = 0

const checkGw = null;

let willReplace = 0;

let playerId = ''

let optimizeMax = 'xp';

/**
 * ===========================================
 */

if (process.argv.length > 2) {
    const options = process.argv.filter(a => a.startsWith('--'))
    const replaceCommand = options.find(opt => opt.startsWith("--replace"));
    if (replaceCommand) {
        const [,result] = replaceCommand.split("=")
        willReplace = parseInt(result)
    }

    const idCommand = options.find(opt => opt.startsWith("--playerId"));
    if (idCommand) {
        const [,result] = idCommand.split("=")
        playerId = result
    }

    // const moneyCommand = options.find(opt => opt.startsWith("--money"));
    // if (moneyCommand) {
    //     const [,result] = moneyCommand.split("=")
    //     money = parseFloat(result)
    // }

    const optCommand = options.find(opt => opt.startsWith("--optimize-max"));
    if (optCommand) {
        const [,result] = optCommand.split("=")
        optimizeMax = result
    }
}

/**
 * ===========================================
 */

const fplData = require('./fpl-data')

const playerData = fplData.playerData;
const fixturesData = fplData.fixturesData;

const prompt = require('prompt-sync')();
const entryId = prompt('Your entry id:');
if (entryId === 'default') {
    playerId = process.env.ENTRY_ID;
} else {
    playerId = entryId;
    
}

Promise.all([playerData, fixturesData, fplData.managerInfo(playerId)]).then(([{elements, events, teams}, fixtures, managerInfo]) => {
    const gameWeek = events.find(o => o.is_current).id;
    console.log('\n')
    console.log(`====== FPL gameweek ${checkGw || (gameWeek + 1)} Optimization =====`)
    
    fplData.picksData(playerId, gameWeek).then((picksData) => {
        
        const optimizationProcess = () => {
            try {
                elements.sort((a, b) => a.element_type - b.element_type)
                const elements1 = elements.filter(el => picksData.picks.map(a => a.element).includes(el.id));
                elements1.sort((a, b) => {
                    let vA = a.event_points - fplData.getTotalXPMultiplies({elements, teams}, gameWeek, 0, { picks: [{element: parseInt(a.id), multiplier: 1}] }, fixtures).totalXPoints;
                    let vB = b.event_points - fplData.getTotalXPMultiplies({elements, teams}, gameWeek, 0, { picks: [{element: parseInt(b.id), multiplier: 1}] }, fixtures).totalXPoints;
                    if (optimizeMax != 'xp') {
                        return b[optimizeMax] - a[optimizeMax]
                    }
                    return vB-vA
                })
                mandatoryPlayer = elements1.filter((e, idx) => idx < 15 - willReplace).map(a => a.web_name);
                replacesPlayer = elements1.filter((e, idx) => (idx >= 15 - willReplace)).map(a => a.web_name);
                

                if (money == 0) {
                    money = (managerInfo.last_deadline_value)/10;
                }
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
                    "fwd": {"equal": 3},
                };
                const playerConstraints = Object.fromEntries(mandatoryPlayer.map(p => [p, {"equal": 1}]))
                const teamConstaints = Object.fromEntries(elements.map(e => [`team_${e.team_code}`, {"max": 3}]))
                
                // only integers
                const fplInts = Object.fromEntries(elements.map(e => [e.web_name, 1]))
                
                var solver = require("javascript-lp-solver/src/solver"),
                
                //#region transfer optimization
                model = {
                    "optimize": optimizeMax,
                    "opType": "max",
                    "constraints": {
                        ...maxPick,
                        "now_cost": {"max": money * 10},
                        ...posConstraints,
                        ...playerConstraints,
                        ...teamConstaints,
                        // "is_playing": { "min": 11 },
                        // "transfers": { "min": 1 }
                    },
                    "variables": {
                        ...fplVariables,
                        // 'transfers': {
                        //     'xp': (willReplace > 0 ? willReplace - 1 : 0) * -4,
                        //     'transfers': 1,
                        // }
                    },
                    "ints": {
                        ...fplInts,
                        // "transfers": 1
                    }
                }
                const solution = solver.Solve(model);
                

                if (!solution.feasible) {
                    console.log("Solution unfeasible!")
                    showCommand();
                    // console.log('\n')
                    // console.log(`================`)
                    // console.log('\n')
                    throw new Error('retry...')
                }

                const optimizedSquad = Object.keys(solution).filter(a => a != 'feasible' && a != 'result' && a!= 'bounded' && a != 'isIntegral')
                const data = elements.filter(el => optimizedSquad.find(os => os === el.web_name)).map(el => {return {web_name: el.web_name, pos: getPosition(el.element_type), cost: el.now_cost/10, value: parseFloat(fplVariables[el.web_name][optimizeMax])}})
                let totalcost = 0;
                for (let i=0; i<15;i++) {
                    totalcost += data[i].cost;
                } 
                const totalData = {web_name: 'TOTAL', cost: totalcost};
                data.push(totalData)
                console.log('--- trfopt ---')
                console.table(data);
                //#endregion transfer optimization


                //#region pick optimization
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
                    "optimize": optimizeMax,
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

                const solution2 = solver.Solve(model);

                const optimizedSquad2 = Object.keys(solution2).filter(a => a != 'feasible' && a != 'result' && a!= 'bounded' && a != 'isIntegral')
                const data2 = elements.filter(el => optimizedSquad2.find(os => os === el.web_name)).map(el => {return {web_name: el.web_name, pos: getPosition(el.element_type),cost: el.now_cost/10, value: parseFloat(fplVariables[el.web_name][optimizeMax])}})
                const cptIdx = data2.findIndex(dt => optimizedSquad2.includes(dt.web_name + '*'))
                data2[cptIdx].web_name += ' (C)';
                if (optimizeMax === 'xp' || optimizeMax === 'points_per_game') {
                    data2[cptIdx].value *= 2;
                }
                let totalvalue = 0;
                // let totalcost = 0;
                for (let i=0; i<11;i++) {
                    totalvalue += data2[i].value;
                    totalcost += data2[i].cost;
                } 
                const totalData2 = {web_name: 'TOTAL', value: totalvalue};
                data2.push(totalData2)

                const def = data2.filter(d => d.pos === 'DEF').length;
                const mid = data2.filter(d => d.pos === 'MID').length;
                const fwd = data2.filter(d => d.pos === 'FWD').length;
                console.log('--- pickopt ---')
                console.log('\n');
                console.log(`Formation: ${def}-${mid}-${fwd}`);

                console.table(data2);
                //#endregion pick optimization


                let cost = 0;

                for (let p of optimizedSquad) {
                    let eee = elements.find(e => e.web_name == p);
                    cost += eee ? eee.now_cost : 0;
                }
                console.log('\n')
                console.log('team value:', cost/10);
                console.log('in-bank:', parseFloat((money - cost/10).toFixed(1)))

                const buys = optimizedSquad.filter(o => !mandatoryPlayer.includes(o)).map(a => elements.find(el => el.web_name === a))
                const sells = replacesPlayer.map(a => elements.find(el => el.web_name === a));
                console.log('\n')
                console.log('---------------------');
                console.log(`${managerInfo.name}`)
                console.log(`${managerInfo.player_first_name} ${managerInfo.player_last_name}`)
                console.log('---------------------');
                
                console.log('RECOMMENDED TRANSFERS')
                console.log('---------------------');
                console.log(`TRF_IN \u2B82 TRF_OUT`)
                console.log('---------------------');
                for (let buy of buys) {
                    if (sells.length > 0 && buy) {
                        const sellIndex = sells.findIndex(s => s.element_type === buy.element_type)
                        const transfer = {in: buy.web_name, cost_in: buy.now_cost/10, out: sells[sellIndex].web_name, cost_out: sells[sellIndex].now_cost/10};
                        console.log(`${transfer.in} (${transfer.cost_in}£) \u2B82 ${transfer.out} (${transfer.cost_out}£)`)
                        sells.splice(sellIndex, 1);
                    }
                }

                console.log('---------------------');
                
                showCommand();

                console.log('\n')
                console.log(`================`)
                console.log('\n')
            } catch (error) {
                console.log(error.mesage);
                willReplace += 1;
                console.log(`replace + 1 = ${willReplace}`)
                optimizationProcess();
            }
        }

        optimizationProcess();
    })
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
            ['xp', fplData.getTotalXPMultiplies({elements, teams}, gameWeek, inputGw && inputGw > gameWeek ? (inputGw - gameWeek) : 2, picksData, fixtures).totalXPoints],
            
            [`team_${e.team_code}`, 1],
            [`is_playing`, e.status === 'a' ? 1 : 0],
        ]);

        
        return {
            ...e, 
            max_pick: 1, 
            ...entries,
        }})
            .filter(filterCat)
            .map(e => [`${e.web_name}${suffix}`, e]));

    
    })

    const showCommand = () => {
        console.log('\n')
        console.log(`node index --playerId=${playerId} --replace=${willReplace} --optimize-max=${optimizeMax}`)
        if (playerId === '471950' && willReplace === 1 && optimizeMax === 'xp') {
            console.log(`(default command)`)
        }
        console.log('customize this script to get the different result!')
    }

    const getPosition = (element_type) => {
        if (element_type === 1) {
            return 'GKP'
        } else if (element_type === 2) {
            return 'DEF'
        } else if (element_type === 3) {
            return 'MID'
        } else if (element_type === 4) {
            return 'FWD'
        }
    }


    // TODO
    // retry process
    // FREE TRANSFER VARIABLES
    // WILDCARD, FH, BB, TC