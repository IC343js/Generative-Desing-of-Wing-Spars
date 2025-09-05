let AOA = [];
let Cl = [];
let Cd = [];
let Cm = [];
let Cdi = [];

document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;
            const lines = text.split('\n');

            lines.forEach(line => {
                const columns = line.trim().split(/\s+/);
                if (columns.length === 13 && !isNaN(columns[0])) {
                    AOA.push(parseFloat(columns[0]));
                    Cl.push(parseFloat(columns[2]));
                    Cd.push(parseFloat(columns[5]));
                    Cm.push(parseFloat(columns[8]));
                    Cdi.push(parseFloat(columns[3]));
                }
            });

            console.log("AOA:", AOA);
            console.log("Cl:", Cl);
            console.log("Cd:", Cd);
            console.log("Cm:", Cm);
            console.log("Cdi:", Cdi);

            // Now you can use these vectors to generate charts with Chart.js
            createChart('clcd', 'CL vs CD', Cd, Cl, 'Cd', 'Cl');
            createChart('claoa', 'CL vs AOA', AOA, Cl, 'AOA', 'Cl');
            createChart('cmaoa', 'Cm vs AOA', AOA, Cm, 'AOA', 'Cm');
            createChart('clcdaoa', 'CL/CD vs AOA', AOA, Cl.map((val, i) => val / Cd[i]), 'AOA', 'Cl/Cd');
            createChart('cdi', 'Cdi vs AOA', AOA, Cdi, 'AOA', 'Cdi');
        };
        reader.readAsText(file);
    }
});

function createChart(canvasId, label, xData, yData, xLabel, yLabel) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: xData,
            datasets: [{
                label: label,
                data: yData,
                backgroundColor: '#f00',
                borderColor: 'rgba(125, 0, 0, 1)',
                borderWidth: 1,
                tension: 0.1, 
                fill: false
            }]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: xLabel,
                        color: '#fff'
                    },
                    grid: {
                        display: true,
                        color: '#fff'
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
                        color: '#fff'
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
    ctx.canvas.style.backgroundColor = "#00d0ff60";
}