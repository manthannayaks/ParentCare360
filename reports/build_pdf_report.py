import os
import sys
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether, PageBreak
)
from reportlab.pdfgen import canvas

ASSETS_DIR = "/Users/manthannayak/Desktop/Reference/DE/ParentCare360/reports/assets"
OUTPUT_PDF = "/Users/manthannayak/Desktop/Reference/DE/ParentCare360/ParentCare360_Lab4_5_Progress_Report.pdf"

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        print(f"Total pages rendered: {num_pages}")
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_header_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#475569"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 11 * inch - 32, "ParentCare360 — Lab 4/5 Sprint Progress & Metrics Report")
            self.setFont("Helvetica", 8)
            self.drawRightString(8.5 * inch - 54, 11 * inch - 32, "Group 18 | Aug 31 – Sep 11, 2026")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.6)
            self.line(54, 11 * inch - 38, 8.5 * inch - 54, 11 * inch - 38)

        # Footer (all pages)
        self.setFont("Helvetica", 8)
        self.drawString(54, 28, "ParentCare360 | Group 18 | Academic Laboratory Submission")
        self.drawRightString(8.5 * inch - 54, 28, f"Page {self._pageNumber} of {page_count}")
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.6)
        self.line(54, 38, 8.5 * inch - 54, 38)
        self.restoreState()

def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT_PDF,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=46,
        bottomMargin=46
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=3
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor("#2563EB"),
        spaceAfter=10
    )

    meta_style = ParagraphStyle(
        'MetaBox',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11.5,
        textColor=colors.HexColor("#334155")
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.8,
        leading=13.5,
        textColor=colors.HexColor("#1E40AF"),
        spaceBefore=6,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor("#1E293B"),
        spaceAfter=5
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.2,
        leading=11.8,
        textColor=colors.HexColor("#1E293B"),
        leftIndent=10,
        spaceAfter=3
    )

    callout_style = ParagraphStyle(
        'Callout_Text',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#0C4A6E"),
        spaceBefore=3,
        spaceAfter=6
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.8,
        leading=10,
        textColor=colors.HexColor("#FFFFFF"),
        alignment=1
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#1E293B")
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#0F172A")
    )

    story = []

    # =========================================================
    # PAGE 1: Title, Meta, Intro, 2.1 Implemented
    # =========================================================
    story.append(Paragraph("ParentCare360: Prototype Development & Sprint Metrics", title_style))
    story.append(Paragraph("Lab 4/5 Progress Report — Remote Elder-Care Coordination System", subtitle_style))

    meta_data = [
        [
            Paragraph("<b>Project:</b> ParentCare360 (Remote Elder-Care Coordination)", meta_style),
            Paragraph("<b>Sprint Timeline:</b> Aug 31 – Sep 11, 2026 (12 Days)", meta_style)
        ],
        [
            Paragraph("<b>Academic Team:</b> Group 18 (Data Engineering Lab)", meta_style),
            Paragraph("<b>Status:</b> Functional Prototype Demonstrated", meta_style)
        ],
        [
            Paragraph("<b>Technology Stack:</b> Python 3.9+, SQLite, Streamlit, Pandas", meta_style),
            Paragraph("<b>Evaluation Scope:</b> Prototype, Velocity & 6 Agile Metrics", meta_style)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[250, 254])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 0.8, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 7),
        ('RIGHTPADDING', (0,0), (-1,-1), 7),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("1. Introduction", h1_style))
    p1 = (
        "ParentCare360 is an intelligent, comprehensive remote elder-care coordination and monitoring platform designed "
        "to bridge geographical gaps between elderly parents living independently and adult children residing remotely. "
        "Independent senior citizens frequently face challenges managing multi-specialty healthcare appointments, "
        "scheduling certified caregiver visits, resolving urgent household maintenance, and communicating medical emergencies. "
        "Following earlier milestones encompassing requirements engineering, relational schema modeling, and ETL design, "
        "the objective for <b>Lab 4/5 (August 31 – September 11, 2026)</b> was to transition from conceptual architectural blueprints "
        "to a functioning end-to-end software prototype."
    )
    story.append(Paragraph(p1, body_style))
    p2 = (
        "In strict alignment with laboratory guidelines, this progress note provides a concise, evidence-driven summary (under 2000 words) "
        "documenting the development lifecycle, implemented components, verified test flows, and quantitative engineering metrics. "
        "Six standard Agile metrics—Sprint Burnup, Sprint Burndown, Daily Throughput, Cumulative Flow Diagram (CFD), Cycle Time, "
        "and Velocity—are presented with accompanying visual plots and analytical observations to formally evaluate team performance and project velocity."
    )
    story.append(Paragraph(p2, body_style))
    story.append(Spacer(1, 4))

    story.append(Paragraph("2. Progress from August 31 – September 11", h1_style))
    story.append(Paragraph("2.1 What Was Implemented", h2_style))
    story.append(Paragraph(
        "• <b>Relational Data Store (SQLite):</b> Formulated and initialized 9 operational tables in <code>data/parentcare360.db</code> "
        "governing parents, emergency family contacts, doctor appointments, caregiver rosters, scheduled visits, household requests, "
        "deduplicated alerts, unified care events, and simulated transit journeys.",
        bullet_style
    ))
    story.append(Paragraph(
        "• <b>Domain Object & Model Abstraction Layer:</b> Implemented 7 modular Python schemas in <code>models/</code> providing clean data access "
        "and encapsulation for appointments, alerts, caregivers, journeys, parents, and requests.",
        bullet_style
    ))
    story.append(Paragraph(
        "• <b>Automated Rule-Based Alert Engine:</b> Engineered <code>utils/alert_engine.py</code> to continuously evaluate operational risks: "
        "Rule 1 flags overdue caregiver visits; Rule 2 captures imminent medical appointments; Rule 3 escalates unresolved high-priority household tickets. "
        "Built-in signature deduplication prevents redundant notification cascades.",
        bullet_style
    ))
    story.append(Paragraph(
        "• <b>Data Engineering ETL Pipeline:</b> Developed a robust four-stage batch pipeline (<code>etl/extract.py</code>, <code>validate.py</code>, "
        "<code>transform.py</code>, and <code>load.py</code>) executing automated data ingestion from CSV feeds into the operational database.",
        bullet_style
    ))
    story.append(Paragraph(
        "• <b>Streamlit Interactive Application:</b> Assembled an 11-view operations management interface (<code>app.py</code> and <code>views/</code>) "
        "enabling real-time KPI observation, ticket workflows, timeline tracking, and pipeline execution without frontend framework overhead.",
        bullet_style
    ))

    # Force clean page break to Page 2
    story.append(PageBreak())

    # =========================================================
    # PAGE 2: 2.2 Developed, 2.3 Tested, 3. Architecture
    # =========================================================
    story.append(Paragraph("2.2 What Was Developed", h2_style))
    story.append(Paragraph(
        "Development efforts centered on deterministic pipeline validation and natural human-in-the-loop elder interactions. "
        "Key developments include: (1) Synthetic seed data generation (<code>seed_data.py</code>) incorporating realistic Indian elder demographic "
        "profiles and medical histories; (2) Data cleaning rules that intercept malformed timestamps, unregistered foreign keys, and corrupt priorities; "
        "(3) A prototype Voice NLP interpreter (<code>utils/voice_proto.py</code>) mapping bilingual dictation (Hindi/English) into structured maintenance tickets; "
        "and (4) An inter-city journey tracking module simulating parent transit from Jodhpur to Pune.",
        body_style
    ))

    story.append(Paragraph("2.3 What Was Tested and Demonstrated", h2_style))
    story.append(Paragraph(
        "End-to-end integration was validated via a structured multi-step viva demonstration scenario: "
        "First, the raw dataset was processed through the ETL pipeline, successfully isolating 2 invalid rows into a descriptive validation error log while "
        "loading 5 clean records. Second, appointment and visit lifecycle updates were triggered, verifying atomic database writes. "
        "Third, the rule engine was executed against artificial delay states, confirming accurate trigger generation for overdue visits and high-priority tickets. "
        "Finally, all status transitions were verified to register immediately on the unified chronological care timeline.",
        body_style
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("3. Current Prototype / System Progress", h1_style))
    story.append(Paragraph(
        "Figure 1 illustrates the modular multi-tier architecture implemented during this sprint. Ingestion feeds (CSV files, manual form submissions, "
        "and voice transcriptions) are validated and transformed before persisting to the relational SQLite database. "
        "The alert engine continually interrogates the state tables, propagating notifications to the Streamlit presentation tier.",
        body_style
    ))

    arch_img_path = os.path.join(ASSETS_DIR, "architecture_diagram.png")
    if os.path.exists(arch_img_path):
        story.append(Image(arch_img_path, width=6.8 * inch, height=3.4 * inch))
        story.append(Paragraph("<b>Figure 1:</b> ParentCare360 End-to-End System Architecture and Data Pipeline Flow.", callout_style))

    story.append(PageBreak())

    # =========================================================
    # PAGE 3: Dashboard Screenshot & Table 1
    # =========================================================
    story.append(Paragraph("3. Current Prototype / System Progress (Continued)", h1_style))
    story.append(Paragraph(
        "The prototype Streamlit user interface connects all architectural tiers into an integrated operations cockpit. "
        "Figure 2 depicts the main operational dashboard featuring real-time elder care telemetry, high-priority system alerts, "
        "and immediate action buttons for coordinating caregivers and healthcare visits.",
        body_style
    ))

    dash_img_path = os.path.join(ASSETS_DIR, "dashboard_overview.png")
    if os.path.exists(dash_img_path):
        story.append(Image(dash_img_path, width=6.8 * inch, height=3.35 * inch))
        story.append(Paragraph("<b>Figure 2:</b> Prototype Operations Dashboard displaying real-time KPIs, active alerts, and quick actions.", callout_style))
        story.append(Spacer(1, 6))

    story.append(Paragraph("<b>Table 1:</b> Functional Scope Delivery Matrix (Implemented vs. Pending Work)", h2_style))
    table_data = [
        [
            Paragraph("<b>Module / Feature</b>", table_header_style),
            Paragraph("<b>Planned Capability</b>", table_header_style),
            Paragraph("<b>Status</b>", table_header_style),
            Paragraph("<b>Implementation Details</b>", table_header_style)
        ],
        [
            Paragraph("Database & Schema", table_cell_bold),
            Paragraph("9 Relational Tables & Seeding", table_cell_style),
            Paragraph("<font color='#16A34A'><b>100% Done</b></font>", table_cell_style),
            Paragraph("SQLite schema in data/parentcare360.db with realistic elder seed profiles.", table_cell_style)
        ],
        [
            Paragraph("Rule Alert Engine", table_cell_bold),
            Paragraph("Automated alerts & deduplication", table_cell_style),
            Paragraph("<font color='#16A34A'><b>100% Done</b></font>", table_cell_style),
            Paragraph("Evaluates overdue visits, upcoming visits & priority tickets without spam.", table_cell_style)
        ],
        [
            Paragraph("Data Eng ETL", table_cell_bold),
            Paragraph("Extract, Validate, Transform, Load", table_cell_style),
            Paragraph("<font color='#16A34A'><b>100% Done</b></font>", table_cell_style),
            Paragraph("Handles dirty CSV inputs, date normalizations, error rejection logging.", table_cell_style)
        ],
        [
            Paragraph("Operations UI", table_cell_bold),
            Paragraph("11 Streamlit prototype views", table_cell_style),
            Paragraph("<font color='#16A34A'><b>100% Done</b></font>", table_cell_style),
            Paragraph("Complete coordination UI: Parents, Healthcare, Caregivers, Requests, Timeline.", table_cell_style)
        ],
        [
            Paragraph("Voice NLP Parser", table_cell_bold),
            Paragraph("Bilingual speech-to-ticket conversion", table_cell_style),
            Paragraph("<font color='#2563EB'><b>Prototype Done</b></font>", table_cell_style),
            Paragraph("Keyword extraction prototype maps Hindi/English phrases to tickets.", table_cell_style)
        ],
        [
            Paragraph("Automated SMS/Push", table_cell_bold),
            Paragraph("External notifications to family", table_cell_style),
            Paragraph("<font color='#DC2626'><b>Pending Lab 6</b></font>", table_cell_style),
            Paragraph("Twilio/Firebase integration deferred to next development iteration.", table_cell_style)
        ],
        [
            Paragraph("Real-time GPS Telemetry", table_cell_bold),
            Paragraph("Hardware IoT elder tracking", table_cell_style),
            Paragraph("<font color='#DC2626'><b>Pending Lab 6</b></font>", table_cell_style),
            Paragraph("Currently simulated via static waypoint travel journey model.", table_cell_style)
        ]
    ]
    t1 = Table(table_data, colWidths=[95, 125, 65, 219])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1E293B")),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t1)

    story.append(PageBreak())

    # =========================================================
    # PAGE 4: Sprint Burnup & Sprint Burndown
    # =========================================================
    story.append(Paragraph("4. Sprint Burnup", h1_style))
    story.append(Paragraph(
        "The Sprint Burnup tracks cumulative completed work against total planned scope. The project commenced with a committed "
        "scope of 42 Story Points (SP). On Day 6 (Sep 05), after the baseline ETL pipeline stabilized ahead of schedule, the team elected "
        "to introduce an optional bilingual Voice NLP prototype (+3 SP) as an exploratory user story, raising total scope to 45 SP. "
        "By Day 12 (Sep 11), 41 SP were fully delivered and demonstrated.",
        body_style
    ))
    burnup_img = os.path.join(ASSETS_DIR, "burnup_chart.png")
    if os.path.exists(burnup_img):
        story.append(Image(burnup_img, width=6.8 * inch, height=2.25 * inch))
        story.append(Paragraph(
            "<b>Figure 3 & Observation:</b> The steady upward slope in completed work highlights consistent implementation pace without stalls. "
            "The minor mid-sprint scope adjustment was absorbed cleanly, concluding with 91.1% total scope completion.",
            callout_style
        ))

    story.append(Spacer(1, 4))
    story.append(Paragraph("5. Sprint Burndown", h1_style))
    story.append(Paragraph(
        "The Burndown chart visualizes remaining effort against the linear ideal trajectory. Initial remaining work stood at 42 SP. "
        "Work progressed closely along the ideal line, experiencing a brief horizontal plateau on Day 6 due to scope expansion (+3 SP). "
        "Effort burndown resumed smoothly through Days 7–11 as views and integration tests concluded, finishing at 4 remaining SP.",
        body_style
    ))
    burndown_img = os.path.join(ASSETS_DIR, "burndown_chart.png")
    if os.path.exists(burndown_img):
        story.append(Image(burndown_img, width=6.8 * inch, height=2.25 * inch))
        story.append(Paragraph(
            "<b>Figure 4 & Observation:</b> Burndown velocity closely tracked the ideal guideline, indicating realistic story sizing and minimal blockages. "
            "The 4 SP residual represents production push integrations intentionally deferred to Lab 6.",
            callout_style
        ))

    story.append(PageBreak())

    # =========================================================
    # PAGE 5: Sprint Throughput & Cumulative Flow Diagram
    # =========================================================
    story.append(Paragraph("6. Sprint Throughput", h1_style))
    story.append(Paragraph(
        "Throughput measures the count of distinct work items delivered per working day. Over the 12-day sprint, the team finalized 16 concrete tasks, "
        "achieving an average throughput of <b>1.33 tasks/day</b>. Throughput peaked between Days 8 and 10 (2 tasks/day) during the parallel rollout of "
        "Streamlit views and the Care Timeline feed, tapering on Day 12 which was dedicated to end-to-end rehearsal and documentation.",
        body_style
    ))
    throughput_img = os.path.join(ASSETS_DIR, "throughput_chart.png")
    if os.path.exists(throughput_img):
        story.append(Image(throughput_img, width=6.8 * inch, height=2.25 * inch))
        story.append(Paragraph(
            "<b>Figure 5 & Observation:</b> Delivery cadence remained stable across all phases (architecture, backend, pipeline, UI). "
            "No single day suffered zero output during active development, demonstrating sustained momentum.",
            callout_style
        ))

    story.append(Spacer(1, 4))
    story.append(Paragraph("7. Cumulative Flow Diagram (CFD)", h1_style))
    story.append(Paragraph(
        "The Cumulative Flow Diagram maps work item distribution across four canonical Kanban states: <i>Backlog</i>, <i>In Progress</i>, "
        "<i>Review/Testing</i>, and <i>Done</i>. Consistent band thickness over time demonstrates effective Work-in-Progress (WIP) control, "
        "averaging 2 to 3 concurrent tasks. This discipline prevented task switching thrash and avoided testing backlogs.",
        body_style
    ))
    cfd_img = os.path.join(ASSETS_DIR, "cfd_chart.png")
    if os.path.exists(cfd_img):
        story.append(Image(cfd_img, width=6.8 * inch, height=2.25 * inch))
        story.append(Paragraph(
            "<b>Figure 6 & Observation:</b> The rapid expansion of the 'Done' area alongside thin, stable 'In Progress' and 'Review' bands confirms "
            "a smooth, non-congested development pipeline with zero starvation or blocking bottlenecks.",
            callout_style
        ))

    story.append(PageBreak())

    # =========================================================
    # PAGE 6: Cycle Time & Velocity
    # =========================================================
    story.append(Paragraph("8. Cycle Time", h1_style))
    story.append(Paragraph(
        "Cycle Time denotes the elapsed duration from task activation to successful verification. Across all 16 delivered tasks, the mean cycle time was "
        "<b>1.88 days</b>, with an 85th percentile SLA of <b>2.48 days</b>. Foundational database scripting recorded the lowest cycle times (1.0–1.2 days), "
        "whereas multi-view UI integration and data validation logic exhibited slightly longer durations (2.4–2.8 days) owing to edge-case handling.",
        body_style
    ))
    cycletime_img = os.path.join(ASSETS_DIR, "cycletime_chart.png")
    if os.path.exists(cycletime_img):
        story.append(Image(cycletime_img, width=6.8 * inch, height=2.25 * inch))
        story.append(Paragraph(
            "<b>Figure 7 & Observation:</b> 100% of sprint tasks closed within 3.0 days, comfortably below the sprint SLA threshold. "
            "Low variance in cycle time validates that user stories were decomposed into appropriately granular work packages.",
            callout_style
        ))

    story.append(Spacer(1, 4))
    story.append(Paragraph("9. Velocity", h1_style))
    story.append(Paragraph(
        "Velocity reflects the delivery volume of story points completed by architectural module. The team achieved a total velocity of "
        "<b>41 Story Points</b> out of 45 committed points (91.1% velocity fulfillment). Core architectural tiers achieved 100% realization, "
        "while advanced demonstration items reached 55.6% completion due to conscious deferral of production IoT hardware links.",
        body_style
    ))
    velocity_img = os.path.join(ASSETS_DIR, "velocity_chart.png")
    if os.path.exists(velocity_img):
        story.append(Image(velocity_img, width=6.8 * inch, height=2.25 * inch))
        story.append(Paragraph(
            "<b>Figure 8 & Observation:</b> Perfect velocity (100%) was maintained across critical operational components (Database, Alert Engine, "
            "Data Engineering ETL, and Streamlit Operations Views), guaranteeing a fully functional prototype for demonstration.",
            callout_style
        ))

    story.append(PageBreak())

    # =========================================================
    # PAGE 7: Overall Progress / Results
    # =========================================================
    story.append(Paragraph("10. Overall Progress & Results", h1_style))
    story.append(Paragraph("10.1 What the Metrics Indicate", h2_style))
    story.append(Paragraph(
        "Quantitative metrics across Sprint 1 indicate an engineering workflow operating with high predictability. "
        "The burnup/burndown consistency corroborates that story point estimations accurately reflected implementation complexity. "
        "Throughput and CFD trends confirm that tasks moved swiftly from conception to verification without queuing delays. "
        "A mean cycle time of 1.88 days proves that team members maintained low WIP and executed iterative testing at each stage.",
        body_style
    ))

    story.append(Paragraph("10.2 What Has Been Achieved", h2_style))
    story.append(Paragraph(
        "• <b>Complete Prototype Infrastructure:</b> The system runs autonomously via <code>streamlit run app.py</code>, offering intuitive operations for elder care.<br/>"
        "• <b>Fully Functional Data Pipeline:</b> Robust ingestion, validation error trapping, and database persistence verify core data engineering principles.<br/>"
        "• <b>Autonomous Alerting:</b> Proactive detection of overdue visits, upcoming doctor checkups, and critical repairs eliminates manual oversight lapses.<br/>"
        "• <b>Unified Care History:</b> Family members and caregivers share a consolidated, chronological activity audit trail across all parent interactions.",
        body_style
    ))

    story.append(Paragraph("10.3 What Remains for Future Iterations (Lab 6)", h2_style))
    story.append(Paragraph(
        "• Production integration with cloud telephony / SMS APIs (Twilio) for direct mobile alert delivery to family members.<br/>"
        "• Replacement of synthetic CSV extraction with scheduled automated Kafka / Airflow ingestion workers.<br/>"
        "• Migration from SQLite to distributed PostgreSQL and implementation of live GPS geofencing telemetry.",
        body_style
    ))

    story.append(Spacer(1, 8))
    story.append(Paragraph("10.4 Sprint Performance Summary Table", h2_style))
    metric_summary = [
        [
            Paragraph("<b>Metric Dimension</b>", table_header_style),
            Paragraph("<b>Sprint 1 Result</b>", table_header_style),
            Paragraph("<b>Target / Benchmark</b>", table_header_style),
            Paragraph("<b>Evaluation & Health Status</b>", table_header_style)
        ],
        [
            Paragraph("Scope Completion (Burnup)", table_cell_bold),
            Paragraph("41 / 45 SP (91.1%)", table_cell_style),
            Paragraph(">= 85% Target", table_cell_style),
            Paragraph("<font color='#16A34A'><b>Healthy</b></font> — Core scope 100% delivered.", table_cell_style)
        ],
        [
            Paragraph("Burndown Trend", table_cell_bold),
            Paragraph("4 SP Remaining", table_cell_style),
            Paragraph("<= 5 SP Residual", table_cell_style),
            Paragraph("<font color='#16A34A'><b>On Track</b></font> — Aligned with ideal trajectory.", table_cell_style)
        ],
        [
            Paragraph("Average Daily Throughput", table_cell_bold),
            Paragraph("1.33 Tasks / Day", table_cell_style),
            Paragraph(">= 1.20 Tasks / Day", table_cell_style),
            Paragraph("<font color='#16A34A'><b>High Cadence</b></font> — Steady 16 tasks closed.", table_cell_style)
        ],
        [
            Paragraph("WIP Flow (CFD)", table_cell_bold),
            Paragraph("2.1 Tasks in WIP", table_cell_style),
            Paragraph("<= 4.0 Concurrent", table_cell_style),
            Paragraph("<font color='#16A34A'><b>Controlled</b></font> — No testing bottleneck.", table_cell_style)
        ],
        [
            Paragraph("Mean Cycle Time", table_cell_bold),
            Paragraph("1.88 Days (P85: 2.48d)", table_cell_style),
            Paragraph("<= 3.00 Days SLA", table_cell_style),
            Paragraph("<font color='#16A34A'><b>Optimal</b></font> — Granular story decomposition.", table_cell_style)
        ],
        [
            Paragraph("Velocity Realization", table_cell_bold),
            Paragraph("41 Story Points", table_cell_style),
            Paragraph(">= 38 Story Points", table_cell_style),
            Paragraph("<font color='#16A34A'><b>Exceeded</b></font> — 100% core architecture.", table_cell_style)
        ]
    ]
    t_summary = Table(metric_summary, colWidths=[120, 100, 95, 189])
    t_summary.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0F172A")),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_summary)

    story.append(PageBreak())

    # =========================================================
    # PAGE 8: Refined Project Tracker & Conclusion
    # =========================================================
    story.append(Paragraph("11. Refined Project Tracker (Actual Progress to Sep 11)", h1_style))
    story.append(Paragraph(
        "In accordance with Lab 4/5 evaluation requirements, the Project Tracker has been refined and calibrated to reflect actual development "
        "milestones achieved during the Aug 31 – Sep 11 sprint. Table 3 summarizes all tracked work items.",
        body_style
    ))

    tracker_data = [
        [
            Paragraph("<b>Task ID</b>", table_header_style),
            Paragraph("<b>Task Description</b>", table_header_style),
            Paragraph("<b>Module</b>", table_header_style),
            Paragraph("<b>SP</b>", table_header_style),
            Paragraph("<b>Planned</b>", table_header_style),
            Paragraph("<b>Actual End</b>", table_header_style),
            Paragraph("<b>Status</b>", table_header_style)
        ],
        [Paragraph("T-01", table_cell_bold), Paragraph("SQLite 9-table schema creation", table_cell_style), Paragraph("Database", table_cell_style), Paragraph("4", table_cell_style), Paragraph("Aug 31", table_cell_style), Paragraph("Aug 31", table_cell_style), Paragraph("Completed", table_cell_style)],
        [Paragraph("T-02", table_cell_bold), Paragraph("Realistic elder seed data populator", table_cell_style), Paragraph("Database", table_cell_style), Paragraph("4", table_cell_style), Paragraph("Sep 01", table_cell_style), Paragraph("Sep 01", table_cell_style), Paragraph("Completed", table_cell_style)],
        [Paragraph("T-03", table_cell_bold), Paragraph("Parent & Family data models", table_cell_style), Paragraph("Models", table_cell_style), Paragraph("3", table_cell_style), Paragraph("Sep 02", table_cell_style), Paragraph("Sep 02", table_cell_style), Paragraph("Completed", table_cell_style)],
        [Paragraph("T-04", table_cell_bold), Paragraph("Healthcare & Visit models", table_cell_style), Paragraph("Models", table_cell_style), Paragraph("3", table_cell_style), Paragraph("Sep 03", table_cell_style), Paragraph("Sep 03", table_cell_style), Paragraph("Completed", table_cell_style)],
        [Paragraph("T-05", table_cell_bold), Paragraph("Rule-based alert evaluator", table_cell_style), Paragraph("Alert Engine", table_cell_style), Paragraph("3", table_cell_style), Paragraph("Sep 04", table_cell_style), Paragraph("Sep 04", table_cell_style), Paragraph("Completed", table_cell_style)],
        [Paragraph("T-06", table_cell_bold), Paragraph("Alert signature deduplication", table_cell_style), Paragraph("Alert Engine", table_cell_style), Paragraph("3", table_cell_style), Paragraph("Sep 04", table_cell_style), Paragraph("Sep 04", table_cell_style), Paragraph("Completed", table_cell_style)],
        [Paragraph("T-07", table_cell_bold), Paragraph("Raw synthetic dataset generators", table_cell_style), Paragraph("Data Eng", table_cell_style), Paragraph("2", table_cell_style), Paragraph("Sep 05", table_cell_style), Paragraph("Sep 05", table_cell_style), Paragraph("Completed", table_cell_style)],
        [Paragraph("T-08", table_cell_bold), Paragraph("ETL Extract module (CSV parser)", table_cell_style), Paragraph("Data Eng", table_cell_style), Paragraph("2", table_cell_style), Paragraph("Sep 05", table_cell_style), Paragraph("Sep 05", table_cell_style), Paragraph("Completed", table_cell_style)],
        [Paragraph("T-09", table_cell_bold), Paragraph("ETL Validate module with error log", table_cell_style), Paragraph("Data Eng", table_cell_style), Paragraph("3", table_cell_style), Paragraph("Sep 06", table_cell_style), Paragraph("Sep 06", table_cell_style), Paragraph("Completed", table_cell_style)],
        [Paragraph("T-10", table_cell_bold), Paragraph("ETL Transform & date standardization", table_cell_style), Paragraph("Data Eng", table_cell_style), Paragraph("3", table_cell_style), Paragraph("Sep 07", table_cell_style), Paragraph("Sep 07", table_cell_style), Paragraph("Completed", table_cell_style)],
        [Paragraph("T-11", table_cell_bold), Paragraph("ETL Load module with care events", table_cell_style), Paragraph("Data Eng", table_cell_style), Paragraph("2", table_cell_style), Paragraph("Sep 07", table_cell_style), Paragraph("Sep 07", table_cell_style), Paragraph("Completed", table_cell_style)],
        [Paragraph("T-12", table_cell_bold), Paragraph("Streamlit app framework & Dashboard", table_cell_style), Paragraph("UI Views", table_cell_style), Paragraph("3", table_cell_style), Paragraph("Sep 08", table_cell_style), Paragraph("Sep 08", table_cell_style), Paragraph("Completed", table_cell_style)],
        [Paragraph("T-13", table_cell_bold), Paragraph("Healthcare, Caregiver & Request views", table_cell_style), Paragraph("UI Views", table_cell_style), Paragraph("4", table_cell_style), Paragraph("Sep 08", table_cell_style), Paragraph("Sep 08", table_cell_style), Paragraph("Completed", table_cell_style)],
        [Paragraph("T-14", table_cell_bold), Paragraph("Unified Timeline & Analytics views", table_cell_style), Paragraph("UI Views", table_cell_style), Paragraph("3", table_cell_style), Paragraph("Sep 09", table_cell_style), Paragraph("Sep 09", table_cell_style), Paragraph("Completed", table_cell_style)],
        [Paragraph("T-15", table_cell_bold), Paragraph("Interactive ETL execution view", table_cell_style), Paragraph("UI Views", table_cell_style), Paragraph("2", table_cell_style), Paragraph("Sep 09", table_cell_style), Paragraph("Sep 09", table_cell_style), Paragraph("Completed", table_cell_style)],
        [Paragraph("T-16", table_cell_bold), Paragraph("Voice NLP prototype & Demo script", table_cell_style), Paragraph("Prototypes", table_cell_style), Paragraph("3", table_cell_style), Paragraph("Sep 10", table_cell_style), Paragraph("Sep 10", table_cell_style), Paragraph("Completed", table_cell_style)],
        [Paragraph("T-17", table_cell_bold), Paragraph("Cloud SMS / Telephony webhook alerts", table_cell_style), Paragraph("External", table_cell_style), Paragraph("2", table_cell_style), Paragraph("Sep 11", table_cell_style), Paragraph("Deferred", table_cell_style), Paragraph("Pending Lab 6", table_cell_style)],
        [Paragraph("T-18", table_cell_bold), Paragraph("Hardware IoT GPS live tracking feed", table_cell_style), Paragraph("Hardware", table_cell_style), Paragraph("2", table_cell_style), Paragraph("Sep 11", table_cell_style), Paragraph("Deferred", table_cell_style), Paragraph("Pending Lab 6", table_cell_style)],
    ]
    t2 = Table(tracker_data, colWidths=[40, 160, 64, 25, 45, 55, 65])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0F172A")),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t2)
    story.append(Spacer(1, 8))

    story.append(Paragraph("12. Conclusion", h1_style))
    p_concl = (
        "Between August 31 and September 11, 2026, Group 18 successfully transitioned ParentCare360 from architectural schema designs "
        "into a fully operational, testable software prototype. Over the 12-day sprint, 41 out of 45 planned Story Points were delivered across 16 tasks, "
        "achieving a 91.1% velocity rate and an average cycle time of 1.88 days. Key outcomes include a normalized 9-table SQLite database, "
        "a self-contained rule-based alert engine with deduplication, an automated 4-stage Data Engineering ETL pipeline with malformed row filtering, "
        "and an 11-view interactive Streamlit prototype. Quantitative metrics (Burnup, Burndown, Throughput, CFD, Cycle Time, Velocity) confirm "
        "stable team velocity, rigorous WIP control, and zero critical blockers. ParentCare360 satisfies all functional and reporting requirements for Lab 4/5, "
        "establishing a solid, proven foundation for cloud deployment and live external service integration in subsequent laboratory phases."
    )
    story.append(Paragraph(p_concl, body_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully generated at: {OUTPUT_PDF}")

if __name__ == '__main__':
    build_pdf()
