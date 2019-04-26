var chart;

function radarChartClick() {

    if(chart) {
        chart.destroy();
    }

    hideError();
    isValid = true;
    errorMessages = [];

    const selectedClasses = getSelectedClasses();
    let selectedLevel = parseInt(document.querySelector('#tbLevel').value, 10);

    if (selectedLevel < 5 || selectedLevel > 200 || isNaN(selectedLevel)) {
        selectedLevel = 205;
    }

    if (selectedClasses.length < 1) {
        errorMessages.push('Please select atleast one class.');
        isValid = false;
    }

    if(isValid){
        let radarChartObject = assembleRadarChartObject(selectedClasses, _allClassData, _allCharacterColors, selectedLevel, _statNames);
        chart = new Chart(document.getElementById("characterStatsRadarChart"), radarChartObject);
    } else {
        const divs = createErrorDivs(errorMessages);
        showError(divs);
    }
}

function getSelectedClasses() {
    const selectedCharacterClasses = [];

    if (document.querySelector('#cbHUcast').checked){
        selectedCharacterClasses.push('HUcast');
    }
    if (document.querySelector('#cbHUmar').checked){
        selectedCharacterClasses.push('HUmar');
    }
    if (document.querySelector('#cbHUcaseal').checked){
        selectedCharacterClasses.push('HUcaseal');
    }
    if (document.querySelector('#cbHUnewearl').checked){
        selectedCharacterClasses.push('HUnewearl');
    }

    if (document.querySelector('#cbRAmar').checked){
        selectedCharacterClasses.push('RAmar');
    }
    if (document.querySelector('#cbRAmarl').checked){
        selectedCharacterClasses.push('RAmarl');
    }
    if (document.querySelector('#cbRAcast').checked){
        selectedCharacterClasses.push('RAcast');
    }
    if (document.querySelector('#cbRAcaseal').checked){
        selectedCharacterClasses.push('RAcaseal');
    }

    if (document.querySelector('#cbFOmar').checked){
        selectedCharacterClasses.push('FOmar');
    }
    if (document.querySelector('#cbFOmarl').checked){
        selectedCharacterClasses.push('FOmarl');
    }
    if (document.querySelector('#cbFOnewm').checked){
        selectedCharacterClasses.push('FOnewm');
    }
    if (document.querySelector('#cbFOnewearl').checked){
        selectedCharacterClasses.push('FOnewearl');
    }

    return selectedCharacterClasses;
}

function showError(divs) {
    const element = document.querySelector('#error');
    element.classList.remove('hidden');
    element.innerHTML = divs;
}

function createErrorDivs(messages) {
    let divs = '';
    let div = '<div>';
    let endDiv = '</div>';

    messages.forEach(message => {
        divs = divs + div + message + endDiv;
    });

    return divs;
}

function hideError() {
    const element = document.querySelector('#error');
    element.classList.add('hidden');
    element.innerHTML = '';
}