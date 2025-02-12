var groups = []
var cycles = new Map()

function parseCSV(txt) {
    let rows = txt.split("\n").map(r => r.split(","))
    let head = rows[0]
    let df = []
    for (let k = 1; k < rows.length; k++) {
        let r = {}
        for (let i = 0; i < head.length; i++) {
            r[head[i]] = rows[k][i]
        }
        df.push(r)
    }
    return df
}

// fetch("research_data/input/KAGGLE_FedCycleData071012.csv").then(
//     r => r.text().then(data => {
//         let df = parseCSV(data)
//         let groups = []
//         let cur = ""
//         let cg = []
//         for (let entry of df) {
//             if (entry.ClientID != cur) {
//                 groups.push(cg)
//                 cg = [entry]
//                 cur = entry.ClientID
//             } else {
//                 cg.push(entry)
//             }
//         }
//         groups.push(cg)
//         let ming = groups.filter(x => x.length > 4)
//         let outfile = ""
//         for (let g of ming) {
//             let group = new Group(g[0].ClientID)
//             let evs = new Cycle(g[0].ClientID)
//             group.registerCycle(evs)
//             let lastDate = new Date("1/1/2000")
//             let output = ""
//             for (let i = 0; i < g.length - 1; i++) {
//                 let e = g[i]
//                 let date = lastDate
//                 date.setDate(date.getDate() + parseInt(e.LengthofCycle))
//                 evs.registerEvent(new Event(date, parseInt(e.TotalMensesScore)))
//                 if (i >= 4) {
//                     let res = group.analyze()
//                     let pred = res.predictions[evs.id]
//                     let act = g[i+1]
//                     let actual = [parseInt(act.LengthofCycle)*24*60,parseInt(act.TotalMensesScore)]
//                     if (!pred.includes(NaN) && !actual.includes(NaN)) {
//                         output += `${pred[0]} ${pred[1]} ${actual[0]} ${actual[1]}\n`
//                     }
//                 }
//             }
//             if (output != "") {
//                 outfile += `${g[0].ClientID}\n${output}\n`
//             }
//         }
//         console.log(outfile)
//     })
// )

function f(df, sfs, idti) {
    return 103 - 1.23 * df - 4.69 * sfs + 0.638 * idti;
}

function mean(arr) {
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

function stdDev(arr, meanVal) {
    return Math.sqrt(arr.reduce((sum, val) => sum + (val - meanVal) ** 2, 0) / arr.length);
}

function gaussianRandom(mean = 0, stdDev = 1) {
    let u1 = Math.random();
    let u2 = Math.random();
    let z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * stdDev;
}

function generateYValues(data, r) {
    let fValues = data.map(([x1, x2, x3]) => f(x1, x2, x3));

    let meanF = mean(fValues);
    let stdF = stdDev(fValues, meanF);

    let sigmaE = stdF * Math.sqrt(1 - r ** 2);

    let yValues = fValues.map(fx => r * fx + gaussianRandom(0, sigmaE));

    return yValues;
}

function correlationCoefficient(x, y) {
    let meanX = mean(x);
    let meanY = mean(y);
    let stdX = stdDev(x, meanX);
    let stdY = stdDev(y, meanY);

    let covariance = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0) / x.length;
    
    return covariance / (stdX * stdY);
}

function fecalAnal(ind) {
    let data = [];
    let fourweeks = new Array(28*24).fill(0)
    let numpoops = 0
    let startDate = new Date("1/1/2025")
    let poopdates = []
    for (let poop = 0; poop < 28*24; poop++) {
        if (Math.random() < 0.3) {
            fourweeks[poop] = Math.floor(Math.random()*6)+1
            if (numpoops >= 3) {
                let freq = 0
                for (let p = Math.max(0, poop - 7*24); p < poop; p++) {
                    if (fourweeks[p] > 0) {
                        freq++
                    }
                }
                let totalscore = 0
                let numCounted = 0
                let interval = 0
                for (let hr = poop - 1; hr >= 0; hr--) {
                    if (fourweeks[hr] > 0) {
                        totalscore += fourweeks[hr]
                        numCounted++
                    }
                    if (numCounted == 3) {
                        interval = poop - 1 - hr
                        break
                    }
                }
                poopdates.push(new Date(+startDate))
                data.push([freq, totalscore, interval])
            }
            numpoops++
        }
        startDate.setHours(startDate.getHours() + 1);
    }

    // Desired correlation
    let r = 0.736;

    let yValues = generateYValues(data, r);

    let cyc1 = new Cycle("sfs")
    let cyc2 = new Cycle("intesttravel")
    let gr = new Group("hi")
    gr.registerCycle(cyc1)
    gr.registerCycle(cyc2)
    let xys = []
    for (let k = 0; k < poopdates.length; k++) {
        let d = new Date(+poopdates[k])
        d.setHours(d.getHours() + 1);
        let x = data[k][ind]
        let y = yValues[k]
        cyc1.registerEvent(new Event(poopdates[k], x))
        cyc2.registerEvent(new Event(d, y))
        xys.push([x,y])
    }

    // kendell tau
    let up = 0
    let down = 0
    for (let i = 0; i < xys.length - 1; i++) {
        for (let j = i+1; j < xys.length; j++) {
            let tuple1 = xys[i]
            let tuple2 = xys[j]
            if (Math.sign(tuple2[1] - tuple1[1]) == Math.sign(tuple2[0] - tuple1[0])) {
                up++
            } else {
                down++
            }
        }
    }

    return [gr.analyze().trends[cyc1.id][0][1], Math.abs((up - down)/(up + down))]
}
function randAnal() {
    let cyc1 = new Cycle("1")
    let cyc2 = new Cycle("2")
    let gr = new Group("hi2")
    gr.registerCycle(cyc1)
    gr.registerCycle(cyc2)
    let curD = new Date("1/1/2000")
    let xys = []
    for (let k = 0; k < 30; k++) {
        let d = new Date(+curD)
        let x = Math.random()
        let y = Math.random()
        cyc1.registerEvent(new Event(d, x))
        d.setHours(d.getHours() + 1);
        cyc2.registerEvent(new Event(d, y))
        d.setHours(d.getHours() + 2);
        curD = new Date(+d)
        xys.push([x, y])
    }

    // kendell tau
    let up = 0
    let down = 0
    for (let i = 0; i < xys.length - 1; i++) {
        for (let j = i+1; j < xys.length; j++) {
            let tuple1 = xys[i]
            let tuple2 = xys[j]
            if (Math.sign(tuple2[1] - tuple1[1]) == Math.sign(tuple2[0] - tuple1[0])) {
                up++
            } else {
                down++
            }
        }
    }

    // console.log(output)
    return [gr.analyze().trends[cyc1.id][0][1], Math.abs((up - down)/(up + down))]
}

for (let ind = 0; ind < 3; ind++) {
    let trend = 0
    let trendTau = 0
    for (let i = 0; i < 10000; i++) {
        let anal = fecalAnal(ind)
        let coeff = anal[0]["ii1"]
        let tau = anal[1]
        trendTau += tau > 0.3
        if (coeff != 0) {
            trend++
        }
    }
}

let trend = 0
let trendTau = 0
for (let i = 0; i < 10000; i++) {
    let anal = randAnal()
    let coeff = anal[0]["ii1"]
    if (coeff != 0) {
        trend++
    }
    trendTau += anal[1] > 0.2
}
