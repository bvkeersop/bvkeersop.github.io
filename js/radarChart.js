function assembleRadarChartObject(selectedCharacterClasses, allClassData, characterColors, selectedLevel, statNames) {
    let dataSets = createRadarChartDataSets(selectedCharacterClasses, allClassData, characterColors, selectedLevel, statNames);
    let radarChartObject = createRadarChartObject(statNames, dataSets, 'Class stats');
    return radarChartObject;
}

function createPercentageStats(characterStatsAtLevel, maximumStatsObject, statNames) {
    var percentageStats = { "ATP": 0, "ATA": 0, "DFP":0, "EVP": 0,"MST": 0,"TP": 0,"HP": 0};
    for(let i = 0; i < statNames.length; i++) {
        percentageStats[statNames[i]] = 
        (characterStatsAtLevel[statNames[i]] / maximumStatsObject[statNames[i]]) * 100;
    }
    return percentageStats;
}

function createStatAtLevelArray(allCharacters, level) {
    let statsAtLevel = [];
    console.log(allCharacters);
    console.log(level);
    for (let i = 0; i < allCharacters.length; i++) {
        let stats = getStatsAtLevel(allCharacters[i], level);
        statsAtLevel.push(stats);
    }
    console.log(statsAtLevel);
    return statsAtLevel;
}

function createMaximumStatsObject(allCharacterStatsAtLevel, statNames) {
    var maximumStats = { "ATP": 0, "ATA": 0, "DFP":0, "EVP": 0,"MST": 0,"TP": 0,"HP": 0};
    for (let i = 0; i < allCharacterStatsAtLevel.length; i++) {
        for (let j =  0; j < statNames.length; j++) {
            maximumStats[statNames[j]] = 
            Math.max(allCharacterStatsAtLevel[i][statNames[j]], maximumStats[statNames[j]]);
        }
    }
    return maximumStats;
}

function createStatArray(percentageStatsObject, statNames) {
    var statArray = []
    for (let i = 0; i < statNames.length; i++) {
        statArray.push(percentageStatsObject[statNames[i]]);
    }
    return statArray;
}

function createRadarChartObject(labels, datasets, title) {
    let radarChartObject = { 
        type: 'radar',
        data: {
        labels: labels,
        datasets: datasets
        },
        options: {
            title: {
                display: true,
                text: title
            },
            scale: {
                ticks: {
                  beginAtZero: true,
                  min: 0,
                  max: 100,
                  stepSize: 10
                },
              },
              legend: {
                position: 'top'
              }
        }
    }
    return radarChartObject;
}

function createRadarChartDataSets(selectedCharacterClasses, allClassData, characterColors, selectedLevel, statNames) {
    let dataSets = [];
    for (let i = 0; i < selectedCharacterClasses.length; i++) {
        let characterClassData = getCharacterClassDataObject(selectedCharacterClasses[i], allClassData);
        let characterStatsAtLevel = getStatsAtLevel(characterClassData, selectedLevel);
        let statsAtLevel = createStatAtLevelArray(allClassData, selectedLevel);
        let maximumStatsObject = createMaximumStatsObject(statsAtLevel, statNames);
        let percentageStatsObject = createPercentageStats(characterStatsAtLevel, maximumStatsObject, statNames);
        let percentageStatArray = createStatArray(percentageStatsObject, statNames);
        let characterColor = getCharacterColor(characterColors, selectedCharacterClasses[i]);
        let dataSet = createRadarChartDataSet(selectedCharacterClasses[i], percentageStatArray, characterColor.color);
        dataSets.push(dataSet);
    }
    return dataSets;
}

function createRadarChartDataSet(className, percentageStatsArray, rgb) {
    let dataSet =
    {
        label: className,
        data: percentageStatsArray,
        fill: true,
        backgroundColor: `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 0.5)`,
        borderColor: `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 0.75)`,
        pointBorderColor: `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 1)`,
        pointBackgroundColor: `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 1)`
    };
    return dataSet;
}