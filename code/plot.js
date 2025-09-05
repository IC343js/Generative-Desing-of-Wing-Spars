// Definir variables globales
let span;
let chord;
let aoa;
let stations;
let speed;
let density;
let includeTwist;
let includeAilerons;
let AlphaClVector;
let alphaL0;
let clAlpha;
let phiValues;

let delta_phi;
let phi;
let delta_phi_rad;
let phi_rad;
let fijValues;
let coeficientes;
let coeficientesTranspuesta;
let fijInv;
let onesVector;
let aj;
let ajChopped;
let Aj;
let difference;
let lPhi;
let puntosAla;
let sustentacion1;

let canvas_sustentacion_1;
let omega_torcimiento;
let vectorOmega;
let bj;
let Aj2;
let omega_torcimiento_rad;
let lPhi2;
let sustentacion2;

let delta_izq = 20;
let delta_der = -20;
let delta_izq_rad;
let delta_der_rad;
let ECuerda = 0.2;
let XAiInicial;
let XAiFinal;
let longitudAleron;
let phi_AiInicial;
let phi_AiFinal;
let XAdInicial;
let XAdFinal;
let phi_AdInicial;
let phi_AdFinal;
let phi_AiFinal_rad;
let cotaInf;
let cotaSup;
let chi1;
let chi2;
let chi3;
let chi;
let cj;
let AjSTAleron;
let cj_unchopped;
let cjDelta1;
let cjDelta2;
let cjintermedio;
let cjDelta;
let AJSTAleron;
let lPhi3;
let sustentacion3;

let AjSTAleronSinTorcimiento;
let lPhi4;
let sustentacion4;

let AR;
let airfoil = '';
let reynolds = '';
let mach = '';
let maxclcd = '';
let s;

// Función para cargar el archivo CSV
document.getElementById('fileInput').addEventListener('change', loadCSV);

function loadCSV(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        AlphaClVector = processData(text);
        if (AlphaClVector) {
            plotAlphaCl(AlphaClVector);
        }
        const lines = text.split('\n');
        const headers = lines[0].split(',');
        const values = lines.slice(1, 6).map(line => line.split(',')); // Mostrar solo las primeras 5 filas
        let preview = `Headers: ${headers.join(', ')}\n`;
        values.forEach(row => {
            preview += `${row.join(', ')}\n`;
        });
        document.getElementById('csvPreview').textContent = preview;
    };
    reader.readAsText(file);
}

// Función para calcular la distribución de sustentación
function calculateLiftDistribution() {
    span = parseFloat(document.getElementById('span').value);
    chord = parseFloat(document.getElementById('chord').value);
    aoa = parseFloat(document.getElementById('aoa').value) * (Math.PI / 180); // Convertir a radianes
    stations = parseInt(document.getElementById('stations').value);
    speed = parseFloat(document.getElementById('speed').value);
    density = parseFloat(document.getElementById('density').value);
    includeTwist = document.getElementById('twist').checked;
    includeAilerons = document.getElementById('ailerons').checked;
    omega_torcimiento = parseFloat(document.getElementById('omega_torcimiento').value);
    //delta_der = parseFloat(document.getElementById('delta_der').value);
    //delta_izq = parseFloat(document.getElementById('delta_izq').value);

    // Mostrar el valor de stations para depuración
    console.log('Stations:', stations);

    // Calcular delta_phi después de definir stations
    //const delta_phi = calculateDeltaPhi(stations);

    // Llamar a la función de cálculos
    const liftDistribution = calculateLift(span, chord, aoa, speed, density, includeTwist, includeAilerons);

    // Mostrar resultados
    let results = `Distribución de Sustentación:\n`;
    liftDistribution.forEach((lift, index) => {
        results += `Estación ${index + 1}: ${lift} N\n`;
    });
    document.getElementById('results').textContent = results;

    calculateLinearModel(AlphaClVector);
    matrizDeCoeficientes(span, clAlpha, chord, aoa, alphaL0, stations);
    distribucionSustentacion(density, speed, span, Aj, phi);
    calcularPuntosAla(span, phi_rad);
    updateRelevantData();
}

// Función para calcular delta_phi
function calculateDeltaPhi(stations) {
    if (stations <= 0) {
        console.error('Número de estaciones debe ser mayor que 0');
        return NaN;
    }
    const delta_phi = 180 / stations;
    console.log('Delta Phi:', delta_phi); // Mostrar el valor de delta_phi en la consola
    return delta_phi;
}

// Función para calcular la distribución de sustentación
function calculateLift(span, chord, aoa, speed, density, includeTwist, includeAilerons) {
    // Usar delta_phi en la función de cálculos
    //const delta_phi = calculateDeltaPhi(stations);
    let liftDistribution = [];

    for (let j = 1; j <= stations; j++) {
        const lift = Fij(span, clAlpha, chord, j, aoa);
        liftDistribution.push(lift);
    }

    // Aquí puedes agregar lógica adicional para torcimiento y alerones si es necesario

    return liftDistribution;
}

// Función para calcular Fij
function Fij(span, density, chord, j, angle) {
    return (4 * span / (density * chord) + j / Math.sin(angle)) * Math.sin(j * angle);
}

// Función para analizar CSV
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
    AlphaClVector = [];
    for (let i = 0; i < alphaVector.length; i++) {
        AlphaClVector.push({ alpha: alphaVector[i], cl: clVector[i] });
    }
    return AlphaClVector;
}

/*function processData(csvData) {
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
}*/
function processData(csvData) {
    const { headers, data } = parseCSV(csvData);
    
    // Buscar la posición de la columna "Alpha" en cualquier fila
    let alphaPosition = -1;
    let startRow = 0;
    for (let i = 0; i < data.length; i++) {
        alphaPosition = data[i].indexOf("Alpha");
        if (alphaPosition !== -1) {
            startRow = i;
            break;
        }
    }

    data.forEach(line => {
        if (line[0] === 'Airfoil') {
            airfoil = line[1].trim();
        }
        if (line[0] === 'Reynolds number') {
            reynolds = line[1].trim();
        }
        if (line[0] === 'Mach')
        {
            mach = line[1].trim();
        }
        if (line[0] === 'Max Cl/Cd')
        {
            maxclcd = line[1].trim();
        }
    });

    if (alphaPosition === -1) {
        alphaPosition = findPosition(headers, "Alpha");
        startRow = findPosition(data.map(row => row[0]), "Alpha") + 1;
        
    }

    const vectorAlpha = getVector(data, startRow, alphaPosition);
    const vectorCl = getVector(data, startRow, alphaPosition + 1);

    return getAlphaClVector(vectorAlpha, vectorCl);
}

function plotAlphaCl(AlphaClVector) {
    const ctx = document.getElementById('myChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: AlphaClVector.map(point => point.alpha),
            datasets: [{
                label: 'Alpha vs CL',
                data: AlphaClVector.map(point => ({ x: point.alpha, y: point.cl })),
                borderColor: '#f00',
                backgroundColor: '#000',
                fill: false
            }]
        },
        options: {
            plugins: {
                legend: {
                    labels: {
                        color: '#fff'
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Alpha (°)',
                        color: '#fff',
                        font: {
                            family: 'Times New Roman',
                            size: 12,
                            color: '#fff'
                        }
                    },
                    ticks: {
                        color: '#fff'
                    },
                    grid: {
                        display: true,
                        color: '#00d0ff88'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'CL',
                        color: '#fff',
                        font: {
                            family: 'Times New Roman',
                            size: 12,
                            color: '#fff'
                        }
                    },
                    ticks: {
                        color: '#fff'
                    },
                    grid: {
                        display: true,
                        color: '#00d0ff88'
                    }
                }
            }
        }
    });
    ctx.canvas.style.backgroundColor = '#000';
}


// Nueva función para cálculos de modelo lineal
function calculateLinearModel(AlphaClVector) {
    // Definir los límites -5 y 5
    const lowerLimit = -5;
    const upperLimit = 5;

    // Encontrar las posiciones de los límites
    const lowerPos = AlphaClVector.findIndex(point => point.alpha === lowerLimit);
    const upperPos = AlphaClVector.findIndex(point => point.alpha === upperLimit);

    if (lowerPos === -1 || upperPos === -1) {
        console.error("Límites no encontrados en el vector de datos.");
        return;
    }

    // Extraer los datos del modelo entre los límites
    const dataModelo = AlphaClVector.slice(lowerPos, upperPos + 1);
    console.log("dataModelo:", dataModelo); // Mostrar dataModelo en la consola

    // Ajustar el modelo lineal a dataModelo
    const x = dataModelo.map(point => point.alpha);
    const y = dataModelo.map(point => point.cl);

    const lm = linearRegression(x, y);
    console.log("lm:", lm); // Mostrar lm en la consola

    // Convertir dataModelo a radianes
    const dataModelRad = dataModelo.map(point => ({
        alpha: point.alpha * (Math.PI / 180),
        cl: point.cl
    }));
    console.log("dataModelRad:", dataModelRad); // Mostrar dataModelRad en la consola

    // Ajustar el modelo lineal a dataModelRad
    const xRad = dataModelRad.map(point => point.alpha);
    const yRad = dataModelRad.map(point => point.cl);

    const lmRad = linearRegression(xRad, yRad);
    console.log("lmRad:", lmRad); // Mostrar lmRad en la consola

    // Resolver para el ángulo de ataque donde cl es cero (αL0)
    alphaL0 = -lmRad.intercept / lmRad.slope;
    console.log("αL0:", alphaL0); // Mostrar αL0 en la consola

    // Calcular clα
    clAlpha = lmRad.slope;
    console.log("clα:", clAlpha); // Mostrar clα en la consola
}

// Función de regresión lineal simple
function linearRegression(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
}




//SOLUCIÓN DE ALA RECTA

//Matriz de coeficientes
function matrizDeCoeficientes(span, clAlpha, chord, aoa, alphaL0, stations)
{
    
    // Calcular delta_phi basado en el número de estaciones
    delta_phi = 180 / stations;
    
    // Crear la lista de \[\CurlyPhi\]i usando el valor calculado de delta_phi
    phi = Array.from({ length: stations - 1 }, (_, i) => (i + 1) * delta_phi);
    
    console.log("Delta Phi:", delta_phi); // Mostrar en consola el valor de delta_phi
    console.log("Phi Values:", phi); // Mostrar en consola los valores calculados de \[\CurlyPhi\]i

    delta_phi_rad = Math.PI / stations;

    phi_rad = Array.from({ length: stations - 1 }, (_, i) => (i + 1) * delta_phi_rad);
    console.log("Delta Phi (radians):", delta_phi_rad);
    console.log("Phi Values (radians):", phi_rad);

    fijValues = phi_rad.map(phir => Fij(span, clAlpha, chord, 1, phir));

    console.log("Fij Values:", fijValues);

    coeficientes = Array.from({ length: phi_rad.length }, (_, j) =>
        phi_rad.map((phir, i) => Fij(span, clAlpha, chord, j + 1, phir))
    );

    coeficientesTranspuesta = transpose(coeficientes);
    console.log("Coeficientes:", coeficientesTranspuesta);

    fijInv = invertMatrix(coeficientesTranspuesta);
    console.log("Fij Inv:", fijInv);

    onesVector = Array(phi_rad.length).fill(1);
    aj = multiplyMatrixVector(fijInv, onesVector);
    ajChopped = chop(aj);
    console.log("aj:", ajChopped);

    difference = aoa - alphaL0;
    Aj = ajChopped.map(value => value * difference);
    console.log("Aj:", Aj);

    return fijValues;
}

function calcularSumaAjSin(Aj, phi) {
    // Crear un array para almacenar los resultados
    const resultados = [];

    // Iterar sobre cada valor de phi
    for (let i = 0; i < phi.length; i++) {
        let suma = 0;
        // Calcular la suma de Aj[j] * sin(j * phi[i] * Degree)
        for (let j = 0; j < Aj.length; j++) {
            suma += Aj[j] * Math.sin((j + 1) * phi[i] * (Math.PI / 180)); // Convertir a radianes
        }
        // Agregar el resultado al array
        resultados.push(suma);
    }

    return resultados;
}

function distribucionSustentacion(density, speed, span, Aj, phi) {
    const sumaAjSin = calcularSumaAjSin(Aj, phi);
    lPhi = sumaAjSin.map(suma1 => 2 * density * Math.pow(speed, 2) * span * suma1);
    return lPhi;
}

function calcularPuntosAla(span, phi_rad) {
    puntosAla = phi_rad.map(angle => (span / 2) * Math.cos(angle)); // Convertir a radianes
    return puntosAla;
}

function calcularSustentacion1(puntosAla, lPhi) {
    sustentacion1 = puntosAla.map((punto, i) => [punto, lPhi[i]]);
    return sustentacion1;
}


function liftDistributionOnTheWingSpan() {
    if (canvas_sustentacion_1) {
        canvas_sustentacion_1.destroy();
    }
    // Llamar a las funciones de cálculo según el estado del checkbox
    if(!includeTwist && includeAilerons)
        {
            ModeloDeSustentacionDePhilips(phi_rad,fijInv);
            desplieguealeronesSinTorcimiento();
            distribucionSustentacion4(density, speed, span, AjSTAleronSinTorcimiento, phi);
            calcularSustentacion4(puntosAla, lPhi4);

            const xValues = sustentacion4.map(point => point[0]);
            const yValues = sustentacion4.map(point => point[1]);

            // Obtener el contexto del canvas
            const ctx = document.getElementById('graf_sustentacion_1').getContext('2d');

            // Destruir el gráfico anterior si existe
            if (canvas_sustentacion_1) {
                canvas_sustentacion_1.destroy();
            }

            // Crear un nuevo gráfico con los datos actualizados
            canvas_sustentacion_1 = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: xValues,
                    datasets: [{
                        label: 'Distribución de sustentación en la envergadura del ala con torcimiento',
                        data: yValues,
                        backgroundColor: '#000',  // Color de fondo
                        borderColor: '#f00',    // Color de línea
                        borderWidth: 2,
                        fill: false,
                        tension: 0.1
                    }]
                },
                options: {
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'X2 [m]',
                                color: '#fff'
                            },
                            ticks: {
                                color: '#fff'
                            },
                            grid: {
                                display: true,
                                color: '#00d0ff88'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'L(X2) [N]',
                                color: '#fff'
                            },
                            ticks: {
                                color: '#fff'
                            },
                            grid: {
                                display: true,
                                color: '#00d0ff88'
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Distribución de sustentación en la envergadura del ala con torcimiento',
                            color: '#fff'
                        },
                        legend: {
                            labels: {
                                color: '#fff'
                            }
                        }
                    }
                }
            });      
            ctx.canvas.style.backgroundColor = '#000';      
        }
    
    if (includeTwist) {
        if(includeAilerons)
        {
            ModeloDeSustentacionDePhilips(phi_rad,fijInv);
            desplieguealerones();
            distribucionSustentacion3(density, speed, span, AJSTAleron, phi);
            calcularSustentacion3(puntosAla, lPhi3);

            const xValues = sustentacion3.map(point => point[0]);
            const yValues = sustentacion3.map(point => point[1]);

            // Obtener el contexto del canvas
            const ctx = document.getElementById('graf_sustentacion_1').getContext('2d');

            // Destruir el gráfico anterior si existe
            if (canvas_sustentacion_1) {
                canvas_sustentacion_1.destroy();
            }

            // Crear un nuevo gráfico con los datos actualizados
            canvas_sustentacion_1 = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: xValues,
                    datasets: [{
                        label: 'Distribución de sustentación en la envergadura del ala con torcimiento',
                        data: yValues,
                        backgroundColor: '#000',  // Color de fondo
                        borderColor: '#f00',    // Color de línea
                        borderWidth: 2,
                        fill: false,
                        tension: 0.1
                    }]
                },
                options: {
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'X2 [m]',
                                color: '#fff'
                            },
                            ticks: {
                                color: '#fff'
                            },
                            grid: {
                                display: true,
                                color: '#00d0ff88'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'L(X2) [N]',
                                color: '#fff'
                            },
                            ticks: {
                                color: '#fff'
                            },
                            grid: {
                                display: true,
                                color: '#00d0ff88'
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Distribución de sustentación en la envergadura del ala con torcimiento',
                            color: '#fff'
                        },
                        legend: {
                            labels: {
                                color: '#fff'
                            }
                        }
                    }
                }
            });      
            ctx.canvas.style.backgroundColor = '#000';      
        }else
        {
            // Calcular Aj2 usando el modelo de sustentación de Phillips
            ModeloDeSustentacionDePhilips(phi_rad,fijInv);
            distribucionSustentacion2(density, speed, span, Aj2, phi);
            calcularSustentacion2(puntosAla, lPhi2);

            // Extraer los valores x e y para la gráfica
            const xValues = sustentacion2.map(point => point[0]);
            const yValues = sustentacion2.map(point => point[1]);

            // Obtener el contexto del canvas
            const ctx = document.getElementById('graf_sustentacion_1').getContext('2d');

            // Destruir el gráfico anterior si existe
            if (canvas_sustentacion_1) {
                canvas_sustentacion_1.destroy();
            }

            // Crear un nuevo gráfico con los datos actualizados
            canvas_sustentacion_1 = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: xValues,
                    datasets: [{
                        label: 'Distribución de sustentación en la envergadura del ala con torcimiento',
                        data: yValues,
                        backgroundColor: '#000',  // Color de fondo
                        borderColor: '#f00',    // Color de línea
                        borderWidth: 2,
                        fill: false,
                        tension: 0.1
                    }]
                },
                options: {
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'X2 [m]',
                                color: '#fff'
                            },
                            grid: {
                                display: true,
                                color: '#00d0ff88'
                            },
                            ticks: {
                                color: '#fff'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'L(X2) [N]',
                                color: '#fff'
                            },
                            grid: {
                                display: true,
                                color: '#00d0ff88'
                            },
                            ticks: {
                                color: '#fff'
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Distribución de sustentación en la envergadura del ala con torcimiento',
                            color: '#fff'
                        },
                        legend: {
                            labels: {
                                color: '#fff'
                            }
                        }
                    }
                }
            });
            ctx.canvas.style.backgroundColor = '#000';
        }
        
    } else {
        // Calcular la sustentación sin torcimiento
        calcularSustentacion1(puntosAla, lPhi);

        // Extraer los valores x e y para la gráfica
        const xValues = sustentacion1.map(point => point[0]);
        const yValues = sustentacion1.map(point => point[1]);

        // Obtener el contexto del canvas
        const ctx = document.getElementById('graf_sustentacion_1').getContext('2d');

        // Destruir el gráfico anterior si existe
        if (canvas_sustentacion_1) {
            canvas_sustentacion_1.destroy();
        }

        // Crear un nuevo gráfico con los datos actuales
        canvas_sustentacion_1 = new Chart(ctx, {
            type: 'line',
            data: {
                labels: xValues,
                datasets: [{
                    label: 'Distribución de sustentación en la envergadura del ala',
                    data: yValues,
                    backgroundColor: '#000',  // Color de fondo
                    borderColor: '#f00',    // Color de línea
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1
                }]
            },
            options: {
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'X2 [m]',
                            color: '#fff'
                        },
                        grid: {
                            display: true,
                            color: '#00d0ff88'
                        },
                        ticks: {
                            color: '#fff'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'L(X2) [N]',
                            color: '#fff'
                        },
                        grid: {
                            display: true,
                            color: '#00d0ff88'
                        },
                        ticks: {
                            color: '#fff'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Distribución de sustentación en la envergadura del ala',
                        color: '#fff'
                    },
                    legend: {
                        labels: {
                            color: '#fff'
                        }
                    }
                }
            }
        });
        ctx.canvas.style.backgroundColor = '#000';
    }
}


//--------------------------------------------------------------------------------
//Modelo de Sustentación de Philips

function omega(theta) {
    return Math.abs(Math.cos(theta));
}

function ModeloDeSustentacionDePhilips(phi_rad,fijInv)
{
    omega_torcimiento_rad = omega_torcimiento * (Math.PI/180);

    vectorOmega = phi_rad.map(angle => omega(angle)); // Convertir grados a radianes
    console.log("Vector Omega:", vectorOmega);

    bj = multiplyMatrixVector(fijInv, vectorOmega).map(val => Math.abs(val) < 1e-10 ? 0 : val); // Chop
    console.log("bj:", bj);

    Aj2 = Aj.map((ajValue, index) => ajValue - bj[index] * omega_torcimiento_rad);
    console.log("Aj2:", Aj2);    
}

function calcularSumaAjDosSin(Aj2, phi) {
    // Crear un array para almacenar los resultados
    const resultados2 = [];

    // Iterar sobre cada valor de phi
    for (let i = 0; i < phi.length; i++) {
        let suma2 = 0;
        // Calcular la suma de Aj[j] * sin(j * phi[i] * Degree)
        for (let j = 0; j < Aj2.length; j++) {
            suma2 += Aj2[j] * Math.sin((j + 1) * phi[i]*(Math.PI / 180)); // Convertir a radianes
        }
        // Agregar el resultado al array
        resultados2.push(suma2);
    }

    return resultados2;
}

function distribucionSustentacion2(density, speed, span, Aj2, phi) {
    const sumaAj2Sin = calcularSumaAjDosSin(Aj2, phi);
    lPhi2 = sumaAj2Sin.map(suma2 => 2 * density * Math.pow(speed, 2) * span * suma2);
    return lPhi2;
}

function calcularSustentacion2(puntosAla, lPhi2) {
    sustentacion2 = puntosAla.map((punto, i) => [punto, lPhi2[i]]);
    return sustentacion2;
}

//Modelo de Sustentación de Philips
//Ala recta con torsión geométrica y despliegue de alerones

//Para fines de este análisis, se supone que el despliegue de alerones será de 20°, siendo +20° en el izquierdo y -20° en el derecho.

function desplieguealerones()
{
    delta_izq_rad = delta_izq * (Math.PI/180);
    delta_der_rad = delta_der * (Math.PI/180);
    
    /*Se asume que los alerones se encuentran en las esquinas y tiene una longitud de 60 centimetros.
    
    La función de distribución de control superficial para una superficie de control convencional se puede escribir en términos del "local airfoil-section flap effectiveness".

    Por su parte (Hunsaker, D. F., 2018) define este coeficiente de efectividad para una superficie de control convencional a través de una relación de la cuerda del flap o alerón y de la cuerda total del perfil.
    */
    longitudAleron = 0.6;// [m]

    //Coordenadas de los alerones
    //Aleron Izquierdo.
    XAiInicial = span / 2;
    XAiFinal = span/2 - longitudAleron; 
    
    phi_AiInicial = X2A_phi(XAiInicial, span);
    phi_AiFinal = X2A_phi(XAiFinal, span);

    //Aleron Derecho
    XAdInicial = (-span / 2) + longitudAleron;
    XAdFinal = -span / 2;
    
    phi_AdInicial = X2A_phi(XAdInicial, span);
    phi_AdFinal = X2A_phi(XAdFinal, span);

    phi_AiFinal_rad = phi_AiFinal * Math.PI / 180;

    cotaInf = phi_rad.filter(angle => angle < phi_AiFinal).length;
    cotaSup = phi_rad.filter(angle => angle < phi_AdInicial).length;
    
    chi1 = Array.from({ length: cotaInf }, () => epsilon(ECuerda));
    chi2 = Array.from({ length: cotaSup - cotaInf}, () => 0);
    chi3 = Array.from({ length: phi_rad.length - cotaSup}, () => -epsilon(ECuerda));
    chi = [...chi1, ...chi2, ...chi3];

    cj = chop(multiplyMatrixVector(fijInv, chi));
    
    AjSTAleron = Aj.map((ajValue, index) => ajValue + (-bj[index] * omega_torcimiento) + cj[index] * delta_izq);
    console.log("AjSTAleron:", AjSTAleron);

    cjDelta1 = cj.slice(0, cotaInf).map(cjValue => cjValue * delta_izq_rad);
    console.log("cjDelta1:", cjDelta1);

    cjDelta2 = cj.slice(cotaSup, phi_rad.length).map(cjValue => cjValue * delta_der_rad);
    console.log("cjDelta2:", cjDelta2);

    cjintermedio = Array.from({ length: cotaSup - cotaInf }, () => 0);
    console.log("cjintermedio:", cjintermedio);

    cjDelta = [...cjDelta1, ...cjintermedio, ...cjDelta2];
    console.log("cjDelta: ", cjDelta);

    AJSTAleron = chop(Aj.map((ajValue, index) => ajValue + cj[index] * delta_izq_rad));
    console.log("AJSTAleron:", AJSTAleron);
}

function desplieguealeronesSinTorcimiento()
{
    delta_izq_rad = delta_izq * (Math.PI/180);
    delta_der_rad = delta_der * (Math.PI/180);
    
    /*Se asume que los alerones se encuentran en las esquinas y tiene una longitud de 60 centimetros.
    
    La función de distribución de control superficial para una superficie de control convencional se puede escribir en términos del "local airfoil-section flap effectiveness".

    Por su parte (Hunsaker, D. F., 2018) define este coeficiente de efectividad para una superficie de control convencional a través de una relación de la cuerda del flap o alerón y de la cuerda total del perfil.
    */
    longitudAleron = 0.6;// [m]

    //Coordenadas de los alerones
    //Aleron Izquierdo.
    XAiInicial = span / 2;
    XAiFinal = span/2 - longitudAleron; 
    
    phi_AiInicial = X2A_phi(XAiInicial, span);
    phi_AiFinal = X2A_phi(XAiFinal, span);

    //Aleron Derecho
    XAdInicial = (-span / 2) + longitudAleron;
    XAdFinal = -span / 2;
    
    phi_AdInicial = X2A_phi(XAdInicial, span);
    phi_AdFinal = X2A_phi(XAdFinal, span);

    phi_AiFinal_rad = phi_AiFinal * Math.PI / 180;

    cotaInf = phi_rad.filter(angle => angle < phi_AiFinal).length;
    cotaSup = phi_rad.filter(angle => angle < phi_AdInicial).length;
    
    chi1 = Array.from({ length: cotaInf }, () => epsilon(ECuerda));
    chi2 = Array.from({ length: cotaSup - cotaInf}, () => 0);
    chi3 = Array.from({ length: phi_rad.length - cotaSup}, () => -epsilon(ECuerda));
    chi = [...chi1, ...chi2, ...chi3];

    cj = chop(multiplyMatrixVector(fijInv, chi));
    
    AjSTAleronSinTorcimiento = Aj.map((ajValue, index) => ajValue +  cj[index] * delta_izq);
    console.log("AjSTAleron:", AjSTAleron);

    cjDelta1 = cj.slice(0, cotaInf).map(cjValue => cjValue * delta_izq_rad);
    console.log("cjDelta1:", cjDelta1);

    cjDelta2 = cj.slice(cotaSup, phi_rad.length).map(cjValue => cjValue * delta_der_rad);
    console.log("cjDelta2:", cjDelta2);

    cjintermedio = Array.from({ length: cotaSup - cotaInf }, () => 0);
    console.log("cjintermedio:", cjintermedio);

    cjDelta = [...cjDelta1, ...cjintermedio, ...cjDelta2];
    console.log("cjDelta: ", cjDelta);

    AjSTAleronSinTorcimiento = chop(Aj.map((ajValue, index) => ajValue + cj[index] * delta_izq_rad));
    console.log("AJSTAleron:", AJSTAleron);
}

function epsilon(Razon)
{
    ee_ = 1 - (Math.acos(2*Razon - 1) - Math.sin(Math.acos(2*Razon - 1))) / Math.PI;
    return ee_;
}

function X2A_phi(X2, span)
{
    return Math.acos((2*X2)/span);
}

function calcularSumaAJSTAleronSin(AJSTAleron, phi) {
    // Crear un array para almacenar los resultados
    const resultados3 = [];

    // Iterar sobre cada valor de phi
    for (let i = 0; i < phi.length; i++) {
        let suma3 = 0;
        // Calcular la suma de Aj[j] * sin(j * phi[i] * Degree)
        for (let j = 0; j < AJSTAleron.length; j++) {
            suma3 += AJSTAleron[j] * Math.sin((j + 1) * phi[i]*(Math.PI / 180)); // Convertir a radianes
        }
        // Agregar el resultado al array
        resultados3.push(suma3);
    }

    return resultados3;
}

function distribucionSustentacion3(density, speed, span, AJSTAleron, phi) {
    const sumaAJSTAleronSin = calcularSumaAJSTAleronSin(AJSTAleron, phi);
    lPhi3 = sumaAJSTAleronSin.map(suma3 => 2 * density * Math.pow(speed, 2) * span * suma3);
    return lPhi3;
}

function calcularSustentacion3(puntosAla, lPhi3) {
    sustentacion3 = puntosAla.map((punto, i) => [punto, lPhi3[i]]);
    return sustentacion3;
}
//-----------------------------------------------------------------------
function calcularSumaAJSTAleronSinTorcimiento(AjSTAleronSinTorcimiento, phi) {
    // Crear un array para almacenar los resultados
    const resultados4 = [];

    // Iterar sobre cada valor de phi
    for (let i = 0; i < phi.length; i++) {
        let suma4 = 0;
        // Calcular la suma de Aj[j] * sin(j * phi[i] * Degree)
        for (let j = 0; j < AjSTAleronSinTorcimiento.length; j++) {
            suma4 += AjSTAleronSinTorcimiento[j] * Math.sin((j + 1) * phi[i]*(Math.PI / 180)); // Convertir a radianes
        }
        // Agregar el resultado al array
        resultados4.push(suma4);
    }

    return resultados4;
}

function distribucionSustentacion4(density, speed, span, AjSTAleronSinTorcimiento, phi) {
    const sumaAJSTAleronSinTorcimiento = calcularSumaAJSTAleronSin(AjSTAleronSinTorcimiento, phi);
    lPhi4 = sumaAJSTAleronSinTorcimiento.map(suma4 => 2 * density * Math.pow(speed, 2) * span * suma4);
    return lPhi4;
}

function calcularSustentacion4(puntosAla, lPhi4) {
    sustentacion4 = puntosAla.map((punto, i) => [punto, lPhi4[i]]);
    return sustentacion4;
}
//------------------------------------------------------------------------
function updateRelevantData()
{
    AR = span / chord;
    s = span * chord;
    document.getElementById('AspectRatio').textContent = `${AR}`;
    document.getElementById('Surface').textContent = `${s}`;
    document.getElementById('clalpha').textContent = `${clAlpha}`;
    document.getElementById('Airfoil').textContent = `${airfoil}`;
    document.getElementById('Reynolds').textContent = `${reynolds}`;
    document.getElementById('Mach').textContent = `${mach}`;
    document.getElementById('MaxClCd').textContent = `${maxclcd}`;
    document.getElementById('ECuerda').textContent = `${ECuerda}`;
}




//Operaciones de matrices-----------------------------------------

function chop(vector, threshold = 1e-10) {
    return vector.map(value => Math.abs(value) < threshold ? 0 : value);
}

function transpose(matrix) {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
}

// Función para invertir una matriz
function invertMatrix(matrix) {
    const size = matrix.length;
    const augmentedMatrix = matrix.map((row, i) => [
        ...row,
        ...Array(size).fill(0).map((_, j) => (i === j ? 1 : 0))
    ]);

    for (let i = 0; i < size; i++) {
        const pivot = augmentedMatrix[i][i];
        for (let j = 0; j < 2 * size; j++) {
            augmentedMatrix[i][j] /= pivot;
        }
        for (let k = 0; k < size; k++) {
            if (k === i) continue;
            const factor = augmentedMatrix[k][i];
            for (let j = 0; j < 2 * size; j++) {
                augmentedMatrix[k][j] -= factor * augmentedMatrix[i][j];
            }
        }
    }

    return augmentedMatrix.map(row => row.slice(size));
}

// Función para multiplicar una matriz por un vector
function multiplyMatrixVector(matrix, vector) {
    return matrix.map(row => row.reduce((sum, val, i) => sum + val * vector[i], 0));
}