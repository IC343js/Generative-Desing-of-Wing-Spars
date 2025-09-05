function Fij(Envergadura, a0, Cuerda, j, Angulo) {
    return (4 * Envergadura / (a0 * Cuerda) + j / Math.sin(Angulo)) * Math.sin(j * Angulo);
}

function calculateLift(span, chord, aoa, stations, speed, density, includeTwist, includeAilerons) {
    // Aquí puedes realizar los cálculos complejos y usar la función Fij
    let liftDistribution = [];

    for (let j = 1; j <= stations; j++) {
        const lift = Fij(span, density, chord, j, aoa);
        liftDistribution.push(lift);
    }

    // Aquí puedes agregar lógica adicional para torcimiento y alerones si es necesario

    return liftDistribution;
}
//------------------------------------------------------------------------------------------------
function parseCSV(csvData) {
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',');
    const data = lines.slice(1).map(line => line.split(','));

    return { headers, data };
}

function findPosition(headers, searchString) {
    return headers.indexOf(searchString);
}

function getVector(data, startRow, colIndex) {
    const vector = [];
    for (let i = startRow; i < data.length; i++) {
        vector.push(parseFloat(data[i][colIndex]));
    }
    return vector;
}

function getAlphaClVector(alphaVector, clVector) {
    const alphaClVector = [];
    for (let i = 0; i < alphaVector.length; i++) {
        alphaClVector.push({ alpha: alphaVector[i], cl: clVector[i] });
    }
    return alphaClVector;
}

function processData(csvData) {
    const { headers, data } = parseCSV(csvData);
    const alphaPosition = findPosition(headers, "Alpha");
    if (alphaPosition === -1) {
        console.error("Alpha column not found.");
        return;
    }

    const startRow = findPosition(data.map(row => row[0]), "Alpha") + 1;
    const vectorAlpha = getVector(data, startRow, alphaPosition);
    const vectorCl = getVector(data, startRow, alphaPosition + 1);

    return getAlphaClVector(vectorAlpha, vectorCl);
}

function plotAlphaCl(alphaClVector) {
    const ctx = document.getElementById('myChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: alphaClVector.map(point => point.alpha),
            datasets: [{
                label: 'Alpha vs CL',
                data: alphaClVector.map(point => ({ x: point.alpha, y: point.cl })),
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: false
            }]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Alpha (°)',
                        font: {
                            family: 'Times New Roman',
                            size: 12,
                            color: 'rgba(51, 51, 102, 0.8)'
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'CL',
                        font: {
                            family: 'Times New Roman',
                            size: 12,
                            color: 'orange'
                        }
                    }
                }
            }
        }
    });
}
//______________________________________________________________________________
//Solución de ala recta

let delta_phi = 180 / stationsCalc;
    
