//Beam section dimensions
let canvas_Lift;
let canvas_Sheer;
let canvas_moment;

//---------------
let ho;
let bo;
let hi;
let bi;
let density_material;
let Ey;
//-------------------------
let ho_stored;
let bo_stored;
let hi_stored;
let bi_stored;
let density_material_stored;
let Ey_stored;
let I_stored;
//-------------------------
let ho_stored_value;
let bo_stored_value;
let hi_stored_value;
let bi_stored_value;
let density_material_stored_value;
let Ey_stored_value;
let I_stored_value;
//---Dynamics--------------
let spar_span;
let spar_span_value;
let mid_span;
let chord;
let chord_value;
let aoa;
let aoa_value;
let Vinf;
let Vinf_value;
let naca_code;
let naca_value;

let damping_factor = 0.1;
let H_max_value = H_max(damping_factor);
//-----Static------------------
let Lift = [];
let LiftValue = [];
let sheerCurve = [];
let momentCurve = [];
let L_max = [];
let V_max = [];
let M_max = [];
let W;
let mass;
let Volume;
let cross_section_area;
let airfoil_tickness;
let airfoil_tickness_chord;

let I_value;
let Q_max_value;
let y_max_value;
let normal_stress_max_value;
let sheer_stress_max_value;

let von_mises_value;


function H_max(damping_factor){
    return 1 / (2 * damping_factor * Math.sqrt(1 - (damping_factor * damping_factor)));
}

function y_max(ho){
    return ho;
}

function I(ho,bo,hi,bi){
    let milimeters;
    milimeters =  (((ho*bo*bo*bo)/12) - ((hi*bi*bi*bi)/12));
    return milimeters;
}

function Q(ho,bo,hi,bi){
    return  [(bo*ho/2) - (bi*hi/2)]*(ho/4);
}

function sheer_stress(V, Q, I, bo, bi){
    //All units in must be in [m]
    let I_meters = I * 1E-12;
    let bo_meters = bo * 1E-3;
    let bi_meters = bi * 1E-3;
    let Q_meters = Q * 1E-9;
    return (V * Q_meters) / (I_meters * (bo_meters - bi_meters)*0.5);// [Pa]
}

function normal_stress(M, y, I){
    let y_meters = y * 1E-3;
    let I_meters = I * 1E-12;
    return (M * y_meters) / I_meters;// [Pa]
}

function von_mises(normal, sheer){
    let raiz = Math.pow(normal,2) + 3 * Math.pow(sheer, 2);
    return Math.sqrt(raiz);// [Pa]
}

function saveMechanical(){
    localStorage.setItem("density_material", JSON.stringify(density_material));
    localStorage.setItem("Ey", JSON.stringify(Ey));
    localStorage.setItem("I", JSON.stringify(I_value));
    localStorage.setItem("ho", JSON.stringify(ho));
    localStorage.setItem("bo", JSON.stringify(bo));
    localStorage.setItem("hi", JSON.stringify(hi));
    localStorage.setItem("bi", JSON.stringify(bi));
}

function loadLiftVector(){
    Lift = localStorage.getItem("LiftVector");
    spar_span = localStorage.getItem("span");
    chord = localStorage.getItem("chord");
    aoa = localStorage.getItem("aoa");
    Vinf = localStorage.getItem("Vinf");
    naca_code = localStorage.getItem("Airfoil");

    ho_stored = localStorage.getItem("ho");
    bo_stored = localStorage.getItem("bo");
    hi_stored = localStorage.getItem("hi");
    bi_stored = localStorage.getItem("bi");
    density_material_stored = localStorage.getItem("density_material");
    Ey_stored = localStorage.getItem("Ey");
    I_stored = localStorage.getItem("I");

    if(Lift){
        let LiftVector = JSON.parse(Lift);
        LiftValue = LiftVector;
        console.log("LiftVector cargado [N]:", LiftVector);
    }else{
        console.log("No hay valores almacenados de sustentación");
    }
    if(spar_span){
        spar_span_value = JSON.parse(spar_span);
        mid_span = spar_span_value / 2;
        console.log("Envergadura cargada [m]:", spar_span_value);
        document.getElementById("mid_span").innerText = mid_span;
    }else{
        console.log("No hay un valor para la envergadura almacenado.");
    }
    if(chord){
        chord_value = JSON.parse(chord);
        console.log("Cuerda cargada [m]:", chord_value);
        document.getElementById("chord").innerText = chord_value;
    }else{
        console.log("No hay un valor para la cuerda almacenado.");
    }
    if(aoa){
        aoa_value = JSON.parse(aoa);
        console.log("Ángulo de Ataque cargada [°]:", aoa_value);
        document.getElementById("aoa").innerText = aoa_value;
    }else{
        console.log("No hay un valor para el ángulo de ataque almacenado.");
    }
    if(Vinf){
        Vinf_value = JSON.parse(Vinf);
        console.log("Velocidad cargada [m/s]:", Vinf_value);
        document.getElementById("vinf").innerText = Vinf_value;
    }else{
        console.log("No hay un valor para la velocidad almacenado.");
    }
    if(naca_code){
        naca_value = JSON.parse(naca_code);
        console.log("Airfoil:", naca_value);
    }else{
        console.log("No hay un perfil alar almacenado.");
    }if(ho_stored){
        ho_stored_value = JSON.parse(ho_stored);
        console.log("ho [mm]:", ho_stored_value);
    }else{
        console.log("No hay un valor para ho.");
    }
    if(bo_stored){
        bo_stored_value = JSON.parse(bo_stored);
        console.log("bo [mm]:", bo_stored_value);
    }else{
        console.log("No hay un valor para bo.");
    }
    if(hi_stored){
        hi_stored_value = JSON.parse(hi_stored);
        console.log("hi [mm]:", hi_stored_value);
    }else{
        console.log("No hay un valor para hi.");
    }
    if(bi_stored){
        bi_stored_value = JSON.parse(bi_stored);
        console.log("bi [mm]:", bi_stored_value);
    }else{
        console.log("No hay un valor para bi.");
    }
    if(density_material_stored){
        density_material_stored_value = JSON.parse(density_material_stored);
        console.log("Density Material [kg/m3]:", density_material_stored_value);
    }else{
        console.log("No hay un valor para la densidad del material.");
    }
    if(Ey_stored){
        Ey_stored_value = JSON.parse(Ey_stored);
        console.log("Ey [GPa]:", Ey_stored_value);
    }else{
        console.log("No hay un valor para Ey.");
    }
    if(I_stored){
        I_stored_value = JSON.parse(I_stored);
        console.log("I [mm4]:", I_stored_value);
    }else{
        console.log("No hay un valor para I.");
    }

    halfedLift();
    airfoil_tickness = airfoilTickness(naca_code);// [m]
    console.log("Airfoil tickness:", airfoil_tickness);
}

function airfoilTickness(naca_code){
    let penultimo = naca_code.length-2;
    let ultimo = naca_code.length-1;
    let a = naca_code.charAt(penultimo);
    let b = naca_code.charAt(ultimo);
    let a_num = parseFloat(a);
    let b_num = parseFloat(b);

    airfoil_tickness_chord = ((a_num * 10) + b_num) * 0.01;
    let tickness = airfoil_tickness_chord * chord;

    return tickness;
}

function halfedLift(){
    let semiala = [];
    for(let i = 0; i < LiftValue.length; i++){
        if(LiftValue[i][0] >= 0){
            semiala.push([LiftValue[i][0], LiftValue[i][1]]);
        }
    }

    let ordered_semiala = semiala.sort((a,b) => a[0] - b[0]);

    console.log("Sustentación en la semiala [N]:", ordered_semiala);
    computeForces(ordered_semiala);

    let magnitud_lift = obtainVector(ordered_semiala, 1);
    let magnitud_sheer = obtainVector(sheerCurve, 1);
    let magnitud_moment = obtainVector(momentCurve, 1);
    let puntos_x = obtainVector(ordered_semiala, 0);

    localStorage.setItem("magnitud_lift", JSON.stringify(magnitud_lift));
    localStorage.setItem("magnitud_sheer", JSON.stringify(magnitud_sheer));
    localStorage.setItem("magnitud_moment", JSON.stringify(magnitud_moment));
    localStorage.setItem("puntos_x", JSON.stringify(puntos_x));

    graficarLift("Lift_curve_spar", "Lift Force", puntos_x, magnitud_lift, "Span [m]", "Lift [N]");
    graficarSheer("sheer_curve_spar", "Sheer Force", puntos_x, magnitud_sheer, "Span [m]", "Sheer Force [N]");
    graficarMoment("moment_curve_spar", "Bending Moment", puntos_x, magnitud_moment, "Span [m]", "Bending Moment [N*m]");

    return ordered_semiala;
}

function engineering_data(){
    //spar_span;
    //mid_span;

    ho = document.getElementById("ho").value;// [mm]
    bo = document.getElementById("bo").value;// [mm]
    hi = document.getElementById("hi").value;// [mm]    
    bi = document.getElementById("bi").value;// [mm]        
    density_material = document.getElementById("density_material").value;// [Kg/m3]
    Ey = document.getElementById("Ey").value;// [GPa]
    I_value = I(ho,bo,hi,bi);// [mm4]

    Q_max_value = Q(ho,bo,hi,bi);// [mm3]
    y_max_value = y_max(ho);// [mm]
    normal_stress_max_value = normal_stress(M_max, y_max_value, I_value);// [Pa]
    sheer_stress_max_value = sheer_stress(V_max, Q_max_value, I_value, bo, bi);// [Pa]
    von_mises_value = von_mises(normal_stress_max_value, sheer_stress_max_value);// [Pa]

    cross_section_area = (ho*bo) - (hi*bi);// [mm2]
    Volume = cross_section_area * mid_span * 1000;// [mm3]
    mass = density_material * Volume * 1E-9;// [Kg] 
    W = mass * 9.81;// [N]

    document.getElementById("momento_de_inercia").innerText = I_value;
    document.getElementById("momento_de_area").innerText = Q_max_value;
    document.getElementById("max_sheer_stress").innerText = sheer_stress_max_value;
    document.getElementById("max_stress").innerText = normal_stress_max_value;
    document.getElementById("von_mises").innerText = von_mises_value;
    document.getElementById("volume").innerText = Volume;
    document.getElementById("weight").innerText = W;
    saveMechanical();
}

function obtainVector(Force, position){
    let magnitud = [];

    for(let i = 0; i < Force.length; i++){
        magnitud[i] = Force[i][position];
    }
    return magnitud;
}

function integrate(polinomio){
    let integral = 0;
    for(let i = 0; i < polinomio.length - 1; i++){
        let x0 = polinomio[i][0], y0 = polinomio[i][1];
        let x1 = polinomio[i+1][0], y1 = polinomio[i+1][1];

        let dx = x1-x0;
        let y_prom  = (y1+y0)/2;
        integral += y_prom * dx;
    }

    return integral;
}

function computeForces(semiala){
    V_max = integrate(semiala);
    sheerCurve = semiala.map(([x,y]) => [x, integrate(semiala.filter(([xi]) => xi >= x))]);
    momentCurve = sheerCurve.map(([x,y]) => [x, integrate(sheerCurve.filter(([xi]) => xi >= x))]);

    M_max = integrate(sheerCurve);

    localStorage.setItem("V_max", JSON.stringify(V_max));
    localStorage.setItem("M_max", JSON.stringify(M_max));

    console.log("Sheer Force (V):",V_max);
    console.log("Bending Moment (M):",M_max);
}

function graficarLift(canvasId, label, xData, yData, xLabel, yLabel) {
    // Destruir el gráfico existente si existe
    if (canvas_Lift) {
        canvas_Lift.destroy();
    }

    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Limpiar el canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Crear un nuevo gráfico
    canvas_Lift = new Chart(ctx, {
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

function graficarSheer(canvasId, label, xData, yData, xLabel, yLabel) {
    // Destruir el gráfico existente si existe
    if (canvas_Sheer) {
        canvas_Sheer.destroy();
    }

    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Limpiar el canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Crear un nuevo gráfico
    canvas_Sheer = new Chart(ctx, {
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

function graficarMoment(canvasId, label, xData, yData, xLabel, yLabel) {
    // Destruir el gráfico existente si existe
    if (canvas_moment) {
        canvas_moment.destroy();
    }

    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Limpiar el canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Crear un nuevo gráfico
    canvas_moment = new Chart(ctx, {
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


window.onload = loadLiftVector;

console.log(H_max_value);

//LiftValue = JSON.parse(Lift);
//V_max = integralFuerzas(10, LiftValue);
//M_max = integralFuerzas(10, V_max);