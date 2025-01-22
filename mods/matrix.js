class Matrix {
    constructor(mat) {
        this.mat = mat
    }

    // https://stackoverflow.com/questions/17428587/transposing-a-2d-array-in-javascript
    transpose() {
        return new Matrix(this.mat[0].map((_, colIndex) => this.mat.map(row => row[colIndex])))
    }

    // http://web.archive.org/web/20210406035905/http://blog.acipo.com/matrix-inversion-in-javascript/
    invert() {
        if (this.mat.length !== this.mat[0].length) { return; }
    
        let i = 0, ii = 0, j = 0, dim = this.mat.length, e = 0, t = 0;
        let I = [], C = [];
        for (i = 0; i < dim; i += 1) {
            I[I.length] = [];
            C[C.length] = [];
            for (j = 0; j < dim; j += 1) {
    
                if (i == j) { I[i][j] = 1 }
                else { I[i][j] = 0; }
    
                C[i][j] = this.mat[i][j]
            }
        }

        for (i = 0; i < dim; i += 1) {
            e = C[i][i]
    
            if (e == 0) {
                for (ii = i + 1; ii < dim; ii += 1) {
                    if (C[ii][i] != 0) {
                        for (j = 0; j < dim; j++) {
                            e = C[i][j]
                            C[i][j] = C[ii][j]
                            C[ii][j] = e
                            e = I[i][j]
                            I[i][j] = I[ii][j]
                            I[ii][j] = e
                        }
                        break;
                    }
                }
                e = C[i][i]
                if (e == 0) { 
                    return 
                }
            }
    
            for (j = 0; j < dim; j++) {
                C[i][j] = C[i][j] / e
                I[i][j] = I[i][j] / e
            }

            for (ii = 0; ii < dim; ii++) {
                if (ii == i) { continue }
    
                e = C[ii][i]
    
                for (j = 0; j < dim; j++) {
                    C[ii][j] -= e * C[i][j]
                    I[ii][j] -= e * I[i][j]
                }
            }
        }
        return new Matrix(I);
    }

    multiply(b) {
        let a = this.mat
        b = b.mat
        let aNumRows = a.length, aNumCols = a[0].length,
        bNumRows = b.length, bNumCols = b[0].length,
        m = new Array(aNumRows);  // initialize array of rows
        for (let r = 0; r < aNumRows; ++r) {
        m[r] = new Array(bNumCols); // initialize the current row
        for (let c = 0; c < bNumCols; ++c) {
            m[r][c] = 0;             // initialize the current cell
            for (let i = 0; i < aNumCols; ++i) {
            m[r][c] += a[r][i] * b[i][c];
            }
        }
        }
        return new Matrix(m);
    }

    add(a) {
        let cop = []
        for (let r = 0; r < this.mat.length; r++) {
            let row = []
            for (let c = 0; c < this.mat[r].length; c++) {
                row.push(this.mat[r][c] + a[r][c])
            }
            cop.push(row)
        }
        return cop
    }
}