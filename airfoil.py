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

def on_generate_button_click(entry, type_var, canvas, ax):
    profile = entry.get()
    profile_type = type_var.get()
    
    if profile_type == "4-digit":
        if profile and len(profile) == 4 and profile.isdigit():
            xu, yu, xl, yl = naca4(profile)
            plot_airfoil(xu, yu, xl, yl, profile, canvas, ax)
        else:
            print("Invalid input. Please enter a valid NACA 4-digit code.")
    elif profile_type == "5-digit":
        if profile and len(profile) == 5 and profile.isdigit():
            xu, yu, xl, yl = naca5(profile)
            plot_airfoil(xu, yu, xl, yl, profile, canvas, ax)
        else:
            print("Invalid input. Please enter a valid NACA 5-digit code.")
    else:
        print("Please select a profile type.")

def main():
    # Create the main window
    root = tk.Tk()
    root.title("NACA Airfoil Generator")
    
    # Create the input frame
    input_frame = tk.Frame(root)
    input_frame.pack(side=tk.LEFT, padx=10, pady=10)
    
    tk.Label(input_frame, text="Enter NACA airfoil code:").pack()
    entry = tk.Entry(input_frame)
    entry.pack(pady=5)
    
    type_var = tk.StringVar(value="4-digit")
    tk.Radiobutton(input_frame, text="4-digit", variable=type_var, value="4-digit").pack(anchor=tk.W)
    tk.Radiobutton(input_frame, text="5-digit", variable=type_var, value="5-digit").pack(anchor=tk.W)
    
    # Create the display frame
    display_frame = tk.Frame(root)
    display_frame.pack(side=tk.RIGHT, padx=10, pady=10)
    
    fig, ax = plt.subplots(figsize=(10, 5))
    canvas = FigureCanvasTkAgg(fig, master=display_frame)
    canvas.get_tk_widget().pack()
    
    generate_button = tk.Button(input_frame, text="Generate Airfoil", command=lambda: on_generate_button_click(entry, type_var, canvas, ax))
    generate_button.pack(pady=5)
    
    root.mainloop()

if __name__ == "__main__":
    main()
