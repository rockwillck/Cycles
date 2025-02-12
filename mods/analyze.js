class Analyze {

    // https://stackoverflow.com/questions/7343890/standard-deviation-javascript
    static getStandardDeviation (array) {
        let n = array.length
        let mean = array.reduce((a, b) => a + b) / n
        return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
      }

    static linearRegression(xs, ys) {
        let sxy = 0
        let sxx = 0
        let syy = 0
        let xbar = xs.reduce((a, b) => a + b) / xs.length
        let ybar = ys.reduce((a, b) => a + b) / ys.length
        for (let i = 0; i < xs.length; i++) {
            sxy += (xs[i] - xbar)*(ys[i] - ybar)
            sxx += (xs[i] - xbar)**2
            syy += (ys[i] - ybar)**2
        }
        let b = sxy/sxx
        let a = ybar - b*xbar
        let r = sxy/Math.sqrt(sxx*syy)
        return [a, b, r]
    }

    static extractIntensities(l) {
        return l.map(x => x.intensity)
    }
    static extractDates(l) {
        return l.map(x => x.date)
    }

    static groupTotalIntensitiesByTime(l1, l2) {
        let chunks = new Array(l2.length).fill(0)
        for (let ev1 of l1) {
            for (let i = 0; i < l2.length; i++) {
                let ev2 = l2[i]
                if (ev1.date < ev2.date && (i == 0 || (ev1.date > l2[i-1].date))) {
                    chunks[i] += ev1.intensity
                }
            }
        }
        return chunks
    }
    static groupTotalFrequenciesByTime(l1, l2) {
        let chunks = new Array(l2.length - 1).fill(0)
        for (let ev1 of l1) {
            for (let i = 1; i < l2.length; i++) {
                let ev2 = l2[i]
                if (ev1.date < ev2.date && (ev1.date > l2[i-1].date)) {
                    chunks[i - 1] += ev1.intensity
                }
            }
        }
        for (let i = 0; i < chunks.length; i++) {
            chunks[i] /= l2[i+1].date - l2[i].date
        }
        return chunks
    }

    static intensityToIntensity(l1, l2) {
        // per event in l2, leading up
        return this.findTrend(this.groupTotalIntensitiesByTime(l1, l2), this.extractDates(l2))
    }
    static frequencyToIntensity(l1, l2) {
        return this.findTrend(this.groupTotalIntensitiesByTime(l1, l2).slice(1), this.groupTotalFrequenciesByTime(l2, l1))
    }
    static frequencyToFrequency(l1, l2) {
        let chunks2 = new Array(l2.length - 1).fill(0)
        for (let i = 1; i < l2.length - 1; i++) {
            chunks2[i] = 1/(l2[i + 1].date - l2[i].date)
        }
        return this.findTrend(this.groupTotalFrequenciesByTime(l1, l2), chunks2)
    }

    static prepForPredict(list) {
        let rangeI = this.extractIntensities(list)
        rangeI.splice(0,1)
        let sumI = 0
        for (let i of rangeI) {
            sumI += i
        }
        let muI = sumI/rangeI.length
        let sdI = this.getStandardDeviation(rangeI)
        rangeI = rangeI.map(t => sdI == 0 ? 0 : (t-muI)/sdI)

        let dates = this.extractDates(list)
        let rangeT = []
        for (let k = 0; k < dates.length - 1; k++) {
            rangeT.push(dates[k+1] - dates[k])
        }
        let sumT = 0
        for (let t of rangeT) {
            sumT += t
        }
        let muT = sumT/rangeT.length
        let sdT = this.getStandardDeviation(rangeT)
        rangeT = rangeT.map(t => sdT == 0 ? 0 : (t-muT)/sdT)

        return [[rangeI, muI, sdI], [rangeT, muT, sdT]]
    }
    static calcCoeff(rangeI, rangeT, lag) {
        // autoregressive multivariate linear regression (lag)
        let designMatrix = []
        for (let r = 0; r < rangeT.length - lag - 1; r++) {
            let row = [1]

            for (let l = lag; l >= 0; l--) {
                row.push(rangeI[l + r])
                row.push(rangeT[l + r])
            }

            designMatrix.push(row)
        }
        designMatrix = new Matrix(designMatrix)
        let targetMatrix = []
        for (let r = lag + 1; r < rangeT.length; r++) {
            targetMatrix.push([rangeI[r], rangeT[r]])
        }
        targetMatrix = new Matrix(targetMatrix)

        let coeff = designMatrix.transpose().multiply(designMatrix)
        for (let r = 0; r < coeff.mat.length; r++) {
            coeff.mat[r][r] += 0.01
        }
        return coeff.invert().multiply(designMatrix.transpose()).multiply(targetMatrix)
    }
    static buildLaggedRows(toBePredicted, lag, rangeI, rangeT) {
        let laggedRowsI = []
        let laggedRowsT = []

        for (let k = toBePredicted - 1; k >= toBePredicted - 2*lag; k--) {
            laggedRowsI.push(rangeI[k])
            laggedRowsT.push(rangeT[k])
        }

        return [laggedRowsI, laggedRowsT]
    }
    static calcPredict(rowsI, rowsT, coeff) {
        let alpha = coeff.mat[0]
        let betas = coeff.mat.slice(1)

        let predictI = alpha[0]
        let predictT = alpha[1]

        for (let j = 0; j < rowsI.length; j++) {
            if (j % 2 == 0) {
                predictI += betas[j][0]*rowsI[j]
                predictT += betas[j][1]*rowsI[j]
            } else {
                predictI += betas[j][0]*rowsT[j]
                predictT += betas[j][1]*rowsT[j]
            }
        }

        return [predictI, predictT]
    }
    static predictNext(list, lag, last=list.length-1) {
        if (list.length > lag + 2) {
            let prepped = this.prepForPredict(list)
            let rangeI = prepped[0][0]
            let rangeT = prepped[1][0]
            let coeff = this.calcCoeff(rangeI, rangeT, lag)
    
            let laggedRows = this.buildLaggedRows(last, lag, rangeI, rangeT)
            let laggedRowsI = laggedRows[0]
            let laggedRowsT = laggedRows[1]
    
            let predicted = this.calcPredict(laggedRowsI, laggedRowsT, coeff)
            let predictI = predicted[0]
            let predictT = predicted[1]

            return [predictT*prepped[1][2] + prepped[1][1], predictI*prepped[0][2] + prepped[0][1]]
        } else {
            let ab = this.linearRegression(list.map((x, i) => i), this.extractDates(list))
            let a = ab[0]
            let b = ab[1]
            return [a + b*list.length - list[list.length - 1].date, undefined]
        }
    }

    // l1 and l2 are the same length
    // static findTrend(l1, l2) {
    //     let upCount = 0
    //     let downCount = 0
    //     let equalCount = 0
    //     for (let i = 0; i < l1.length; i++) {
    //         for (let j = i + 1; j < l1.length; j++) {
    //             let tuple1 = [l1[i], l1[i+1]]
    //             let tuple2 = [l2[j], l2[j+1]]
    //             let slope = (tuple1[0] - tuple1[1])/(tuple2[0] - tuple2[1])
    //             // slope = Math.round(slope*10)/10
    //             if (Math.sign(slope) > 0) {
    //                 upCount++
    //             } else if (Math.sign(slope) < 0) {
    //                 downCount++
    //             } else {
    //                 equalCount++
    //             }
    //         }
    //     }
    //     if (Math.abs(upCount - downCount)/(upCount + downCount) < 0.01) {
    //         return 0
    //     } else {
    //         if (Math.max(upCount, downCount, equalCount) == upCount) {
    //             return upCount/(upCount+downCount)
    //         } else if (Math.max(upCount, downCount, equalCount) == downCount) {
    //             return -downCount/(upCount+downCount)
    //         }
    //     }
    //     return 0
    // }
    static findTrend(l1, l2) {
        let range1 = [Math.min(...l1), Math.max(...l1)]
        let range2 = [Math.min(...l2), Math.max(...l2)]
        l1 = l1.map(x => (x - range1[0])/(range1[1] - range1[0]))
        l2 = l2.map(x => (x - range2[0])/(range2[1] - range2[0]))

        let pts = []
        let xs = []
        let ys = []
        for (let i = 0; i < l1.length; i++) {
            pts.push([l1[i], l2[i]])
            xs.push(l1[i])
            ys.push(l2[i])
        }

        xs.sort()
        ys.sort()
        if (pts.length > 1) {
            for (let j = 0; j < pts.length; j++) {
                let pt = pts[j]
                let xi = xs.indexOf(pt[0])
                let yi = ys.indexOf(pt[1])
                pts[j] = [xi * 1/(pts.length - 1), yi * 1/(pts.length - 1)]
            }
            
            let totalDiffPos = 0
            let totalDiffNeg = 0
            for (let pt of pts) {
                totalDiffPos += (pt[1] - pt[0])**2
                totalDiffNeg += (pt[1] - 1 + pt[0])**2
            }
            let uppies = 0
            let downies = 0
            let sp = pts.toSorted((a, b) => a[0] - b[0])
            for (let i = 0; i < sp.length - 1; i++) {
                if (sp[i+1][1] - sp[i][1] > 0) {
                    uppies++
                } else {
                    downies++
                }
            }
            totalDiffPos /= pts.length
            totalDiffNeg /= pts.length
            let out = (totalDiffPos - totalDiffNeg)/(totalDiffNeg + totalDiffPos)*Math.abs((uppies-downies)/(uppies+downies))
            if (Math.abs(out) > 0.2**2) {
                return out
            }
            return 0
        } else {
            return 0
        }
    }
}