import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

ASSETS_DIR = "/Users/manthannayak/Desktop/Reference/DE/ParentCare360/reports/assets_lab678"

fig, ax = plt.subplots(figsize=(8.5, 4.2), dpi=300)
ax.set_xlim(0, 10)
ax.set_ylim(0, 5)
ax.axis('off')

# Style helper
box_kw = dict(boxstyle="round,pad=0.4", ec="#334155", lw=1.2)

# Source Box
ax.text(1.0, 3.8, "Source Data Feeds\n• Raw CSVs (Clinic/Appts)\n• IoT Vitals & Pings\n• Voice NLP Transcripts", 
        fontsize=7.5, ha="center", va="center", bbox=dict(boxstyle="round,pad=0.5", fc="#F1F5F9", ec="#94A3B8", lw=1))

# DAG 1: Telemetry Ingest
ax.text(3.2, 3.8, "DAG 1: Telemetry Ingest\n• Batch UUID Injection\n• Field Normalization\n• Header Canonicalization", 
        fontsize=7.5, ha="center", va="center", bbox=dict(boxstyle="round,pad=0.5", fc="#EEF2FF", ec="#6366F1", lw=1.4))

# DAG 2: Cleansing & DLQ
ax.text(5.5, 3.8, "DAG 2: Cleansing & DLQ\n• Tier 1: Regex & ISO-8601\n• Tier 2: Referential FKs\n• Tier 3: Semantic Bounds\n• Tier 4: Hash Deduplication", 
        fontsize=7.5, ha="center", va="center", bbox=dict(boxstyle="round,pad=0.5", fc="#FEF3C7", ec="#F59E0B", lw=1.4))

# Dead Letter Queue (DLQ)
ax.text(5.5, 1.2, "Dead Letter Queue (DLQ)\nTable: quarantine_records\n• Error Code & Payload Log\n• Zero-Loss Containment", 
        fontsize=7.5, ha="center", va="center", bbox=dict(boxstyle="round,pad=0.5", fc="#FEE2E2", ec="#EF4444", lw=1.4))

# Operational Data Store
ax.text(7.8, 3.8, "Relational Store (WAL)\nTables: appointments, visits\nIndexed: idx_visits_status_time\nDataset: clean_events", 
        fontsize=7.5, ha="center", va="center", bbox=dict(boxstyle="round,pad=0.5", fc="#ECFDF5", ec="#10B981", lw=1.4))

# DAG 3: Alert Engine
ax.text(7.8, 1.2, "DAG 3: Alert Engine\n• Rule 1: Overdue Caregiver\n• Rule 2: Upcoming Appts\n• Rule 3: High Priority Req\n• Rule 4: Inactivity Watchdog\n• Sliding SHA-256 Cache", 
        fontsize=7.5, ha="center", va="center", bbox=dict(boxstyle="round,pad=0.5", fc="#FFE4E6", ec="#F43F5E", lw=1.4))

# DAG 4: Dispatcher
ax.text(3.2, 1.2, "DAG 4: Role Dispatcher\n• RBAC/ABAC Enforcement\n• Adult Child (SMS/Push)\n• Caregiver (Masked Task)\n• Elder (1-Tap SOS / Voice)", 
        fontsize=7.5, ha="center", va="center", bbox=dict(boxstyle="round,pad=0.5", fc="#F0FDF4", ec="#22C55E", lw=1.4))

# Arrows
arrow_kw = dict(arrowstyle="->", lw=1.4, color="#334155")

# Source -> DAG 1
ax.annotate("", xy=(2.3, 3.8), xytext=(1.9, 3.8), arrowprops=arrow_kw)
# DAG 1 -> DAG 2
ax.annotate("", xy=(4.55, 3.8), xytext=(4.1, 3.8), arrowprops=arrow_kw)
ax.text(4.32, 4.05, "raw_events", fontsize=6.5, ha="center", color="#4F46E5", fontweight="bold")

# DAG 2 -> DLQ (Down)
ax.annotate("", xy=(5.5, 2.0), xytext=(5.5, 2.8), arrowprops=dict(arrowstyle="->", lw=1.4, color="#DC2626"))
ax.text(5.95, 2.4, "Invalid (DLQ)", fontsize=6.5, color="#DC2626", fontweight="bold")

# DAG 2 -> Clean DB (Right)
ax.annotate("", xy=(6.85, 3.8), xytext=(6.45, 3.8), arrowprops=arrow_kw)
ax.text(6.65, 4.05, "clean_events", fontsize=6.5, ha="center", color="#059669", fontweight="bold")

# Clean DB -> DAG 3 (Down)
ax.annotate("", xy=(7.8, 2.4), xytext=(7.8, 3.0), arrowprops=arrow_kw)
ax.text(8.4, 2.7, "Dataset Trigger", fontsize=6.5, color="#059669", fontweight="bold")

# DAG 3 -> DAG 4 (Left)
ax.annotate("", xy=(4.5, 1.2), xytext=(6.3, 1.2), arrowprops=arrow_kw)
ax.text(5.4, 1.45, "active_alerts (Deduplicated)", fontsize=6.5, ha="center", color="#BE123C", fontweight="bold")

plt.title("ParentCare360: End-to-End Inter-DAG Orchestration Architecture", fontsize=11, fontweight="bold", pad=8, color="#0F172A")
plt.tight_layout()
plt.savefig(os.path.join(ASSETS_DIR, "pipeline_topology.png"))
plt.close()

print("Pipeline topology diagram generated successfully!")
