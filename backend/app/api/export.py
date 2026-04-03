import csv
import io
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer

from app.db.database import get_db
from app.models.task import Task
from app.models.project import Project

router = APIRouter()


@router.get("/tasks/csv")
def export_tasks_csv(project_id: int = Query(...), db: Session = Depends(get_db)):
    """Export tasks as CSV file."""
    project = db.query(Project).filter(Project.id == project_id).first()
    project_name = project.name if project else f"Project-{project_id}"

    tasks = (
        db.query(Task)
        .filter(Task.project_id == project_id)
        .order_by(Task.id.asc())
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow(["ID", "Title", "Description", "Status", "Priority", "Due Date", "Project"])

    # Rows
    for t in tasks:
        writer.writerow([
            t.id,
            t.title,
            t.description or "",
            t.status or "todo",
            t.priority or "medium",
            t.due_date or "",
            project_name,
        ])

    output.seek(0)
    safe_name = project_name.replace(" ", "_").replace("/", "-")
    filename = f"{safe_name}_tasks_{datetime.now().strftime('%Y%m%d')}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/tasks/pdf")
def export_tasks_pdf(project_id: int = Query(...), db: Session = Depends(get_db)):
    """Export tasks as PDF file."""
    project = db.query(Project).filter(Project.id == project_id).first()
    project_name = project.name if project else f"Project-{project_id}"

    tasks = (
        db.query(Task)
        .filter(Task.project_id == project_id)
        .order_by(Task.id.asc())
        .all()
    )

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Heading1"],
        fontSize=20,
        textColor=colors.HexColor("#34247A"),
        spaceAfter=6,
    )
    subtitle_style = ParagraphStyle(
        "CustomSubtitle",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#6B7280"),
        spaceAfter=20,
    )

    elements = []

    # Title
    elements.append(Paragraph(f"{project_name} — Task Report", title_style))
    elements.append(Paragraph(
        f"Generated on {datetime.now().strftime('%B %d, %Y at %H:%M')} · {len(tasks)} tasks total",
        subtitle_style,
    ))

    # Summary stats
    todo_count = sum(1 for t in tasks if (t.status or "todo") == "todo")
    doing_count = sum(1 for t in tasks if (t.status or "") == "doing")
    done_count = sum(1 for t in tasks if (t.status or "") == "done")

    summary_data = [
        ["Status", "Count"],
        ["Todo", str(todo_count)],
        ["In Progress", str(doing_count)],
        ["Completed", str(done_count)],
        ["Total", str(len(tasks))],
    ]

    summary_table = Table(summary_data, colWidths=[80 * mm, 40 * mm])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#34247A")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#F3F0FF")),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("ALIGN", (1, 0), (1, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, colors.HexColor("#FAFAFA")]),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 16))

    # Tasks table
    if tasks:
        task_header = ["#", "Title", "Status", "Priority", "Due Date"]
        task_data = [task_header]

        status_labels = {"todo": "Todo", "doing": "In Progress", "done": "Done"}
        priority_labels = {"low": "Low", "medium": "Medium", "high": "High"}

        for t in tasks:
            task_data.append([
                str(t.id),
                t.title[:40] + ("..." if len(t.title) > 40 else ""),
                status_labels.get(t.status or "todo", t.status or "todo"),
                priority_labels.get(t.priority or "medium", t.priority or "medium"),
                t.due_date or "—",
            ])

        col_widths = [12 * mm, 68 * mm, 28 * mm, 24 * mm, 28 * mm]
        task_table = Table(task_data, colWidths=col_widths, repeatRows=1)

        task_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#34247A")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 9),
            ("FONTSIZE", (0, 1), (-1, -1), 8),
            ("ALIGN", (0, 0), (0, -1), "CENTER"),
            ("ALIGN", (2, 0), (4, -1), "CENTER"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FAFAFA")]),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        elements.append(Paragraph("Task Details", ParagraphStyle(
            "SectionTitle",
            parent=styles["Heading2"],
            fontSize=14,
            textColor=colors.HexColor("#1F2937"),
            spaceBefore=4,
            spaceAfter=10,
        )))
        elements.append(task_table)
    else:
        elements.append(Paragraph("No tasks found for this project.", styles["Normal"]))

    # Footer
    elements.append(Spacer(1, 24))
    footer_style = ParagraphStyle(
        "Footer",
        parent=styles["Normal"],
        fontSize=8,
        textColor=colors.HexColor("#9CA3AF"),
        alignment=1,
    )
    elements.append(Paragraph("Plurals Project Manager · Confidential", footer_style))

    doc.build(elements)
    buffer.seek(0)

    safe_name = project_name.replace(" ", "_").replace("/", "-")
    filename = f"{safe_name}_report_{datetime.now().strftime('%Y%m%d')}.pdf"

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/analytics/csv")
def export_analytics_csv(project_id: int = Query(...), db: Session = Depends(get_db)):
    """Export analytics data as CSV."""
    project = db.query(Project).filter(Project.id == project_id).first()
    project_name = project.name if project else f"Project-{project_id}"

    tasks = db.query(Task).filter(Task.project_id == project_id).all()

    # All projects for hours comparison
    all_projects = db.query(Project).order_by(Project.id.asc()).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Project Summary
    writer.writerow(["Project Summary"])
    writer.writerow(["Project", "Total Tasks", "Todo", "In Progress", "Completed"])

    todo = sum(1 for t in tasks if (t.status or "todo") == "todo")
    doing = sum(1 for t in tasks if (t.status or "") == "doing")
    done = sum(1 for t in tasks if (t.status or "") == "done")
    writer.writerow([project_name, len(tasks), todo, doing, done])

    writer.writerow([])
    writer.writerow(["All Projects - Task Count"])
    writer.writerow(["Project", "Total Tasks"])
    for p in all_projects:
        count = db.query(Task).filter(Task.project_id == p.id).count()
        writer.writerow([p.name, count])

    output.seek(0)
    safe_name = project_name.replace(" ", "_").replace("/", "-")
    filename = f"{safe_name}_analytics_{datetime.now().strftime('%Y%m%d')}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )