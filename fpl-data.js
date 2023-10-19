
const playerData = new Promise((resolve, reject) => {
    const axios = require('axios');
    
    axios({
        method: 'get',
        url: 'https://fantasy.premierleague.com/api/bootstrap-static/',
        responseType: 'application/json'
      })
    .then(function (response) {
        resolve((JSON.parse(response.data)).elements)
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

module.exports = {
    playerData,
    getExpectedPoints
}