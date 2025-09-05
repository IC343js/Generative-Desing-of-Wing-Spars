// Convert our neural network format to the format expected by Visualizer
class NeuralNetworkVisualizer {
    static createVisualNetwork(network) {
        // Create a format compatible with the Visualizer
        const visualNetwork = {
            levels: [
                {
                    inputs: Array(8).fill(0),  // 8 input neurons
                    outputs: Array(4).fill(0),  // 4 output neurons
                    weights: [],
                    biases: Array(4).fill(0)    // We'll use zeros as biases aren't separate in our network
                }
            ]
        };

        // Convert the flat weight array to a 2D array format (inputs × outputs)
        for (let i = 0; i < 8; i++) {
            visualNetwork.levels[0].weights[i] = [];
            for (let j = 0; j < 4; j++) {
                const weightIndex = j * 8 + i;
                visualNetwork.levels[0].weights[i][j] = network.weights[weightIndex];
            }
        }

        return visualNetwork;
    }

    static drawNetwork(network, canvasId) {
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d');
        
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Create a visualization-compatible network
        const visualNetwork = this.createVisualNetwork(network);
        
        // Draw the network
        Visualizer.drawNetwork(ctx, visualNetwork);
    }
}

// Add these helper functions needed by the Visualizer
function lerp(A, B, t) {
    return A + (B - A) * t;
}

// Function to visualize the best network after evolution
function visualizeBestNetwork(bestNetwork) {
    NeuralNetworkVisualizer.drawNetwork(bestNetwork, "network-visualizer");
}

// Modify the runEvolutionaryNeuralNetwork function to include visualization
function runEvolutionaryNeuralNetwork() {
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
    
    // Visualize the best network
    visualizeBestNetwork(bestNetwork);
    
    localStorage.setItem("bestOutputs", JSON.stringify(bestNetwork.compute(inputs)));
    // Return inputs and best network for potential storage
    return { inputs, network: bestNetwork };
}