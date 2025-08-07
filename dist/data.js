var groups = [];
var cycles = new Map();

function parseCSV(text) {
    const rows = text.split("\n").map(row => row.split(","));
    const headers = rows[0];
    const data = rows.slice(1).map(row => {
        let record = {};
        headers.forEach((header, index) => {
            record[header] = row[index];
        });
        return record;
    });
    return data;
}

fetch("research_data/input/KAGGLE_FedCycleData071012.csv")
    .then(response => response.text())
    .then(data => {
        const records = parseCSV(data);
        const groupedRecords = groupByClientID(records);
        const filteredGroups = groupedRecords.filter(group => group.length > 4);
        let outputFileContent = generateOutputFileContent(filteredGroups);
        console.log(outputFileContent);
    });

function groupByClientID(records) {
    let groups = [];
    let currentClientID = "";
    let currentGroup = [];

    records.forEach(record => {
        if (record.ClientID !== currentClientID) {
            if (currentGroup.length > 0) {
                groups.push(currentGroup);
            }
            currentGroup = [record];
            currentClientID = record.ClientID;
        } else {
            currentGroup.push(record);
        }
    });

    if (currentGroup.length > 0) {
        groups.push(currentGroup);
    }

    return groups;
}

function generateOutputFileContent(groups) {
    let outputFileContent = "";

    groups.forEach(group => {
        const clientID = group[0].ClientID;
        const cycle = new Cycle(clientID);
        const groupObj = new Group(clientID);
        groupObj.registerCycle(cycle);

        let lastDate = new Date("1/1/2000");
        let output = "";

        for (let i = 0; i < group.length - 1; i++) {
            const record = group[i];
            const date = new Date(lastDate);
            date.setDate(date.getDate() + parseInt(record.LengthofCycle));
            cycle.registerEvent(new Event(date, parseInt(record.TotalMensesScore)));

            if (i >= 4) {
                const analysisResult = groupObj.analyze();
                const predictions = analysisResult.predictions[cycle.id];
                const nextRecord = group[i + 1];
                const actualValues = [
                    parseInt(nextRecord.LengthofCycle) * 24 * 60,
                    parseInt(nextRecord.TotalMensesScore)
                ];

                if (!predictions.includes(NaN) && !actualValues.includes(NaN)) {
                    output += `${predictions[0]} ${predictions[1]} ${actualValues[0]} ${actualValues[1]}\n`;
                }
            }
        }

        if (output !== "") {
            outputFileContent += `${clientID}\n${output}\n`;
        }
    });

    return outputFileContent;
}

function calculateIntestinalTravelTime(df, sfs, idti) {
    return 103 - 1.23 * df - 4.69 * sfs + 0.638 * idti;
}

function calculateMean(array) {
    return array.reduce((sum, value) => sum + value, 0) / array.length;
}

function calculateStandardDeviation(array, meanValue) {
    return Math.sqrt(array.reduce((sum, value) => sum + (value - meanValue) ** 2, 0) / array.length);
}

function generateGaussianRandom(mean = 0, stdDev = 1) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * stdDev;
}

function generateYValues(data, correlation) {
    const fValues = data.map(([x1, x2, x3]) => calculateIntestinalTravelTime(x1, x2, x3));
    const meanF = calculateMean(fValues);
    const stdF = calculateStandardDeviation(fValues, meanF);
    const sigmaE = stdF * Math.sqrt(1 - correlation ** 2);
    return fValues.map(fx => correlation * fx + generateGaussianRandom(0, sigmaE));
}

function calculateCorrelationCoefficient(x, y) {
    const meanX = calculateMean(x);
    const meanY = calculateMean(y);
    const stdX = calculateStandardDeviation(x, meanX);
    const stdY = calculateStandardDeviation(y, meanY);
    const covariance = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0) / x.length;
    return covariance / (stdX * stdY);
}

var outputString = "";

function analyzeFecalData(index) {
    const data = [];
    const fourWeeks = new Array(28 * 24).fill(0);
    let numPoops = 0;
    let startDate = new Date("1/1/2025");
    const poopDates = [];

    for (let hour = 0; hour < 28 * 24; hour++) {
        if (Math.random() < 0.3) {
            fourWeeks[hour] = Math.floor(Math.random() * 6) + 1;
            if (numPoops >= 3) {
                const frequency = calculateFrequency(fourWeeks, hour);
                const totalScore = calculateTotalScore(fourWeeks, hour);
                const interval = calculateInterval(fourWeeks, hour);
                poopDates.push(new Date(startDate));
                data.push([frequency, totalScore, interval]);
            }
            numPoops++;
        }
        startDate.setHours(startDate.getHours() + 1);
    }

    outputString += fourWeeks.join(",") + "\n";

    const correlation = 0.736;
    const yValues = generateYValues(data, correlation);
    const cycle1 = new Cycle("sfs");
    const cycle2 = new Cycle("intesttravel");
    const group = new Group("hi");
    group.registerCycle(cycle1);
    group.registerCycle(cycle2);

    const xys = [];
    poopDates.forEach((date, k) => {
        const nextDate = new Date(date);
        nextDate.setHours(nextDate.getHours() + 1);
        const x = data[k][index];
        const y = yValues[k];
        cycle1.registerEvent(new Event(date, x));
        cycle2.registerEvent(new Event(nextDate, y));
        xys.push([x, y]);
    });

    const kendallTau = calculateKendallTau(xys);
    return [group.analyze().trends[cycle1.id][0][1], kendallTau];
}

function calculateFrequency(fourWeeks, hour) {
    let frequency = 0;
    for (let i = Math.max(0, hour - 7 * 24); i < hour; i++) {
        if (fourWeeks[i] > 0) {
            frequency++;
        }
    }
    return frequency;
}

function calculateTotalScore(fourWeeks, hour) {
    let totalScore = 0;
    let numCounted = 0;
    for (let i = hour - 1; i >= 0; i--) {
        if (fourWeeks[i] > 0) {
            totalScore += fourWeeks[i];
            numCounted++;
        }
        if (numCounted === 3) {
            break;
        }
    }
    return totalScore;
}

function calculateInterval(fourWeeks, hour) {
    let interval = 0;
    let numCounted = 0;
    for (let i = hour - 1; i >= 0; i--) {
        if (fourWeeks[i] > 0) {
            numCounted++;
        }
        if (numCounted === 3) {
            interval = hour - 1 - i;
            break;
        }
    }
    return interval;
}

function calculateKendallTau(xys) {
    let concordant = 0;
    let discordant = 0;
    for (let i = 0; i < xys.length - 1; i++) {
        for (let j = i + 1; j < xys.length; j++) {
            const [x1, y1] = xys[i];
            const [x2, y2] = xys[j];
            if (Math.sign(y2 - y1) === Math.sign(x2 - x1)) {
                concordant++;
            } else {
                discordant++;
            }
        }
    }
    return Math.abs((concordant - discordant) / (concordant + discordant));
}

function analyzeRandomData() {
    const cycle1 = new Cycle("1");
    const cycle2 = new Cycle("2");
    const group = new Group("hi2");
    group.registerCycle(cycle1);
    group.registerCycle(cycle2);

    let currentDate = new Date("1/1/2000");
    const xys = [];

    for (let i = 0; i < 30; i++) {
        const date = new Date(currentDate);
        const x = Math.random();
        const y = Math.random();
        cycle1.registerEvent(new Event(date, x));
        date.setHours(date.getHours() + 1);
        cycle2.registerEvent(new Event(date, y));
        date.setHours(date.getHours() + 2);
        currentDate = new Date(date);
        xys.push([x, y]);
        outputString += `${x},${y}\n`;
    }

    const kendallTau = calculateKendallTau(xys);
    return [group.analyze().trends[cycle1.id][0][1], kendallTau];
}

function downloadFile(filename, text) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

let outputOutputString = "";
for (let index = 0; index < 3; index++) {
    outputOutputString = "";
    let trendCount = 0;
    let trendTauCount = 0;
    for (let i = 0; i < 10000; i++) {
        const analysis = analyzeFecalData(index);
        outputOutputString += outputString + "\n";
        outputString = "";
        const coefficient = analysis[0]["ii1"];
        const tau = analysis[1];
        trendTauCount += tau > 0.3;
        if (coefficient !== 0) {
            trendCount++;
        }
    }
    console.log("prepping file");
    downloadFile(`${index}-defec.txt`, outputOutputString);
}

let trendCount = 0;
let trendTauCount = 0;
for (let i = 0; i < 10000; i++) {
    const analysis = analyzeRandomData();
    const coefficient = analysis[0]["ii1"];
    if (coefficient !== 0) {
        trendCount++;
    }
    trendTauCount += analysis[1] > 0.2;
    outputString += "\n";
}
console.log("prepping file");
downloadFile(`rand.txt`, outputString);