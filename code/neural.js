//const { sqrt } = require("mathjs");

let canvas_Lift;
let canvas_Sheer;
let canvas_moment;

let vinf_input;
let rhoinf_input;
let aoa_input;
let span_input;
let chord_input;
let rhospar_input;
let Ey_input;
let etha_input;

let Ey;
let rho_spar;
let damping_factor_value;
let endurance;

let naca_code;
let mid_span;
let naca_value;

let Lift = [];
let LiftValue = [];
let sheerCurve = [];
let momentCurve = [];
let L_max = [];
let V_max = [];
let M_max = [];

let magnitud_lift = [];
let magnitud_sheer = [];
let magnitud_moment = [];
let puntos_x = [];
let magnitud_lift_numeric = [];
let magnitud_sheer_numeric = [];
let magnitud_moment_numeric = [];
let puntos_x_numeric = [];

let airfoil_tickness;
let airfoil_tickness_chord;
let evolved_outputs = [];
let evolved_ho = [];
let evolved_bo = [];
let evolved_hi = [];
let evolved_bi = [];
let evolved_deformation;

let valorGeneraciones;
let valorElite;
let valorPoblacion;
let valorMutationStr;
let valorMutationRate;


class NeuralNetwork {
    constructor(weights) {
        // 8 inputs × 4 outputs = 32 weights needed
        this.weights = weights || Array.from({length: 32}, () => Math.random() * 2 - 1);
        this.inputSize = 8;
        this.outputSize = 4;
    }

    // Function to run the neural network
    compute(inputs) {
        // Generate random inputs if none provided
        const actualInputs = inputs || Array.from({length: this.inputSize}, () => Math.random() * 2 - 1);
        
        // Verify that inputs match expected size
        if (actualInputs.length !== this.inputSize) {
            throw new Error(`Se requieren ${this.inputSize} parámetros de entrada`);
        }

        const outputs = [];
        
        // Calculate each output
        for (let i = 0; i < this.outputSize; i++) {
            let sum = 0;
            for (let j = 0; j < this.inputSize; j++) {
                // Index in weight array = i * inputSize + j
                sum += actualInputs[j] * this.weights[i * this.inputSize + j];
            }
            // Usar sigmoid y luego escalar al rango [1, 2000]
            const sigmoidValue = 1 / (1 + Math.exp(-sum));
            const scaledOutput = 0.1 + sigmoidValue * 0.9; // Escala a [0.1, 1]
            outputs.push(scaledOutput);
        }
        
        return outputs;
    }

    // Modified Von Mises method to work with scaled outputs
    // Modified Von Mises method to include weight as an objective
    vonMises(inputs) {
        // Generate random inputs if none provided
        const actualInputs = inputs || Array.from({length: this.inputSize}, () => Math.random() * 2 - 1);
        
        if (actualInputs.length !== this.inputSize) {
            throw new Error(`Se requieren ${this.inputSize} parámetros de entrada`);
        }
        
        // First compute the neural network outputs
        const outputs = this.compute(actualInputs);
        
        // Calculate spar dimensions
        const bo_meters = (outputs[1] + outputs[3]) * airfoil_tickness * 3;
        const bi_meters = outputs[3] * airfoil_tickness * 3;
        const ho_meters = (outputs[0] + outputs[2]) * airfoil_tickness * 1;
        const hi_meters = outputs[2] * airfoil_tickness * 1;
        const y_meters = ho_meters / 2;

        // Calculate cross-section properties
        const I_meters = (((bo_meters * Math.pow(ho_meters,3))/12) - ((bi_meters * Math.pow(hi_meters,3))/12));
        const Q_meters = ((bo_meters*ho_meters/2) - (bi_meters*hi_meters/2))*(ho_meters/4);

        // Calculate stress
        const Tau = (V_max * Q_meters) / (I_meters * (bo_meters - bi_meters) * 0.5);
        const normal_stress = (M_max * y_meters) / I_meters;
        const von_mises = Math.sqrt(Math.pow(normal_stress,2) + 3 * Math.pow(Tau, 2)); 
        //const von_mises = normal_stress;
        // Calculate weight
        const crossArea = (ho_meters*bo_meters) - (hi_meters*bi_meters);
        const volume = crossArea * span_input/2;
        const weight = volume * actualInputs[5]; // Using input[5] which is rhospar_input

        // Calculate safety factor
        const endurance_limit = endurance * 1E6; // Convert MPa to Pa
        const safety_factor = endurance_limit / von_mises;
        
        // If safety factor is less than 1.5, heavily penalize the design
        let fitness;
        if (safety_factor < 1.5) {
            fitness = 1000000 * (1.5 - safety_factor); // Large penalty for unsafe designs
        } else {
            // For safe designs, combine stress and weight objectives
            // Normalize both objectives to similar scales
            const stress_component = von_mises / 1E6; // Normalize stress
            const weight_component = weight / 10; // Normalize weight
            
            // Combined fitness with weights for each objective
            // Adjust these weights based on your preference (0.7 and 0.3 here)
            fitness = (0.7 * stress_component) + (0.3 * weight_component);
        }
        
        return {
            von_mises: von_mises,
            weight: weight,
            fitness: fitness,
            safety_factor: safety_factor
        };
    }
}

class EvolutionaryAlgorithm {
    constructor(options = {}) {
        this.populationSize = options.populationSize || valorPoblacion;
        this.eliteCount = options.eliteCount || valorElite;
        this.mutationRate = options.mutationRate || valorMutationRate;
        this.mutationStrength = options.mutationStrength || valorMutationStr;
        
        // Initialize population
        this.population = [];
        for (let i = 0; i < this.populationSize; i++) {
            this.population.push(new NeuralNetwork());
        }
        
        this.bestFitness = Infinity;
        this.bestSolution = null;
    }
    
    // Evaluate entire population
    evaluatePopulation(inputs) {
        let populationScores = [];
        
        for (let i = 0; i < this.populationSize; i++) {
            const network = this.population[i];
            const result = network.vonMises(inputs);
            
            populationScores.push({
                network: network,
                fitness: result.fitness,
                von_mises: result.von_mises,
                weight: result.weight,
                safety_factor: result.safety_factor
            });
            
            // Track best solution found so far
            if (result.fitness < this.bestFitness) {
                this.bestFitness = result.fitness;
                this.bestSolution = network;
            }
        }
        
        // Sort by fitness (lower is better)
        populationScores.sort((a, b) => a.fitness - b.fitness);
        
        return populationScores;
    }
    
    // Select parents using tournament selection
    selectParent(populationScores) {
        const tournamentSize = 3;
        const tournament = [];
        
        // Select random individuals for tournament
        for (let i = 0; i < tournamentSize; i++) {
            const randomIndex = Math.floor(Math.random() * populationScores.length);
            tournament.push(populationScores[randomIndex]);
        }
        
        // Return the winner (best fitness)
        tournament.sort((a, b) => a.fitness - b.fitness);
        return tournament[0].network;
    }
    
    //Creation of a child with crossover
    crossover(parent1, parent2) {
        const childWeights = [];
        
        for (let i = 0; i < parent1.weights.length; i++) {
            // Use simulated binary crossover (SBX)
            const beta = Math.random() < 0.5 ? 
                Math.pow(2 * Math.random(), 1/2.0) : 
                Math.pow(1/(2 * (1 - Math.random())), 1/2.0);
                
            const child1Value = 0.5 * ((1 + beta) * parent1.weights[i] + (1 - beta) * parent2.weights[i]);
            
            childWeights.push(child1Value);
        }
        
        return new NeuralNetwork(childWeights);
    }
    
    // Mutate the neural network
    mutate(solution) {
        const mutatedWeights = [...solution.weights];
        
        for (let i = 0; i < mutatedWeights.length; i++) {
            if (Math.random() < this.mutationRate) {
                // Polynomial mutation
                const delta = Math.random() < 0.5 ?
                    Math.pow(2 * Math.random(), 1/3.0) - 1 :
                    1 - Math.pow(2 * (1 - Math.random()), 1/3.0);
                
                mutatedWeights[i] += delta * this.mutationStrength;
                
                // Clamp weights to reasonable range
                mutatedWeights[i] = Math.max(-5, Math.min(5, mutatedWeights[i]));
            }
        }
        
        return new NeuralNetwork(mutatedWeights);
    }
    
    // Create next generation
    createNextGeneration(populationScores) {
        const newPopulation = [];
        
        // Add elites directly (no mutation)
        for (let i = 0; i < this.eliteCount; i++) {
            newPopulation.push(populationScores[i].network);
        }
        
        // Create children until population is filled
        while (newPopulation.length < this.populationSize) {
            // Select parents
            const parent1 = this.selectParent(populationScores);
            const parent2 = this.selectParent(populationScores);
            
            // Crossover and mutation
            const child = this.crossover(parent1, parent2);
            const mutatedChild = this.mutate(child);
            
            newPopulation.push(mutatedChild);
        }
        
        // Replace old population
        this.population = newPopulation;
    }
    
    // Run the evolutionary algorithm
    evolve(inputs, generations = 150) {
        // Track how long evolution is stuck
        let stuckCounter = 0;
        let previousBestFitness = Infinity;
        
        // Evaluate initial value to show progress
        const initialBestNetwork = this.population[0];
        console.log("Valor von Mises inicial:", initialBestNetwork.vonMises(inputs));
        
        for (let gen = 0; gen < generations; gen++) {
            // Evaluate population
            const populationScores = this.evaluatePopulation(inputs);
            const currentBestFitness = populationScores[0].fitness;
            
            // Adjust parameters if stuck
            if (Math.abs(currentBestFitness - previousBestFitness) < 0.000001) {
                stuckCounter++;
                
                // If stuck for too long, increase mutation
                if (stuckCounter > 10) {
                    this.mutationRate = Math.min(0.9, this.mutationRate * 1.1);
                    this.mutationStrength = Math.min(2.0, this.mutationStrength * 1.1);
                    
                    // Add completely new random individuals
                    if (stuckCounter > 20 && stuckCounter % 5 === 0) {
                        for (let i = this.populationSize - 3; i < this.populationSize; i++) {
                            this.population[i] = new NeuralNetwork();
                        }
                    }
                }
            } else {
                // Reset if we're making progress
                stuckCounter = 0;
                this.mutationRate = 0.2;
                this.mutationStrength = 0.5;
                previousBestFitness = currentBestFitness;
            }
            
            // Print progress
            if (gen % 10 === 0 || gen === generations - 1) {
                console.log(`Generation ${gen}: 
                    Best fitness = ${populationScores[0].fitness.toFixed(6)}, 
                    Von Mises = ${populationScores[0].von_mises.toFixed(6)} Pa, 
                    Weight = ${populationScores[0].weight.toFixed(6)} kg,
                    Safety factor = ${populationScores[0].safety_factor.toFixed(2)}`);
            }
            
            // Create next generation
            this.createNextGeneration(populationScores);
        }
        
        return this.bestSolution;
    }
}

// Function to get data from localStorage (stub for now)
function getInputsFromStorage() {
    // In a real application, this would retrieve data from localStorage
    // For now, just return null to trigger random generation
    let inputs = [];
    inputs[0] = vinf_input;
    inputs[1] = rhoinf_input;
    inputs[2] = aoa_input;
    inputs[3] = span_input;
    inputs[4] = chord_input;
    inputs[5] = rhospar_input;
    inputs[6] = Ey_input;
    inputs[7] = etha_input;

    return inputs;
}

// Example usage
/*function runEvolutionaryNeuralNetwork() {
    // Get inputs from storage or generate random inputs
    const storedInputs = getInputsFromStorage();
    const inputs = storedInputs || Array.from({length: 8}, () => Math.random() * 5 - 2.5);
    
    console.log("Iniciando evolución...");
    console.log("Inputs:", inputs);
    
    // Create evolution algorithm with custom options
    const evolutionaryAlgorithm = new EvolutionaryAlgorithm({
        populationSize: 100,
        eliteCount: 10,
        mutationRate: 0.2,
        mutationStrength: 0.5
    });
    
    // Run evolution
    const bestNetwork = evolutionaryAlgorithm.evolve(inputs, valorGeneraciones);
    
    evolved_outputs = bestNetwork.compute(inputs);
    evolved_bo = (evolved_outputs[1] + evolved_outputs[3]) * airfoil_tickness * 3;
    evolved_bi = evolved_outputs[3] * airfoil_tickness * 3;
    evolved_ho = (evolved_outputs[0] + evolved_outputs[2]) * airfoil_tickness * 1;
    evolved_hi = evolved_outputs[2] * airfoil_tickness * 1;
    evolved_vonMises = bestNetwork.vonMises(inputs) * 1E-9;

    document.getElementById("ho_output").innerText = evolved_ho*1000;
    document.getElementById("bo_output").innerText = evolved_bo*1000;
    document.getElementById("hi_output").innerText = evolved_hi*1000;
    document.getElementById("bi_output").innerText = evolved_bi*1000;
    document.getElementById("vonmises_output").innerText = evolved_vonMises;

    console.log("\nResultados:");
    console.log("Mejores pesos:", bestNetwork.weights);
    console.log("Outputs de la red:", evolved_outputs);
    console.log("Resultado von Mises final:", bestNetwork.vonMises(inputs));
    
    localStorage.setItem("bestOutputs", JSON.stringify(bestNetwork.compute(inputs)));
    // Return inputs and best network for potential storage
    return { inputs, network: bestNetwork };
}*/
function runEvolutionaryNeuralNetwork() {
    // Get inputs from storage or generate random inputs
    const storedInputs = getInputsFromStorage();
    const inputs = storedInputs || Array.from({length: 8}, () => Math.random() * 5 - 2.5);
    
    console.log("Iniciando evolución...");
    console.log("Inputs:", inputs);
    
    // Create evolution algorithm with custom options
    const evolutionaryAlgorithm = new EvolutionaryAlgorithm({
        populationSize: valorPoblacion,
        eliteCount: valorElite,
        mutationRate: valorMutationRate,
        mutationStrength: valorMutationStr
    });
    
    // Run evolution
    const bestNetwork = evolutionaryAlgorithm.evolve(inputs, valorGeneraciones);
    
    const result = bestNetwork.vonMises(inputs);
    evolved_outputs = bestNetwork.compute(inputs);
    evolved_bo = (evolved_outputs[1] + evolved_outputs[3]) * airfoil_tickness * 3;
    evolved_bi = evolved_outputs[3] * airfoil_tickness * 3;
    evolved_ho = (evolved_outputs[0] + evolved_outputs[2]) * airfoil_tickness * 1;
    evolved_hi = evolved_outputs[2] * airfoil_tickness * 1;
    evolved_vonMises = result.von_mises * 1E-6; // Convert to MPa

    const I_evolved = ((evolved_bo * Math.pow(evolved_ho,3))/12) - ((evolved_bi * Math.pow(evolved_hi,3))/12);
    console.log(I_evolved);

    evolved_deformation = (V_max * Math.pow(span_input/2,4))/(30*(Ey_input*1E9)*(I_evolved));

    // Calculate cross-section area and weight
    const crossArea = (evolved_ho*evolved_bo) - (evolved_hi*evolved_bi);
    const volumeSpar = crossArea * span_input;
    const sparWeight = rhospar_input * volumeSpar * 9.81; // Weight in N

    document.getElementById("ho_output").innerText = evolved_ho*1000;
    document.getElementById("bo_output").innerText = evolved_bo*1000;
    document.getElementById("hi_output").innerText = evolved_hi*1000;
    document.getElementById("bi_output").innerText = evolved_bi*1000;
    document.getElementById("vonmises_output").innerText = evolved_vonMises;
    document.getElementById("deformation_output").innerText = evolved_deformation;
    document.getElementById("mass_output").innerText = sparWeight.toFixed(2);

    console.log("\nResultados:");
    console.log("Mejores pesos:", bestNetwork.weights);
    console.log("Outputs de la red:", evolved_outputs);
    console.log("Resultado von Mises final:", bestNetwork.vonMises(inputs));
    
    // Visualize the neural network
    visualizeNetwork(bestNetwork, "network-visualizer");
    
    localStorage.setItem("bestOutputs", JSON.stringify(bestNetwork.compute(inputs)));
    // Return inputs and best network for potential storage
    return { inputs, network: bestNetwork };
}
// Run
function loadSparData(){
    Ey = parseFloat(document.getElementById("young_modulus").value);
    rho_spar = parseFloat(document.getElementById("rho_material").value);
    damping_factor_value = parseFloat(document.getElementById("damping_factor").value);
    endurance = parseFloat(document.getElementById("endurance").value);

    localStorage.setItem("Ey", JSON.stringify(Ey));
    localStorage.setItem("rho_spar", JSON.stringify(rho_spar));
    localStorage.setItem("etha", JSON.stringify(damping_factor_value));
    localStorage.setItem("endurance", JSON.stringify(endurance));

    valorGeneraciones = document.getElementById("generations").value;
    valorElite = document.getElementById("eliteCount").value;
    valorPoblacion = document.getElementById("population").value;
    valorMutationStr = document.getElementById("mutation_s").value;
    valorMutationRate = document.getElementById("mutation").value;

    loadLocalStorage();
    runEvolutionaryNeuralNetwork();
    //calculateAreaAndModal();
}

function calculateAreaAndModal(){
    let crossArea = (evolved_ho*evolved_bo) - (evolved_hi*evolved_bi);
    let volumeSpar = crossArea * span_input/2 * 1E6;
    let pesoSpan = rhospar_input * volumeSpar * 9.81;
    document.getElementById("mass_output").innerText = pesoSpan;
}

function loadLocalStorage(){
    let Vinf_retrieved = localStorage.getItem("Vinf");
    let rho_inf_retrieved = localStorage.getItem("rho_inf");
    let aoa_retrieved = localStorage.getItem("aoa");
    let span_retrieved = localStorage.getItem("span");
    let chord_retrieved = localStorage.getItem("chord");
    let rho_spar_retrieved = localStorage.getItem("rho_spar");
    let Ey_retrieved = localStorage.getItem("Ey");
    let etha_retrieved = localStorage.getItem("etha");

    let V_max_retrieved = localStorage.getItem("V_max");
    let M_max_retrieved = localStorage.getItem("M_max");

    Lift = localStorage.getItem("LiftVector");
    naca_code = localStorage.getItem("Airfoil");

    if(Lift){
        let LiftVector = JSON.parse(Lift);
        LiftValue = LiftVector;
        console.log("LiftVector cargado [N]:", LiftVector);
    }else{
        console.log("No hay valores almacenados de sustentación");
    }if(span_retrieved){
        span_input = JSON.parse(span_retrieved);
        mid_span = span_input / 2;    
        console.log("Envergadura cargada [m]:",span_input);
    }else{
        console.log("No hay un valor almacenado para la envergadura.");
    }if(chord_retrieved){
        chord_input = JSON.parse(chord_retrieved);
        console.log("Cuerda cargada [m]:", chord_input);
    }else{
        console.log("No hay un valor almacenado para la cuerda.");
    }if(aoa_retrieved){
        aoa_input = JSON.parse(aoa_retrieved);
        console.log("AOA cargado [°]:", aoa_input);
    }else{
        console.log("No hay un valor almacenado para el AOA");
    }if(Vinf_retrieved){
        vinf_input = JSON.parse(Vinf_retrieved);
        console.log("Vinf cargada [m/s]:",vinf_input);
    }else{
        console.log("No hay un valor almacenado para la velocidad.");
    }if(naca_code){
        naca_value = JSON.parse(naca_code);
        console.log("Airfoil:", naca_value);
    }else{
        console.log("No hay un perfil aerodinámico almacenado.");
    }if(rho_inf_retrieved){
        rhoinf_input = JSON.parse(rho_inf_retrieved);
        console.log("Densidad del aire cargada [Kg/m3]:",rhoinf_input);
    }else{
        console.log("No hay un valor almacenado para la densidad del aire.");
    }if(rho_spar_retrieved){
        rhospar_input = JSON.parse(rho_spar_retrieved);
        console.log("Densidad del material [Kg/m3]:",rhospar_input);
    }else{
        console.log("No hay un valor almacenado para la densidad del material.");
    }if(Ey_retrieved){
        Ey_input = JSON.parse(Ey_retrieved);
        console.log("Ey [GPa]:",Ey_input);
    }else{
        console.log("No hay un valor almacenado para Ey.");
    }if(etha_retrieved){
        etha_input = JSON.parse(etha_retrieved);
        console.log("Factor de amortiguamiento: ",etha_input);
    }else{
        console.log("No hay un valor almacenado para el factor de amortiguamiento.");
    }if(V_max_retrieved){
        V_max = JSON.parse(V_max_retrieved);
        V_max*=H_magnify(etha_input);
        console.log("Esfuerzo cortante máximo: ",V_max);
    }else{
        console.log("No hay un valor almacenado para el esfuerzo cortante.");
    }if(M_max_retrieved){
        M_max = JSON.parse(M_max_retrieved);
        M_max*=H_magnify(etha_input);
        console.log("Momento máximo:", M_max);
    }else{
        console.log("No hay un valor almacenado para el Momento.");
    }
    airfoil_tickness = airfoilTickness(naca_code) * 0.8;
    console.log("Airfoil Tickness:", airfoil_tickness);
}

function H_magnify(etha){
    return 1 / (2 * etha * Math.pow((1 - Math.pow(etha,2))), 1/2);
}

function airfoilTickness(naca_code){
    let penultimo = naca_code.length-2;
    let ultimo = naca_code.length-1;
    let a = naca_code.charAt(penultimo);
    let b = naca_code.charAt(ultimo);
    let a_num = parseFloat(a);
    let b_num = parseFloat(b);

    airfoil_tickness_chord = ((a_num * 10) + b_num) * 0.01;
    let tickness = airfoil_tickness_chord * chord_input;

    return tickness;
}

function halfedLift(){
    magnitud_lift = localStorage.getItem("magnitud_lift");
    magnitud_sheer = localStorage.getItem("magnitud_sheer");
    magnitud_moment = localStorage.getItem("magnitud_moment");
    puntos_x = localStorage.getItem("puntos_x");

    magnitud_lift_numeric = JSON.parse(magnitud_lift);
    magnitud_sheer_numeric = JSON.parse(magnitud_sheer);
    magnitud_moment_numeric = JSON.parse(magnitud_moment);
    puntos_x_numeric = JSON.parse(puntos_x);

    graficarLift("Lift_curve", "Lift Force", puntos_x_numeric, magnitud_lift_numeric, "Span [m]", "Lift [N]");
    graficarSheer("sheer_chart", "Sheer Force", puntos_x_numeric, magnitud_sheer_numeric, "Span [m]", "Sheer Force [N]");
    graficarMoment("moment_chart", "Bending Moment", puntos_x_numeric, magnitud_moment_numeric, "Span [m]", "Bending Moment [N*m]");

    //return ordered_semiala;
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

window.onload = halfedLift();

//runEvolutionaryNeuralNetwork();
//----------------------------------------------------------
// Helper function for lerp (already in visualizer.js but needed here)
function lerp(A, B, t) {
    return A + (B - A) * t;
}

// Helper function for RGBA color generation (already in visualizer.js but needed here)
function getRGBA(value) {
    const alpha = Math.abs(value);
    const R = value < 0 ? 0 : 255;
    const G = R;
    const B = value > 0 ? 0 : 255;
    return "rgba(" + R + "," + G + "," + B + "," + alpha + ")";
}

// Create a network adapter to visualize our neural network
function visualizeNetwork(network, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error("Canvas element not found:", canvasId);
        return;
    }
    
    const ctx = canvas.getContext("2d");
    
    // Clear canvas
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const margin = 50;
    const left = margin;
    const top = margin;
    const width = canvas.width - margin * 2;
    const height = canvas.height - margin * 2;
    
    // Draw nodes and connections
    const inputCount = 8;  // Your network has 8 inputs
    const outputCount = 4;  // Your network has 4 outputs
    
    // Input nodes (bottom row)
    const inputY = top + height - 20;
    const outputY = top + 20;
    
    // Draw connections first
    for (let i = 0; i < inputCount; i++) {
        const inputX = left + (width * i) / (inputCount - 1);
        
        for (let j = 0; j < outputCount; j++) {
            const outputX = left + (width * j) / (outputCount - 1);
            
            // Get weight from flat array
            const weightIndex = j * inputCount + i;
            const weight = network.weights[weightIndex];
            
            // Draw connection
            ctx.beginPath();
            ctx.moveTo(inputX, inputY);
            ctx.lineTo(outputX, outputY);
            ctx.lineWidth = Math.abs(weight) * 3;  // Thickness based on weight magnitude
            ctx.strokeStyle = getRGBA(weight);
            ctx.stroke();
        }
    }
    
    // Draw input nodes
    const nodeRadius = 15;
    for (let i = 0; i < inputCount; i++) {
        const x = left + (width * i) / (inputCount - 1);
        
        // Draw node
        ctx.beginPath();
        ctx.arc(x, inputY, nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#444";
        ctx.fill();
        ctx.strokeStyle = "#888";
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Add label
        ctx.fillStyle = "#fff";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText("I" + (i + 1), x, inputY + nodeRadius + 15);
    }
    
    // Draw output nodes
    const labels = ["ho", "bo", "hi", "bi"];
    for (let i = 0; i < outputCount; i++) {
        const x = left + (width * i) / (outputCount - 1);
        
        // Draw node
        ctx.beginPath();
        ctx.arc(x, outputY, nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#663";
        ctx.fill();
        ctx.strokeStyle = "#dd5";
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Add label
        ctx.fillStyle = "#fff";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(labels[i], x, outputY - nodeRadius - 10);
    }
    
    // Add title
    ctx.fillStyle = "#fff";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Neural Network Architecture", canvas.width / 2, canvas.height - 10);
}
