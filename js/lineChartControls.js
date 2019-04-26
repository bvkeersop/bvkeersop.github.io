var graph;

function lineGraphClick() {
    
    if (graph) {
        graph.destroy();
    }

    const errorMessages = [];
    let isValid = true;
    hideError();


    let startLevel = parseInt(document.querySelector('#tbStart').value, 10);
    let endLevel = parseInt(document.querySelector('#tbEnd').value, 10);

    if (startLevel < 5) {
        startLevel = 5;
    }

    if (endLevel > 200) {
        endLevel = 200;
    }

    if (isNaN(startLevel)) {
        errorMessages.push('Please enter a valid start level.');
        isValid = false;
    }

    if (isNaN(endLevel)) {
        errorMessages.push('Please enter a valid end level.');
        isValid = false;
    }

    const selectedClasses = getSelectedClasses();
    const selectedStats = getSelectedStats();

    if (selectedClasses.length < 1) {
        errorMessages.push('Please select atleast one class.');
        isValid = false;
    }

    if (selectedStats.length < 1 ) {
        errorMessages.push('Please select atleast one stat.');
        isValid = false;
    }

    if (startLevel >= endLevel) {
        errorMessages.push('Start level should be lower than end level.');
        isValid = false;
    }

    if(isValid) {
        const title = 'Character stat growth';
        const lineGraphDataObject = assembleLineGraphObject(selectedClasses, selectedStats, title, _allClassData, _allStatColors, startLevel, endLevel);
        graph = new Chart(document.getElementById('characterStatLineGraph'), lineGraphDataObject);
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

function getSelectedStats() {
    const selectedStats = [];

    if (document.querySelector('#cbATP').checked){
        selectedStats.push('ATP');
    }
    if (document.querySelector('#cbDFP').checked){
        selectedStats.push('DFP');
    }
    if (document.querySelector('#cbMST').checked){
        selectedStats.push('MST');
    }
    if (document.querySelector('#cbATA').checked){
        selectedStats.push('ATA');
    }
    if (document.querySelector('#cbEVP').checked){
        selectedStats.push('EVP');
    }
    if (document.querySelector('#cbHP').checked){
        selectedStats.push('HP');
    }
    if (document.querySelector('#cbTP').checked){
        selectedStats.push('TP');
    }

    return selectedStats;
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