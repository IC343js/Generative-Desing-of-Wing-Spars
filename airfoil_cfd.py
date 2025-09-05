import numpy as np
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import tkinter as tk

def naca4(profile, n_points=100):
    """ Generate a NACA 4-digit airfoil profile. """
    m = int(profile[0]) / 100
    p = int(profile[1]) / 10
    t = int(profile[2:]) / 100
    
    x = np.linspace(0, 1, n_points)
    yt = 5 * t * (0.2969 * np.sqrt(x) - 0.1260 * x - 0.3516 * x**2 + 0.2843 * x**3 - 0.1015 * x**4)
    
    if p != 0:
        yc = np.where(x < p, m / p**2 * (2 * p * x - x**2), m / (1 - p)**2 * ((1 - 2 * p) + 2 * p * x - x**2))
        dyc_dx = np.where(x < p, 2 * m / p**2 * (p - x), 2 * m / (1 - p)**2 * (p - x))
    else:
        yc = np.zeros_like(x)
        dyc_dx = np.zeros_like(x)
    
    theta = np.arctan(dyc_dx)
    
    xu = x - yt * np.sin(theta)
    xl = x + yt * np.sin(theta)
    yu = yc + yt * np.cos(theta)
    yl = yc - yt * np.cos(theta)
    
    return xu, yu, xl, yl

def naca5(profile, n_points=100):
    """ Generate a NACA 5-digit airfoil profile. """
    p1 = int(profile[0])
    p = int(profile[1]) / 20
    t = int(profile[2:]) / 100
    
    x = np.linspace(0, 1, n_points)
    yt = 5 * t * (0.2969 * np.sqrt(x) - 0.1260 * x - 0.3516 * x**2 + 0.2843 * x**3 - 0.1015 * x**4)
    
    if p1 in [2, 3]:
        k1 = 0.05
        m = 0.25
    elif p1 in [4, 5]:
        k1 = 0.15
        m = 0.25
    else:
        k1 = 0.1
        m = 0.25
    
    yc = np.where(x <= p, k1 * (2 * m * x - x**2) / (m**2), k1 * ((1 - 2 * m) + 2 * m * x - x**2) / ((1 - m)**2))
    dyc_dx = np.where(x <= p, 2 * k1 * (m - x) / (m**2), 2 * k1 * (m - x) / ((1 - m)**2))
    
    theta = np.arctan(dyc_dx)
    
    xu = x - yt * np.sin(theta)
    xl = x + yt * np.sin(theta)
    yu = yc + yt * np.cos(theta)
    yl = yc - yt * np.cos(theta)
    
    return xu, yu, xl, yl

def generate_airfoil(profile, n_points=100, profile_type="4-digit"):
    if profile_type == "4-digit":
        xu, yu, xl, yl = naca4(profile, n_points)
    elif profile_type == "5-digit":
        xu, yu, xl, yl = naca5(profile, n_points)
    else:
        raise ValueError("Invalid profile type")
    
    return xu, yu, xl, yl

def plot_airfoil(xu, yu, xl, yl, profile, canvas, ax):
    """ Plot the airfoil profile. """
    ax.clear()
    ax.fill(np.concatenate([xu, xl[::-1]]), np.concatenate([yu, yl[::-1]]), color='#000')
    ax.set_title(f'NACA {profile} Airfoil')
    ax.set_xlabel('x')
    ax.set_ylabel('y')
    ax.grid(True)
    ax.axis('equal')
    canvas.draw()

def on_generate_button_click(entry, type_var, canvas, ax, canvas2, ax2):
    profile = entry.get()
    profile_type = type_var.get()
    
    if profile_type == "4-digit":
        if profile and len(profile) == 4 and profile.isdigit():
            xu, yu, xl, yl = naca4(profile)
            plot_airfoil(xu, yu, xl, yl, profile, canvas, ax)
            run_cfd(xu, yu, xl, yl, canvas2, ax2)
        else:
            print("Invalid input. Please enter a valid NACA 4-digit code.")
    elif profile_type == "5-digit":
        if profile and len(profile) == 5 and profile.isdigit():
            xu, yu, xl, yl = naca5(profile)
            plot_airfoil(xu, yu, xl, yl, profile, canvas, ax)
            run_cfd(xu, yu, xl, yl, canvas2, ax2)
        else:
            print("Invalid input. Please enter a valid NACA 5-digit code.")
    else:
        print("Please select a profile type.")

# LBM CFD code with airfoil obstacle

def is_obstacle(x, y, xu, yu, xl, yl):
    # Check if (x, y) is inside the airfoil defined by (xu, yu) and (xl, yl)
    # Simplified for demonstration purposes
    upper_curve = np.array([xu, yu]).T
    lower_curve = np.array([xl, yl]).T
    for point in upper_curve:
        if np.linalg.norm([x - point[0], y - point[1]]) < 0.02:
            return True
    for point in lower_curve:
        if np.linalg.norm([x - point[0], y - point[1]]) < 0.02:
            return True
    return False

def run_cfd(xu, yu, xl, yl, canvas2, ax2):
    nx, ny = 400, 100  # Grid size
    tau = 0.6  # Relaxation time
    rho0 = 1.0  # Initial density
    nu = (tau - 0.5) / 3.0  # Kinematic viscosity
    u0 = 0.1  # Initial velocity

    w = np.array([4/9] + [1/9]*4 + [1/36]*4)
    c = np.array([[0, 0], [1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [-1, -1], [1, -1]])
    opp = np.array([0, 3, 4, 1, 2, 7, 8, 5, 6])  # Opposite directions

    f = np.ones((9, nx, ny)) * rho0 / 9  # Distribution functions
    rho = np.ones((nx, ny)) * rho0
    ux = np.zeros((nx, ny))
    uy = np.zeros((nx, ny))

    obstacle = np.zeros((nx, ny), dtype=bool)
    for i in range(nx):
        for j in range(ny):
            x = i / nx
            y = j / ny
            if is_obstacle(x, y, xu, yu, xl, yl):
                obstacle[i, j] = True

    for it in range(5000):  # Reduced number of iterations for demonstration
        for i in range(9):
            feq = w[i] * rho * (1 + 3 * (c[i, 0] * ux + c[i, 1] * uy) + 4.5 * (c[i, 0] * ux + c[i, 1] * uy)**2 - 1.5 * (ux**2 + uy**2))
            f[i, :, :] = (1 - 1/tau) * f[i, :, :] + 1/tau * feq

        for i in range(9):
            f[i, :, :] = np.roll(f[i, :, :], c[i, 0], axis=0)
            f[i, :, :] = np.roll(f[i, :, :], c[i, 1], axis=1)

        for i in range(9):
            f[i, obstacle] = f[opp[i], obstacle]

        f[:, 0, :] = f[:, -2, :]
        f[:, -1, :] = f[:, 1, :]

        rho = np.sum(f, axis=0)
        ux = np.sum(f * c[:, 0][:, np.newaxis, np.newaxis], axis=0) / rho
        uy = np.sum(f * c[:, 1][:, np.newaxis, np.newaxis], axis=0) / rho

        # Compute the vorticity
        vorticity = np.zeros((nx, ny))
        for i in range(1, nx-1):
            for j in range(1, ny-1):
                vorticity[i, j] = (uy[i+1, j] - uy[i-1, j]) / 2 - (ux[i, j+1] - ux[i, j-1]) / 2
        
        # Plotting the vorticity
        ax2.clear()
        c = ax2.contourf(vorticity.T, levels=20, cmap='RdBu')
        ax2.set_title('Vorticity Field')
        ax2.set_xlabel('X')
        ax2.set_ylabel('Y')
        plt.colorbar(c, ax=ax2)
        canvas2.draw()

def main():
    # Create the main window
    root = tk.Tk()
    root.title("NACA Airfoil Generator with CFD")

    # Create the input frame
    input_frame = tk.Frame(root)
    input_frame.pack(side=tk.LEFT, padx=10, pady=10)

    tk.Label(input_frame, text="Enter NACA airfoil code:").pack()
    entry = tk.Entry(input_frame)
    entry.pack(pady=5)

    type_var = tk.StringVar(value="4-digit")
    tk.Radiobutton(input_frame, text="4-digit", variable=type_var, value="4-digit").pack(anchor=tk.W)
    tk.Radiobutton(input_frame, text="5-digit", variable=type_var, value="5-digit").pack(anchor=tk.W)

    # Create the display frame for airfoil
    display_frame = tk.Frame(root)
    display_frame.pack(side=tk.RIGHT, padx=10, pady=10)

    fig, ax = plt.subplots(figsize=(10, 5))
    canvas = FigureCanvasTkAgg(fig, master=display_frame)
    canvas.get_tk_widget().pack()

    # Create the display frame for CFD
    display_frame_cfd = tk.Frame(root)
    display_frame_cfd.pack(side=tk.RIGHT, padx=10, pady=10)

    fig2, ax2 = plt.subplots(figsize=(10, 5))
    canvas2 = FigureCanvasTkAgg(fig2, master=display_frame_cfd)
    canvas2.get_tk_widget().pack()

    generate_button = tk.Button(input_frame, text="Generate Airfoil", command=lambda: on_generate_button_click(entry, type_var, canvas, ax, canvas2, ax2))
    generate_button.pack(pady=5)

    root.mainloop()

if __name__ == "__main__":
    main()

