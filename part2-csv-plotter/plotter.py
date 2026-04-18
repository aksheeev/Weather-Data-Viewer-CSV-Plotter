import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg

# ─── Config ────────────────────────────────────────────────────
APP_TITLE   = "CSV Plotter"
BG_PRIMARY  = "#0f1117"
BG_SECONDARY= "#1a1d27"
BG_CARD     = "#1e2130"
ACCENT      = "#4f8ef7"
TEXT_PRIMARY= "#f1f5f9"
TEXT_MUTED  = "#94a3b8"
BORDER      = "#2a2f45"

PLOT_COLORS = {
    "line":    "#4f8ef7",
    "bar":     "#a78bfa",
    "scatter": "#34d399"
}

GRAPH_TYPES = ["Line Chart", "Bar Chart", "Scatter Plot"]

# ─── App ───────────────────────────────────────────────────────
class CSVPlotter(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title(APP_TITLE)
        self.geometry("1000x700")
        self.minsize(800, 600)
        self.configure(bg=BG_PRIMARY)

        self.df          = None   # loaded dataframe
        self.file_path   = None
        self.canvas_widget = None
        self.fig         = None

        self._build_ui()

    # ── UI Construction ────────────────────────────────────────
    def _build_ui(self):
        self._apply_styles()

        # ── Left Panel (controls)
        left = tk.Frame(self, bg=BG_SECONDARY, width=260)
        left.pack(side=tk.LEFT, fill=tk.Y, padx=(16, 0), pady=16)
        left.pack_propagate(False)

        # Logo / Title
        tk.Label(
            left, text="📊  CSV Plotter",
            bg=BG_SECONDARY, fg=ACCENT,
            font=("Segoe UI", 15, "bold")
        ).pack(pady=(20, 4), padx=16, anchor="w")

        tk.Label(
            left, text="Load a CSV and plot your data.",
            bg=BG_SECONDARY, fg=TEXT_MUTED,
            font=("Segoe UI", 9), wraplength=220, justify="left"
        ).pack(padx=16, anchor="w")

        self._divider(left)

        # File picker
        self._section_label(left, "DATA SOURCE")
        self.file_label = tk.Label(
            left, text="No file selected",
            bg=BG_CARD, fg=TEXT_MUTED,
            font=("Segoe UI", 9), wraplength=200,
            justify="left", anchor="w",
            relief="flat", padx=10, pady=8
        )
        self.file_label.pack(fill=tk.X, padx=16, pady=(0, 8))

        tk.Button(
            left, text="Browse CSV",
            command=self._load_csv,
            bg=ACCENT, fg="white",
            font=("Segoe UI", 10, "bold"),
            relief="flat", cursor="hand2",
            activebackground="#3a6fd8",
            activeforeground="white",
            padx=12, pady=8
        ).pack(fill=tk.X, padx=16)

        self._divider(left)

        # Column selectors
        self._section_label(left, "AXES")

        self._field_label(left, "X Axis")
        self.x_var = tk.StringVar()
        self.x_dropdown = ttk.Combobox(
            left, textvariable=self.x_var,
            state="disabled", font=("Segoe UI", 10)
        )
        self.x_dropdown.pack(fill=tk.X, padx=16, pady=(0, 10))

        self._field_label(left, "Y Axis")
        self.y_var = tk.StringVar()
        self.y_dropdown = ttk.Combobox(
            left, textvariable=self.y_var,
            state="disabled", font=("Segoe UI", 10)
        )
        self.y_dropdown.pack(fill=tk.X, padx=16, pady=(0, 4))

        self._divider(left)

        # Graph type
        self._section_label(left, "CHART TYPE")
        self.graph_var = tk.StringVar(value=GRAPH_TYPES[0])
        for gt in GRAPH_TYPES:
            rb = tk.Radiobutton(
                left, text=gt,
                variable=self.graph_var, value=gt,
                bg=BG_SECONDARY, fg=TEXT_PRIMARY,
                selectcolor=BG_CARD,
                activebackground=BG_SECONDARY,
                activeforeground=ACCENT,
                font=("Segoe UI", 10),
                cursor="hand2"
            )
            rb.pack(anchor="w", padx=20, pady=2)

        self._divider(left)

        # Plot button
        tk.Button(
            left, text="Plot Graph",
            command=self._plot,
            bg="#22c55e", fg="white",
            font=("Segoe UI", 11, "bold"),
            relief="flat", cursor="hand2",
            activebackground="#16a34a",
            activeforeground="white",
            padx=12, pady=10
        ).pack(fill=tk.X, padx=16, pady=(0, 8))

        # Clear button
        tk.Button(
            left, text="Clear",
            command=self._clear_plot,
            bg=BG_CARD, fg=TEXT_MUTED,
            font=("Segoe UI", 10),
            relief="flat", cursor="hand2",
            activebackground=BORDER,
            activeforeground=TEXT_PRIMARY,
            padx=12, pady=8
        ).pack(fill=tk.X, padx=16)

        # Row count info at bottom of left panel
        self.info_label = tk.Label(
            left, text="",
            bg=BG_SECONDARY, fg=TEXT_MUTED,
            font=("Segoe UI", 8)
        )
        self.info_label.pack(side=tk.BOTTOM, pady=12)

        # ── Right Panel (plot area)
        right = tk.Frame(self, bg=BG_PRIMARY)
        right.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=16, pady=16)

        # Placeholder when no plot yet
        self.placeholder = tk.Frame(right, bg=BG_CARD, bd=0)
        self.placeholder.pack(fill=tk.BOTH, expand=True)

        tk.Label(
            self.placeholder,
            text="📈",
            font=("Segoe UI", 48),
            bg=BG_CARD, fg=BORDER
        ).pack(expand=True)

        tk.Label(
            self.placeholder,
            text="Load a CSV file and click Plot Graph",
            bg=BG_CARD, fg=TEXT_MUTED,
            font=("Segoe UI", 11)
        ).pack(pady=(0, 80))

        self.plot_frame = right

    # ── Style helpers ──────────────────────────────────────────
    def _apply_styles(self):
        style = ttk.Style(self)
        style.theme_use("clam")
        style.configure(
            "TCombobox",
            fieldbackground=BG_CARD,
            background=BG_CARD,
            foreground=TEXT_PRIMARY,
            bordercolor=BORDER,
            arrowcolor=ACCENT,
            selectbackground=BG_CARD,
            selectforeground=TEXT_PRIMARY,
            padding=6
        )
        style.map("TCombobox",
            fieldbackground=[("readonly", BG_CARD)],
            foreground=[("readonly", TEXT_PRIMARY)]
        )

    def _divider(self, parent):
        tk.Frame(parent, bg=BORDER, height=1).pack(
            fill=tk.X, padx=16, pady=14
        )

    def _section_label(self, parent, text):
        tk.Label(
            parent, text=text,
            bg=BG_SECONDARY, fg=TEXT_MUTED,
            font=("Segoe UI", 8, "bold")
        ).pack(anchor="w", padx=16, pady=(0, 8))

    def _field_label(self, parent, text):
        tk.Label(
            parent, text=text,
            bg=BG_SECONDARY, fg=TEXT_PRIMARY,
            font=("Segoe UI", 9)
        ).pack(anchor="w", padx=16, pady=(0, 4))

    # ── Load CSV ───────────────────────────────────────────────
    def _load_csv(self):
        path = filedialog.askopenfilename(
            title="Select a CSV file",
            filetypes=[("CSV files", "*.csv"), ("All files", "*.*")]
        )
        if not path:
            return

        try:
            self.df = pd.read_csv(path)
        except Exception as e:
            messagebox.showerror("Error", f"Failed to read CSV:\n{e}")
            return

        self.file_path = path
        filename = path.split("/")[-1].split("\\")[-1]
        self.file_label.config(text=filename, fg=TEXT_PRIMARY)

        cols = list(self.df.columns)
        self.x_dropdown.config(values=cols, state="readonly")
        self.y_dropdown.config(values=cols, state="readonly")

        # Smart defaults: first col X, second col Y
        if len(cols) >= 1: self.x_var.set(cols[0])
        if len(cols) >= 2: self.y_var.set(cols[1])

        rows, colcount = self.df.shape
        self.info_label.config(
            text=f"{rows} rows · {colcount} columns"
        )

    # ── Plot ───────────────────────────────────────────────────
    def _plot(self):
        if self.df is None:
            messagebox.showwarning("No Data", "Please load a CSV file first.")
            return

        x_col = self.x_var.get()
        y_col = self.y_var.get()

        if not x_col or not y_col:
            messagebox.showwarning("Missing Selection", "Please select both X and Y columns.")
            return

        if x_col not in self.df.columns or y_col not in self.df.columns:
            messagebox.showerror("Error", "Selected column not found in CSV.")
            return

        graph_type = self.graph_var.get()

        try:
            x_data = self.df[x_col]
            y_data = pd.to_numeric(self.df[y_col], errors="coerce")

            if y_data.isna().all():
                messagebox.showerror(
                    "Invalid Data",
                    f"Column '{y_col}' has no numeric values to plot."
                )
                return

            self._draw_plot(x_data, y_data, x_col, y_col, graph_type)

        except Exception as e:
            messagebox.showerror("Plot Error", str(e))

    # ── Draw Plot ──────────────────────────────────────────────
    def _draw_plot(self, x, y, x_label, y_label, graph_type):
        # Destroy previous canvas
        if self.canvas_widget:
            self.canvas_widget.get_tk_widget().destroy()
            plt.close(self.fig)

        # Hide placeholder
        self.placeholder.pack_forget()

        # Matplotlib dark style
        plt.rcParams.update({
            "figure.facecolor":  BG_CARD,
            "axes.facecolor":    BG_PRIMARY,
            "axes.edgecolor":    BORDER,
            "axes.labelcolor":   TEXT_MUTED,
            "axes.titlecolor":   TEXT_PRIMARY,
            "xtick.color":       TEXT_MUTED,
            "ytick.color":       TEXT_MUTED,
            "grid.color":        BORDER,
            "grid.linestyle":    "--",
            "grid.alpha":        0.5,
            "text.color":        TEXT_PRIMARY,
            "font.family":       "sans-serif"
        })

        self.fig, ax = plt.subplots(figsize=(7, 5))
        self.fig.tight_layout(pad=3)

        color = PLOT_COLORS.get(graph_type.split()[0].lower(), ACCENT)

        # ── Draw the correct chart type
        if graph_type == "Line Chart":
            ax.plot(
                x, y,
                color=color, linewidth=2.2,
                marker="o", markersize=3.5,
                markerfacecolor=color,
                markeredgewidth=0
            )
            ax.fill_between(
                range(len(x)), y,
                color=color, alpha=0.1
            )

        elif graph_type == "Bar Chart":
            bars = ax.bar(
                range(len(x)), y,
                color=color, alpha=0.85,
                width=0.6, edgecolor="none"
            )
            ax.set_xticks(range(len(x)))
            ax.set_xticklabels(x, rotation=45, ha="right", fontsize=8)

        elif graph_type == "Scatter Plot":
            ax.scatter(
                x, y,
                color=color, alpha=0.75,
                s=40, edgecolors="none"
            )

        # ── Axes formatting
        ax.set_title(
            f"{y_label}  vs  {x_label}",
            fontsize=13, fontweight="bold",
            pad=14, color=TEXT_PRIMARY
        )
        ax.set_xlabel(x_label, fontsize=10, labelpad=8)
        ax.set_ylabel(y_label, fontsize=10, labelpad=8)
        ax.grid(True, axis="y")
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)

        # For line/scatter, rotate x ticks if too many
        if graph_type != "Bar Chart":
            if len(x) > 20:
                ax.xaxis.set_major_locator(ticker.MaxNLocator(integer=True, nbins=12))
            plt.setp(ax.get_xticklabels(), rotation=30, ha="right", fontsize=8)

        # ── Embed in Tkinter
        self.canvas_widget = FigureCanvasTkAgg(self.fig, master=self.plot_frame)
        self.canvas_widget.draw()
        self.canvas_widget.get_tk_widget().pack(fill=tk.BOTH, expand=True)

    # ── Clear ──────────────────────────────────────────────────
    def _clear_plot(self):
        if self.canvas_widget:
            self.canvas_widget.get_tk_widget().destroy()
            plt.close(self.fig)
            self.canvas_widget = None
            self.fig = None
        self.placeholder.pack(fill=tk.BOTH, expand=True)


# ─── Entry Point ───────────────────────────────────────────────
if __name__ == "__main__":
    app = CSVPlotter()
    app.mainloop()