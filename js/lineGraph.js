function assembleLineGraphObject(selectedClasses, selectedStats, title, allClassData, allStatColors, startLevel, endLevel) {

    if (startLevel < 5) {
        startLevel = 5;
    }

    if (endLevel > 200) {
        endLevel = 200;
    }

    startLevel = Math.ceil(startLevel/5)*5;
    endLevel = Math.ceil(endLevel/5)*5;


    let scaleLabels = createLevelArray(startLevel, endLevel);
    let dataSets = [];

    for (let i = 0; i < selectedClasses.length; i++) {
        for (let j = 0; j < selectedStats.length; j++) {
            let dataLabel = `${selectedClasses[i]}(${selectedStats[j]})`;
            let characterStatsDataObject = getCharacterClassDataObject(selectedClasses[i], allClassData);
            let characterStatsDataObjectInRange = getCharacterClassDataInRange(startLevel, endLevel, characterStatsDataObject);
            console.log(characterStatsDataObjectInRange);
            let statArray = createSingleStatArray(selectedStats[j], characterStatsDataObjectInRange);
            let modifier = i * (100 / selectedClasses.length);
            let rgb = getStatColor(selectedStats[j], allStatColors, modifier);
            let dataSet = createLineChartDataSet(statArray, dataLabel, rgb);
            dataSets.push(dataSet);
        }
    }
    
    let lineGraphObject = createLineGraphObject(scaleLabels, dataSets, title);
    return lineGraphObject;
}

function createLevelArray(lower, upper) {
    let levelArray = []
    for (let i = lower; i <= upper; i = i+5){
        levelArray.push(i);
    }
    return levelArray;
}

function createSingleStatArray(statName, characterClassData) {
    let singleStatArray = [];
    for (let i = 0; i < characterClassData.levelData.length; i++) {
        let singleStat = characterClassData.levelData[i].stats[statName];
        singleStatArray.push(singleStat);
    }
    return singleStatArray;
}

function createLineGraphObject(labels, dataSets, title) {
    let lineGraphObject = {
        type: 'line',
        data: {
          labels: labels,
          datasets: dataSets,
        options: {
          title: {
            display: true,
            text: title
          }
        }
      }
    }
    return lineGraphObject;
}

function createLineChartDataSet(data, label, rgb) {
    let dataSet = { 
        data: data,
        label: label,
        backgroundColor: `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 0.5)`,
        borderColor: `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 0.75)`,
        pointBorderColor: `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 1)`,
        pointBackgroundColor: `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 1)`,
        fill: false
      }
     return dataSet;
}

createLevelArray();