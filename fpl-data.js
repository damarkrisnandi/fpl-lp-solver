
const playerData = new Promise((resolve, reject) => {
    const axios = require('axios');
    
    axios({
        method: 'get',
        url: 'https://fantasy.premierleague.com/api/bootstrap-static/',
        responseType: 'application/json'
      })
    .then(function (response) {
        resolve((JSON.parse(response.data)))
    });
})

const fixturesData = new Promise((resolve, reject) => {
    const axios = require('axios');
    
    axios({
        method: 'get',
        url: 'https://fantasy.premierleague.com/api/fixtures/',
        responseType: 'application/json'
      })
    .then(function (response) {
        resolve((JSON.parse(response.data)))
    });
})

const picksData = (id, gameWeek) => new Promise((resolve, reject) => {
    const axios = require('axios');
    
    axios({
        method: 'get',
        url: `https://fantasy.premierleague.com/api/entry/${id}/event/${gameWeek}/picks/`,
        responseType: 'application/json'
      })
    .then(function (response) {
        resolve((JSON.parse(response.data)))
    });
})

const getExpectedPoints = (element, gameWeek) => {
    let xP = 0;
    const {element_type, bonus, expected_goals_per_90, expected_assists_per_90, starts_per_90, clean_sheets_per_90, own_goals, expected_goals_conceded_per_90, minutes} = element;
    if (element_type === 4) {
        const xPG = expected_goals_per_90 * 4;
        const xPA = expected_assists_per_90 * 3;
        const pMP = starts_per_90 >= 0.67 ? 2 : (starts_per_90 == 0 ? 0 : 1);
        const xOG = (own_goals/gameWeek) * -1;
        xP = xPG + xPA + pMP + (bonus/gameWeek) + xOG; 
    }
    if (element_type === 3) {
        const xPG = expected_goals_per_90 * 5;
        const xPA = expected_assists_per_90 * 3;
        const xCS = clean_sheets_per_90 * 1;
        const pMP = starts_per_90 >= 0.67 ? 2 : (starts_per_90 == 0 ? 0 : 1);
        const xOG = (own_goals/gameWeek) * -1;
        xP = xPG + xPA + xCS + pMP + (bonus/gameWeek) + xOG; 
    }
    if (element_type === 2) {
        const xPG = expected_goals_per_90 * 6;
        const xPA = expected_assists_per_90 * 3;
        const xCS = clean_sheets_per_90 * 4;
        const pMP = starts_per_90 >= 0.67 ? 2 : (starts_per_90 == 0 ? 0 : 1);
        const xOG = (own_goals/gameWeek) * -1;
        const xGC = expected_goals_conceded_per_90 >= 2 ? -1 : 0
        xP = xPG + xPA + xCS + pMP + (bonus/gameWeek) + xOG + xGC; 
    }

    if (element_type === 1) {
        const xPG = expected_goals_per_90 * 6;
        const xPA = expected_assists_per_90 * 3;
        const xCS = clean_sheets_per_90 * 5;
        const pMP = starts_per_90 >= 0.67 ? 2 : (starts_per_90 == 0 ? 0 : 1);
        const xOG = (own_goals/gameWeek) * -1;
        const xGC = expected_goals_conceded_per_90 >= 2 ? -1 : 0
        xP = xPG + xPA + xCS + pMP + (bonus/gameWeek) + xOG + xGC; 
    }

    xP = xP * (minutes / (90 * gameWeek))

    return xP;
}

const getTotalXPMultiplies = (bootstrap, gameWeek, deltaGW, picksData, fixtures) => {
    const currentFixtures = fixtures.filter(data => data.event === gameWeek + deltaGW);
    const haIndexData = []
    const { elements, teams } = bootstrap;
    for (let f of currentFixtures) {
        const data = {
            home: f.team_h,
            away: f.team_a,
            homeOff: teams.find(t => t.id === f.team_h).strength_attack_home,
            homeDef: teams.find(t => t.id === f.team_h).strength_defence_home,
            awayOff: teams.find(t => t.id === f.team_a).strength_attack_away,
            awayDef: teams.find(t => t.id === f.team_a).strength_defence_away,
            homeDiff: f.team_h_difficulty,
            awayDiff: f.team_a_difficulty
        }

        haIndexData.push(data);
        // console.log(teams.find(t => t.id === f.team_h).short_name, ' v ', teams.find(t => t.id === f.team_a).short_name);
    }

    const myTeam = []
    let totalXPoints = 0;
    for (let pick of picksData.picks) {
        let xPPerElement = 0;
        if (elements.find((o) => pick.element === o.id)) {
            const dataEl = elements.find((o) => pick.element === o.id);

            const xP = getExpectedPoints(dataEl, gameWeek);
            const home = haIndexData.filter(ha => ha.home === dataEl.team);
            const away = haIndexData.filter(ha => ha.away === dataEl.team);

            let haIdxValue = 1;
            if (home && home.length > 0) {
                for (let h of home) {
                    if (dataEl.element_type === 4) {
                        haIdxValue = ((1 * h.homeOff / h.awayDef) + (0 * h.homeDef / h.awayOff)) // * (4 / h.awayDiff);
                    } else if (dataEl.element_type === 3) {
                        haIdxValue = (((8/9) * h.homeOff / h.awayDef) + ((1/9) * h.homeDef / h.awayOff)) // * (4 / h.awayDiff);
                    } else if (dataEl.element_type === 2) {
                        haIdxValue = (((9/15) * h.homeOff / h.awayDef) + ((6/15) * h.homeDef / h.awayOff)) // * (4 / h.awayDiff);
                    } else if (dataEl.element_type === 1) {
                        haIdxValue = ((0 * h.homeOff / h.awayDef) + (1 * h.homeDef / h.awayOff)) // * (4 / h.awayDiff);
                    }
                    totalXPoints += xP * pick.multiplier * haIdxValue;
                    xPPerElement += xP * pick.multiplier * haIdxValue;
                }
            } 
            
            if (away && away.length > 0) {
                for (let a of away) {
                    if (dataEl.element_type === 4) {
                        haIdxValue = ((1 * a.homeOff / a.awayDef) + (0 * a.homeDef / a.awayOff)) // * (4 / a.homeDiff);
                    } else if (dataEl.element_type === 3) {
                        haIdxValue = (((8/9) * a.homeOff / a.awayDef) + ((1/9) * a.homeDef / a.awayOff)) // * (4 / a.homeDiff);
                    } else if (dataEl.element_type === 2) {
                        haIdxValue = (((9/15) * a.homeOff / a.awayDef) + ((6/15) * a.homeDef / a.awayOff)) // * (4 / a.homeDiff);
                    } else if (dataEl.element_type === 1) {
                        haIdxValue = ((0 * a.homeOff / a.awayDef) + (1 * a.homeDef / a.awayOff)) // * (4 / a.homeDiff);
                    }
                }
                totalXPoints += xP * pick.multiplier * haIdxValue;
                xPPerElement += xP * pick.multiplier * haIdxValue;
            }

            myTeam.push({...dataEl, multiplier: pick.multiplier, xPFinal: xPPerElement})

        }
    }   
    return {myTeam, totalXPoints};
}

module.exports = {
    playerData,
    fixturesData,
    picksData,
    getExpectedPoints,
    getTotalXPMultiplies
}