let AlphaClVector;
let LiftVector;
let StoredLiftVector;
let retrievedLiftVector;
let vectorAlpha;
let vectorCl;
let rho;
let Vinf;

let N;
let deltaPhi;
let Phi = [];
let Phi_rad = [];

let b;
let c;
let aoa;
let aoa_rad;
let aileron_length;
let p;
let c_aleron;
let d_izq;
let d_der;
let omega;


let Cla;
let AOA_L0;
let aj = [];
let bj = [];
let cj = [];
let w = [];
let E;
let Ajaj = [];
let Ajbj = [];
let Ajcj_izq = [];
let Ajcj_der = [];
let Ajcj = [];
let Aj = [];

let XAiInicial;
let XAiFinal;
let PhiAiInicial;
let PhiAiFinal;

let P;
let long_aleron;

let XAdInicial;
let XAdFinal;
let PhiAdInicial;
let PhiAdFinal;

let CotaInf = [];
let CotaSup = [];

let chi_1 = [];
let chi_2 = [];
let chi_3 = [];
let chi = [];

let Fij = [];
let FijInv = [];
let PuntosAla = [];
let Suma = [];
let l;
let L = [];

let cj_izq = [];
let cj_der = [];

let canvas_sustentacion;
let canvas_AlphaClVector;
let AR;
let airfoil = '';
let reynolds = '';
//let mach = '';
let maxclcd = '';
let s;
let NACA_code;

document.getElementById('fileInput').addEventListener('change', loadCSV);

function loadCSV(event)
{
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(event)
    {
        const text = event.target.result;
        AlphaClVector = processData(text);
        if(AlphaClVector)
        {
            plotAlphaCl(AlphaClVector);
        }
        const lines = text.split('\n');
        const headers = lines[0].split(',');
        const values = lines.slice(1,6).map(line => line.split(','));
        let preview = `Headers: ${headers.join(', ')}\n`;
        values.forEach(row => {
            preview += `${row.join(', ')}\n`;
        });
        document.getElementById('csvPreview').textContent = preview;
    };
    reader.readAsText(file);
}

function parseCSV(csvData)
{   
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',');
    const data = lines.slice(1).map(line => line.split(','));

    return {headers, data};
}

function findPosition(headers, searchString)
{
    return headers.indexOf(searchString);
}

function getVector(data, startRow, colIndex)
{
    const vector = [];
    for(let i = startRow; i < data.length; i++)
    {
        vector.push(parseFloat(data[i][colIndex]));
    }
    return vector;
}

function getAlphaClVector(alphaVector, clVector)
{
    AlphaClVector = [];
    for(let i = 0; i < alphaVector.length; i++)
    {
        AlphaClVector.push({alpha: alphaVector[i], cl: clVector[i]});
    }
    
    return AlphaClVector;
}

function processData(csvData)
{
    const { headers, data } = parseCSV(csvData);
    let alphaPosition = -1;
    let startRow = 0;
    for(let i = 0; i < data.length; i++)
    {
        alphaPosition = data[i].indexOf("Alpha");
        if(alphaPosition !== -1)
        {
            startRow = i;
            break;
        }
    }

    data.forEach(line => {
        if(line[0] === 'Airfoil')
        {
            airfoil = line[1].trim();
        }
        if(line[0] === 'Reynolds number')
        {
            reynolds = line[1].trim();
        }
        if(line[0] === 'Mach')
        {
            mach = line[1].trim();
        }
        if(line[0] === 'Max Cl/Cd')
        {
            maxclcd = line[1].trim();
        }
    });

    if(alphaPosition === -1)
    {
        alphaPosition = findPosition(headers, 'Alpha');
        startRow = findPosition(data.map(row => row[0]), 'Alpha') + 1;
    }

    vectorAlpha = getVector(data, startRow, alphaPosition);
    vectorCl = getVector(data, startRow, alphaPosition + 1);

    return getAlphaClVector(vectorAlpha, vectorCl);
}

function plotAlphaCl(AlphaClVector) {

    if (canvas_AlphaClVector) {
        canvas_AlphaClVector.destroy();
    }

    const ctx = document.getElementById('ClAlpha_chart').getContext('2d');

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    canvas_AlphaClVector = new Chart(ctx, {
        type: 'line',
        data: {
            labels: AlphaClVector.map(point => point.alpha),
            datasets: [{
                label: 'AOA vs CL',
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
                        text: 'AOA (°)',
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
/*---------------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------------------*/

function calculateLiftDistribution() {
    rho = parseFloat(document.getElementById('density').value);
    Vinf = parseFloat(document.getElementById('vinf').value);
    aoa = parseFloat(document.getElementById('aoa').value);
    N = parseFloat(document.getElementById('nodes').value);
    b = parseFloat(document.getElementById('span').value);
    c = parseFloat(document.getElementById('chord').value);
    omega = parseFloat(document.getElementById('twist').value);

    c_aleron = parseFloat(document.getElementById('aileron_chord').value);
    d_izq = parseFloat(document.getElementById('delta_izq').value);
    d_der = parseFloat(document.getElementById('delta_der').value);
    aileron_length = parseFloat(document.getElementById('aileron_length').value);
    p = parseFloat(document.getElementById('aileron_distance').value);

    NACA_code = parseFloat(document.getElementById('airfoil_code').value);

    if (canvas_sustentacion) {
        canvas_sustentacion.destroy();
    }
    calculateLinearModel(AlphaClVector);
    calculosParametros();
    
    // Asegurarse de que PuntosAla y l tengan la misma longitud
    if (PuntosAla.length !== l.length) {
        console.error('PuntosAla y l tienen longitudes diferentes');
        return;
    }

    graficar('graf_sustentacion_1', 'Distribución de la Sustentación en la Envergadura', PuntosAla, l, 'X2 [m]', 'L [N]');
    StoredLiftVector = getLiftVector(PuntosAla,l);

    saveLift(StoredLiftVector);
    retrievedLiftVector = loadLift();
    console.log(retrievedLiftVector);

    updateRelevantData();
}

//---------TESIS MODIFICATIONS------------------------------------
function getLiftVector(PuntosAla, l)
{
    /*LiftVector = [];
    for(let i = 0; i < PuntosAla.length; i++)
    {
        LiftVector.push({Punto: PuntosAla[i], l: l[i]});
    }*/
   LiftVector = [];
   for(let i = 0; i < PuntosAla.length; i++){
        LiftVector[i] = [2];
        LiftVector[i][0] = PuntosAla[i];
        LiftVector[i][1] = l[i];
   }
    
    return LiftVector;
}

function saveLift(LiftVector){
    localStorage.setItem("LiftVector", JSON.stringify(LiftVector));
    localStorage.setItem("span", JSON.stringify(b));
    localStorage.setItem("chord", JSON.stringify(c));
    localStorage.setItem("aoa", JSON.stringify(aoa));
    localStorage.setItem("Vinf", JSON.stringify(Vinf));
    localStorage.setItem("rho_inf", JSON.stringify(rho));
    localStorage.setItem("Airfoil", JSON.stringify(NACA_code));
}

function loadLift(){
    let storedLift = localStorage.getItem("LiftVector");
    return storedLift ? JSON.parse(storedLift) : null;
}

function loadSpan(){
    let storedSpan = localStorage.getItem("span");
    return storedSpan ? JSON.parse(storedSpan) : null;
}

function loadChord(){
    let storedChord = localStorage.getItem("chord");
    return storedChord ? JSON.parse(storedChord) : null;
}

function loadAOA(){
    let storedAOA = localStorage.getItem("aoa");
    return storedAOA ? JSON.parse(storedAOA) : null;
}

function loadVinf(){
    let storedVinf = localStorage.getItem("Vinf");
    return storedVinf ? JSON.parse(storedVinf) : null;
}

function loadAirfoil(){
    let storedAirfoil = localStorage.getItem("Airfoil");
    return storedAirfoil ? JSON.parse(storedAirfoil) : null;
}

function discardLift(){
    localStorage.removeItem("LiftVector");
}

window.onload = function(){
    retrievedLiftVector = loadLift();
    retrievedSpan = loadSpan();
    retrievedChord = loadChord();
    retrievedAOA = loadAOA();
    retrievedVinf = loadVinf();
    retrievedAirfoil = loadAirfoil();
    if(retrievedLiftVector){
        console.log("Cargando Lift desde LocalStorage:", retrievedLiftVector);
    }else{
        console.log("No hay datos de Lift guardado");
    }
    if(retrievedSpan){
        console.log("Cargando Envergadura desde LocalStorage:", retrievedSpan);
    }else{
        console.log("No hay datos de Envergadura guardado");
    }
    if(retrievedChord){
        console.log("Cargando Cuerda desde LocalStorage:", retrievedChord);
    }else{
        console.log("No hay datos de Cuerda guardado");
    }
    if(retrievedAOA){
        console.log("Cargando Ángulo de Ataque desde LocalStorage:", retrievedAOA);
    }else{
        console.log("No hay datos de Ángulo de Ataque guardado");
    }
    if(retrievedVinf){
        console.log("Cargando Velocidad desde LocalStorage:", retrievedVinf);
    }else{
        console.log("No hay datos de Velocidad guardado");
    }
    if(retrievedAirfoil){
        console.log("Cargando Airfoil desde LocalStorage:", retrievedAirfoil);
    }else {
        console.log("No hay un perfil alar almacenado");
    }
}


//---------TESIS MODIFICATIONS------------------------------------

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
/* -----------------------------------------------------------------------------
 -----------------------------------------------------------------------------
  -----------------------------------------------------------------------------
   -----------------------------------------------------------------------------
    -----------------------------------------------------------------------------*/
function calculosParametros()
{
    Phi = [];
    Phi_rad = [];
    Fij = [];
    aj = [];
    bj = [];
    w = [];
    chi = [];
    Ajaj = [];
    Ajbj = [];
    Ajcj = [];
    Aj = [];
    PuntosAla = [];
    Suma = [];
    l = [];

    deltaPhi = Math.PI / N;
    Cla = clAlpha;
    AOA_L0 = alphaL0;

    // Generar Phi y Phi_rad
    for (let i = 1; i <= N - 1; i++) {
        Phi.push(i * deltaPhi * 180 / Math.PI);
        Phi_rad.push(i * deltaPhi);
    }

    const relaxFactor = 0.95;
    
    // Calcular Fij
    for (let i = 0; i < N - 1; i++) {
        Fij[i] = [];
        for (let j = 0; j < N - 1; j++) {
            Fij[i][j] = relaxFactor * Fij_function(b, Cla, c, j + 1, Phi_rad[i]);
        }
    }
    //FijInv = invertMatrix(Fij);
    FijInv = invertMatrixWithRegularization(Fij);

    aoa_rad = aoa * Math.PI / 180;
    let diferencia_alphas = aoa_rad - AOA_L0;
    let onesVector = Array(N - 1).fill(1);
    aj = chop(multiplyMatrixVector(FijInv, onesVector));

    for (let i = 0; i < N - 1; i++) {
        w[i] = Math.abs(Math.cos(Phi_rad[i]));
    }
    bj = chop(multiplyMatrixVector(FijInv, w));

    E = c_aleron / c;

    XAiInicial = p;
    XAiFinal = p - aileron_length;
    PhiAiInicial = X2A_phi(XAiInicial,b);
    PhiAiFinal = X2A_phi(XAiFinal,b);

    XAdInicial = (-b/2) + aileron_length;
    XAdFinal = -P;
    PhiAdInicial = X2A_phi(XAdInicial,b);
    PhiAdFinal = X2A_phi(XAdFinal,b);

    CotaInf = Phi_rad.filter(angle => angle < PhiAiFinal).length;
    CotaSup = Phi_rad.filter(angle => angle < PhiAdInicial).length;

    chi_1 = Array.from({length: CotaInf}, () => epsilon(E));
    chi_2 = Array.from({length: CotaSup - CotaInf}, () => 0);
    chi_3 = Array.from({length: Phi_rad.length - CotaSup}, () => -epsilon(E));
    chi = [...chi_1, ...chi_2, ...chi_3];

    cj = chop(multiplyMatrixVector(FijInv,chi));
    
    let mid = Math.ceil(cj.length / 2);

    let cj_izq = new Array(mid); // Vector de la primera mitad
    let cj_der = new Array(cj.length - mid); // Vector de la segunda mitad

    for (let i = 0; i < mid; i++) {
        cj_izq[i] = cj[i];
    }
    
    for (let i = mid; i < cj.length; i++) {
        cj_der[i - mid] = cj[i];
    }

    let omega_rad = omega * Math.PI / 180;
    let d_izq_rad = d_izq * Math.PI / 180;
    let d_der_rad = d_der * Math.PI / 180;
    Ajaj = aj.map(valor => valor * diferencia_alphas);
    Ajbj = bj.map(valor => valor * omega_rad);
    Ajcj_izq = cj_izq.map(valor => valor * d_izq_rad);
    Ajcj_der = cj_der.map(valor => valor * d_der_rad);
    
    Ajcj = [...Ajcj_izq, ...Ajcj_der];

    for(let i = 0; i < aj.length; i++)
    {
        Aj[i] = Ajaj[i] - Ajbj[i] + Ajcj[i];
    }

    PuntosAla = Phi_rad.map(value => (b / 2) * Math.cos(value));
    
    for (let i = 0; i < N - 1; i++) {
        let suma = 0;
        for (let j = 0; j < Aj.length; j++) {
            suma += Aj[j] * Math.sin((j + 1) * Phi_rad[i]);
        }
        Suma.push(suma);
    }

    l = Suma.map(value => 2 * rho * Vinf * Vinf * b * value);
    //l = smoothDistribution(l);
}

function calcularSumaAjSin(Aj, Phi_rad) {
    // Crear un array para almacenar los resultados
    const resultados = [];

    // Iterar sobre cada valor de phi
    for (let i = 0; i < Phi_rad.length; i++) {
        let suma = 0;
        // Calcular la suma de Aj[j] * sin(j * phi[i] * Degree)
        for (let j = 0; j < Aj.length; j++) {
            suma += Aj[j] * Math.sin((j + 1) * Phi_rad[i]); // Convertir a radianes
        }
        // Agregar el resultado al array
        resultados.push(suma);
    }

    return resultados;
}

function Fij_function(b_, Cla_, c_, j_, phi_)
{
    return ((4*b_ / (Cla_ * c_)) + (j_/Math.sin(phi_))) * Math.sin(j_ * phi_);
}

function X2A_phi(X2, span)
{
    return Math.acos((2*X2)/span);
}

function epsilon(Razon)
{
    ee_ = 1 - (Math.acos(2*Razon - 1) - Math.sin(Math.acos(2*Razon - 1))) / Math.PI;
    return ee_;
}

function graficar(canvasId, label, xData, yData, xLabel, yLabel) {
    // Destruir el gráfico existente si existe
    if (canvas_sustentacion) {
        canvas_sustentacion.destroy();
    }

    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Limpiar el canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Crear un nuevo gráfico
    canvas_sustentacion = new Chart(ctx, {
        type: 'line',
        data: {
            labels: xData,
            datasets: [{
                label: label,
                data: yData.map((y, index) => ({x: xData[index], y: y})),
                backgroundColor: '#000',
                borderColor: 'rgba(255, 0, 0, 1)',
                borderWidth: 1,
                tension: 0.1, 
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: xLabel,
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
                        text: yLabel,
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
                legend: {
                    labels: {
                        color: '#fff'
                    }
                }
            }
        }
    });
    ctx.canvas.style.backgroundColor = "#000";
}

function updateRelevantData()
{
    AR = b / c;
    s = b * c;
    let AOA_L0_degree = AOA_L0 * 180 / Math.PI;
    document.getElementById('AspectRatio').textContent = `${AR}`;
    document.getElementById('Surface').textContent = `${s}`;
    document.getElementById('clalpha').textContent = `${clAlpha}`;
    document.getElementById('Airfoil').textContent = `${airfoil}`;
    document.getElementById('Reynolds').textContent = `${reynolds}`;
    document.getElementById('AOA_L0').textContent = `${AOA_L0_degree}`;
    document.getElementById('MaxClCd').textContent = `${maxclcd}`;
    document.getElementById('ECuerda').textContent = `${E}`;
}
//Operaciones de matrices-----------------------------------------

function chop(vector, threshold = 1e-8) {
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

function invertMatrixWithRegularization(matrix, lambda = 1e-6) {
    const n = matrix.length;
    const augmentedMatrix = matrix.map((row, i) => [
        ...row.map(val => val + (i === (row.indexOf(val)) ? lambda : 0)),
        ...Array(n).fill(0).map((_, j) => (i === j ? 1 : 0))
    ]);

    for (let i = 0; i < n; i++) {
        let maxElement = Math.abs(augmentedMatrix[i][i]);
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(augmentedMatrix[k][i]) > maxElement) {
                maxElement = Math.abs(augmentedMatrix[k][i]);
                maxRow = k;
            }
        }

        [augmentedMatrix[i], augmentedMatrix[maxRow]] = [augmentedMatrix[maxRow], augmentedMatrix[i]];

        for (let k = i + 1; k < n; k++) {
            const factor = augmentedMatrix[k][i] / augmentedMatrix[i][i];
            for (let j = i; j < 2 * n; j++) {
                augmentedMatrix[k][j] -= factor * augmentedMatrix[i][j];
            }
        }
    }

    for (let i = n - 1; i >= 0; i--) {
        for (let k = i - 1; k >= 0; k--) {
            const factor = augmentedMatrix[k][i] / augmentedMatrix[i][i];
            for (let j = i; j < 2 * n; j++) {
                augmentedMatrix[k][j] -= factor * augmentedMatrix[i][j];
            }
        }
        const factor = augmentedMatrix[i][i];
        for (let j = i; j < 2 * n; j++) {
            augmentedMatrix[i][j] /= factor;
        }
    }

    return augmentedMatrix.map(row => row.slice(n));
}