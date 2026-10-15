import os
import matplotlib.pyplot as plt
import numpy as np

# Set style
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
plt.rcParams['font.sans-serif'] = 'Helvetica, Arial, DejaVu Sans'
plt.rcParams['axes.edgecolor'] = '#CBD5E1'
plt.rcParams['axes.linewidth'] = 0.8

ASSETS_DIR = "/Users/manthannayak/Desktop/Reference/DE/ParentCare360/reports/assets"
os.makedirs(ASSETS_DIR, exist_ok=True)

days = [f"Day {i}\n({d})" for i, d in enumerate([
    "Aug 31", "Sep 01", "Sep 02", "Sep 03", "Sep 04", "Sep 05",
    "Sep 06", "Sep 07", "Sep 08", "Sep 09", "Sep 10", "Sep 11"
], 1)]
day_nums = np.arange(1, 13)

# -------------------------------------------------------------
# 1. SPRINT BURNUP CHART
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(9, 4.8), dpi=300)
scope = [42, 42, 42, 42, 42, 45, 45, 45, 45, 45, 45, 45]
completed = [0, 3, 6, 10, 15, 18, 22, 26, 31, 35, 39, 41]

ax.plot(day_nums, scope, color='#DC2626', linestyle='--', linewidth=2.2, label='Total Scope (Story Points)', marker='s', markersize=5)
ax.plot(day_nums, completed, color='#16A34A', linewidth=2.5, label='Completed Work (Story Points)', marker='o', markersize=6)
ax.fill_between(day_nums, completed, scope, color='#DC2626', alpha=0.08, label='Remaining Work Gap')
ax.fill_between(day_nums, 0, completed, color='#16A34A', alpha=0.12)

# Value annotations
for i, txt in enumerate(completed):
    if i in [0, 3, 5, 8, 10, 11]:
        ax.annotate(f"{txt} SP", (day_nums[i], completed[i] + 1.2), fontsize=8.5, fontweight='bold', ha='center', color='#15803D')

ax.annotate('+3 SP Added\n(Voice NLP Prototype)', xy=(6, 45), xytext=(6, 48),
            arrowprops=dict(facecolor='#DC2626', shrink=0.05, width=1, headwidth=5),
            fontsize=8, ha='center', color='#991B1B', fontweight='semibold')

ax.set_title("Sprint 1 Burnup Chart (Aug 31 – Sep 11, 2026)", fontsize=13, fontweight='bold', pad=12, color='#1E293B')
ax.set_xlabel("Sprint Timeline (Working Days)", fontsize=10, fontweight='semibold', labelpad=8, color='#334155')
ax.set_ylabel("Story Points", fontsize=10, fontweight='semibold', labelpad=8, color='#334155')
ax.set_xticks(day_nums)
ax.set_xticklabels(days, fontsize=7.5)
ax.set_ylim(-2, 54)
ax.legend(loc='upper left', frameon=True, facecolor='white', framealpha=0.9, fontsize=8.5)
plt.tight_layout()
plt.savefig(os.path.join(ASSETS_DIR, "burnup_chart.png"))
plt.close()

# -------------------------------------------------------------
# 2. SPRINT BURNDOWN CHART
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(9, 4.8), dpi=300)
ideal = np.linspace(42, 0, 12)
actual = [42, 39, 36, 32, 27, 27, 23, 19, 14, 10, 6, 4]

ax.plot(day_nums, ideal, color='#64748B', linestyle=':', linewidth=2, label='Ideal Burndown Guidance', marker='x', markersize=5)
ax.plot(day_nums, actual, color='#2563EB', linewidth=2.5, label='Actual Remaining Work (Story Points)', marker='o', markersize=6)
ax.fill_between(day_nums, 0, actual, color='#2563EB', alpha=0.1)

for i, txt in enumerate(actual):
    if i in [0, 2, 4, 7, 9, 11]:
        ax.annotate(f"{txt} SP", (day_nums[i], actual[i] + 1.3), fontsize=8.5, fontweight='bold', ha='center', color='#1D4ED8')

ax.annotate('Scope Adjustment (+3 SP)', xy=(6, 27), xytext=(6, 33),
            arrowprops=dict(facecolor='#EAB308', shrink=0.05, width=1, headwidth=5),
            fontsize=8, ha='center', color='#854D0E', fontweight='semibold')

ax.set_title("Sprint 1 Burndown Chart (Aug 31 – Sep 11, 2026)", fontsize=13, fontweight='bold', pad=12, color='#1E293B')
ax.set_xlabel("Sprint Timeline (Working Days)", fontsize=10, fontweight='semibold', labelpad=8, color='#334155')
ax.set_ylabel("Remaining Story Points", fontsize=10, fontweight='semibold', labelpad=8, color='#334155')
ax.set_xticks(day_nums)
ax.set_xticklabels(days, fontsize=7.5)
ax.set_ylim(-2, 48)
ax.legend(loc='upper right', frameon=True, facecolor='white', framealpha=0.9, fontsize=8.5)
plt.tight_layout()
plt.savefig(os.path.join(ASSETS_DIR, "burndown_chart.png"))
plt.close()

# -------------------------------------------------------------
# 3. SPRINT THROUGHPUT CHART
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(9, 4.8), dpi=300)
daily_tasks = [1, 1, 1, 2, 1, 2, 1, 2, 2, 2, 1, 0]
rolling_avg = [1.0, 1.0, 1.0, 1.33, 1.33, 1.67, 1.33, 1.67, 2.0, 2.0, 1.67, 1.0]

bars = ax.bar(day_nums, daily_tasks, color='#0284C7', width=0.55, alpha=0.85, edgecolor='#0369A1', label='Tasks Completed Daily')
ax.plot(day_nums, rolling_avg, color='#EA580C', linewidth=2.2, linestyle='-', marker='s', markersize=5, label='3-Day Moving Average Throughput')

for bar, count in zip(bars, daily_tasks):
    if count > 0:
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.08, str(count),
                ha='center', va='bottom', fontsize=9, fontweight='bold', color='#0C4A6E')

ax.set_title("Sprint 1 Daily Throughput & Cadence (16 Tasks Total)", fontsize=13, fontweight='bold', pad=12, color='#1E293B')
ax.set_xlabel("Sprint Timeline (Working Days)", fontsize=10, fontweight='semibold', labelpad=8, color='#334155')
ax.set_ylabel("Tasks Completed", fontsize=10, fontweight='semibold', labelpad=8, color='#334155')
ax.set_xticks(day_nums)
ax.set_xticklabels(days, fontsize=7.5)
ax.set_ylim(0, 3.2)
ax.legend(loc='upper left', frameon=True, facecolor='white', framealpha=0.9, fontsize=8.5)
plt.tight_layout()
plt.savefig(os.path.join(ASSETS_DIR, "throughput_chart.png"))
plt.close()

# -------------------------------------------------------------
# 4. CUMULATIVE FLOW DIAGRAM (CFD)
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(9, 4.8), dpi=300)

done_items = [0, 1, 2, 4, 5, 7, 8, 10, 12, 14, 15, 16]
test_items = [0, 1, 1, 1, 2, 1, 2, 2, 1, 1, 1, 1]
prog_items = [2, 3, 3, 2, 2, 3, 2, 2, 2, 1, 1, 1]
backlog_items = [16, 13, 12, 11, 9, 7, 6, 4, 3, 2, 1, 0]

y_done = np.array(done_items)
y_test = y_done + np.array(test_items)
y_prog = y_test + np.array(prog_items)
y_back = y_prog + np.array(backlog_items)

ax.fill_between(day_nums, 0, y_done, color='#10B981', alpha=0.9, label='Done (Completed & Tested)')
ax.fill_between(day_nums, y_done, y_test, color='#F59E0B', alpha=0.9, label='Review / Quality Validation')
ax.fill_between(day_nums, y_test, y_prog, color='#3B82F6', alpha=0.9, label='In Progress (Active Dev)')
ax.fill_between(day_nums, y_prog, y_back, color='#94A3B8', alpha=0.7, label='Sprint Backlog (Pending)')

ax.set_title("Cumulative Flow Diagram (CFD) — Work Pipeline Tracking", fontsize=13, fontweight='bold', pad=12, color='#1E293B')
ax.set_xlabel("Sprint Timeline (Working Days)", fontsize=10, fontweight='semibold', labelpad=8, color='#334155')
ax.set_ylabel("Total Cumulative Work Items (18 Scope Items)", fontsize=10, fontweight='semibold', labelpad=8, color='#334155')
ax.set_xticks(day_nums)
ax.set_xticklabels(days, fontsize=7.5)
ax.set_ylim(0, 20)
ax.legend(loc='upper left', frameon=True, facecolor='white', framealpha=0.95, fontsize=8)
plt.tight_layout()
plt.savefig(os.path.join(ASSETS_DIR, "cfd_chart.png"))
plt.close()

# -------------------------------------------------------------
# 5. CYCLE TIME CHART
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(9, 4.8), dpi=300)
tasks_labels = [
    "T1: DB Schema", "T2: Seed Data", "T3: Parent Mod", "T4: Health Mod",
    "T5: Alert Engine", "T6: Alert Dedupe", "T7: Raw Data Gen", "T8: ETL Extract",
    "T9: ETL Validate", "T10: ETL Transform", "T11: ETL Load", "T12: Streamlit Base",
    "T13: Caregiver View", "T14: Timeline Feed", "T15: Analytics View", "T16: Demo Scenario"
]
cycle_times = [1.2, 1.0, 1.5, 1.4, 2.2, 1.8, 1.3, 1.6, 2.4, 2.1, 2.5, 2.8, 2.2, 2.0, 2.1, 1.9]
colors = ['#4F46E5' if c <= 2.0 else '#F97316' for c in cycle_times]

x_pos = np.arange(len(tasks_labels))
bars = ax.bar(x_pos, cycle_times, color=colors, width=0.6, edgecolor='#1E1B4B', alpha=0.85)

mean_ct = np.mean(cycle_times)
p85_ct = np.percentile(cycle_times, 85)

ax.axhline(mean_ct, color='#059669', linestyle='--', linewidth=1.8, label=f'Mean Cycle Time ({mean_ct:.2f} Days)')
ax.axhline(p85_ct, color='#DC2626', linestyle=':', linewidth=1.8, label=f'85th Percentile SLA ({p85_ct:.2f} Days)')

for bar, ct in zip(bars, cycle_times):
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.06, f"{ct}d",
            ha='center', va='bottom', fontsize=7.5, fontweight='bold', color='#1F2937')

ax.set_title("Cycle Time per Work Item (In-Progress to Verified)", fontsize=13, fontweight='bold', pad=12, color='#1E293B')
ax.set_xlabel("Completed Development Tasks", fontsize=10, fontweight='semibold', labelpad=8, color='#334155')
ax.set_ylabel("Cycle Time (Days)", fontsize=10, fontweight='semibold', labelpad=8, color='#334155')
ax.set_xticks(x_pos)
ax.set_xticklabels(tasks_labels, rotation=45, ha='right', fontsize=7.5)
ax.set_ylim(0, 3.5)
ax.legend(loc='upper right', frameon=True, facecolor='white', framealpha=0.9, fontsize=8.5)
plt.tight_layout()
plt.savefig(os.path.join(ASSETS_DIR, "cycletime_chart.png"))
plt.close()

# -------------------------------------------------------------
# 6. VELOCITY CHART
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(9, 4.8), dpi=300)
modules = [
    "Database & Schema\n(9 Tables, Seeding)",
    "Alert Engine\n(Rules, Dedup)",
    "Data Eng ETL\n(Ext, Val, Trf, Ld)",
    "Streamlit UI Views\n(Dashboard, Timeline)",
    "Advanced Demos\n(Voice NLP, Travel)"
]
committed_sp = [8, 6, 10, 12, 9]
completed_sp = [8, 6, 10, 12, 5]

x = np.arange(len(modules))
width = 0.35

rects1 = ax.bar(x - width/2, committed_sp, width, label='Committed Points (Total: 45 SP)', color='#94A3B8', edgecolor='#64748B')
rects2 = ax.bar(x + width/2, completed_sp, width, label='Delivered Points (Total: 41 SP)', color='#4F46E5', edgecolor='#3730A3')

for r1, r2 in zip(rects1, rects2):
    h1 = r1.get_height()
    h2 = r2.get_height()
    pct = (h2 / h1) * 100
    ax.text(r1.get_x() + r1.get_width()/2, h1 + 0.3, f"{h1} SP", ha='center', va='bottom', fontsize=8, color='#475569')
    ax.text(r2.get_x() + r2.get_width()/2, h2 + 0.3, f"{h2} SP\n({pct:.0f}%)", ha='center', va='bottom', fontsize=8, fontweight='bold', color='#312E81')

ax.set_title("Sprint 1 Velocity & Scope Fulfillment by Module", fontsize=13, fontweight='bold', pad=12, color='#1E293B')
ax.set_xlabel("System Architectural Modules", fontsize=10, fontweight='semibold', labelpad=8, color='#334155')
ax.set_ylabel("Story Points Delivered", fontsize=10, fontweight='semibold', labelpad=8, color='#334155')
ax.set_xticks(x)
ax.set_xticklabels(modules, fontsize=8)
ax.set_ylim(0, 15.5)
ax.legend(loc='upper right', frameon=True, facecolor='white', framealpha=0.9, fontsize=8.5)
plt.tight_layout()
plt.savefig(os.path.join(ASSETS_DIR, "velocity_chart.png"))
plt.close()

# -------------------------------------------------------------
# 7. SYSTEM ARCHITECTURE / FLOW DIAGRAM
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 5.2), dpi=300)
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis('off')

# Layer Backgrounds
layers = [
    (5, 75, 90, 20, "#EFF6FF", "#3B82F6", "1. INGESTION & DATA SOURCES"),
    (5, 50, 90, 21, "#F0FDF4", "#10B981", "2. DATA PIPELINE & RULE PROCESSING LAYER"),
    (5, 27, 90, 19, "#FAF5FF", "#8B5CF6", "3. PERSISTENCE & STORAGE LAYER (SQLite DB)"),
    (5, 4, 90, 19, "#FFF7ED", "#F97316", "4. APPLICATION & PRESENTATION LAYER (Streamlit UI)")
]

for x, y, w, h, bg, border, title in layers:
    rect = plt.Rectangle((x, y), w, h, facecolor=bg, edgecolor=border, linewidth=1.5, linestyle='-', zorder=1)
    ax.add_patch(rect)
    ax.text(x + 2, y + h - 4.5, title, fontsize=9, fontweight='bold', color=border, zorder=2)

# Sub-components
def draw_box(x, y, w, h, text, subtext, color, border_col):
    box = plt.Rectangle((x, y), w, h, facecolor=color, edgecolor=border_col, linewidth=1.2, zorder=3)
    ax.add_patch(box)
    ax.text(x + w/2, y + h/2 + 1.2, text, fontsize=8, fontweight='bold', color='#0F172A', ha='center', va='center', zorder=4)
    ax.text(x + w/2, y + h/2 - 2.5, subtext, fontsize=6.8, color='#475569', ha='center', va='center', zorder=4)

# Ingestion
draw_box(8, 77, 26, 12, "Synthetic Raw Files", "appointments.csv, requests.csv", "#DBEAFE", "#2563EB")
draw_box(37, 77, 26, 12, "Direct Manual Entry", "Family / Caregiver Streamlit Form", "#DBEAFE", "#2563EB")
draw_box(66, 77, 26, 12, "Voice Audio Transcripts", "Hindi / English NLP Dictation", "#DBEAFE", "#2563EB")

# Processing
draw_box(8, 52, 19, 13, "ETL Extract", "Ingest & Schema Check", "#DCFCE7", "#16A34A")
draw_box(29, 52, 19, 13, "ETL Validate", "Nulls, Dates, FK Integrity", "#DCFCE7", "#16A34A")
draw_box(50, 52, 19, 13, "ETL Transform & Load", "Standardization & SQL Insert", "#DCFCE7", "#16A34A")
draw_box(71, 52, 21, 13, "Alert Engine", "Overdue, Urgent, Deduplication", "#FEF08A", "#CA8A04")

# Storage
draw_box(8, 29, 26, 11.5, "Core Relational Tables", "parents, family, caregivers", "#F3E8FF", "#7C3AED")
draw_box(37, 29, 26, 11.5, "Operational Event Tables", "appointments, visits, requests", "#F3E8FF", "#7C3AED")
draw_box(66, 29, 26, 11.5, "Auditing & Event Feeds", "alerts, care_events, travel", "#F3E8FF", "#7C3AED")

# Presentation
draw_box(8, 6, 26, 11.5, "Operations Dashboard", "KPI Cards, Live Alert Stream", "#FFEDD5", "#EA580C")
draw_box(37, 6, 26, 11.5, "Specialized Views", "Healthcare, Caregivers, Requests", "#FFEDD5", "#EA580C")
draw_box(66, 6, 26, 11.5, "Analytics & Demo Engine", "Care Timeline, Charts & ETL UI", "#FFEDD5", "#EA580C")

# Connecting Arrows
arrow_style = dict(arrowstyle="->", color="#475569", lw=1.5)
ax.annotate('', xy=(21, 65), xytext=(21, 77), arrowprops=arrow_style, zorder=5)
ax.annotate('', xy=(50, 65), xytext=(50, 77), arrowprops=arrow_style, zorder=5)
ax.annotate('', xy=(79, 65), xytext=(79, 77), arrowprops=arrow_style, zorder=5)

ax.annotate('', xy=(21, 41), xytext=(21, 52), arrowprops=arrow_style, zorder=5)
ax.annotate('', xy=(50, 41), xytext=(50, 52), arrowprops=arrow_style, zorder=5)
ax.annotate('', xy=(79, 41), xytext=(79, 52), arrowprops=arrow_style, zorder=5)

ax.annotate('', xy=(21, 18), xytext=(21, 29), arrowprops=arrow_style, zorder=5)
ax.annotate('', xy=(50, 18), xytext=(50, 29), arrowprops=arrow_style, zorder=5)
ax.annotate('', xy=(79, 18), xytext=(79, 29), arrowprops=arrow_style, zorder=5)

plt.title("ParentCare360 — End-to-End System Architecture & Data Flow", fontsize=12, fontweight='bold', pad=10, color='#0F172A')
plt.tight_layout()
plt.savefig(os.path.join(ASSETS_DIR, "architecture_diagram.png"))
plt.close()

print("All 7 charts generated successfully!")
