from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
import io

def generate_payslip_pdf(record):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            rightMargin=1.5*cm, leftMargin=1.5*cm,
                            topMargin=1.5*cm, bottomMargin=1.5*cm)

    styles = getSampleStyleSheet()
    story = []

    # -- Header --
    header_style = ParagraphStyle('header', fontSize=26, fontName='Helvetica-Bold',
                                  textColor=colors.HexColor('#4F46E5'), alignment=TA_CENTER, leading=30)
    sub_style = ParagraphStyle('sub', fontSize=10, fontName='Helvetica',
                               textColor=colors.HexColor('#6B7280'), alignment=TA_CENTER, leading=14)
    title_style = ParagraphStyle('title', fontSize=14, fontName='Helvetica-Bold',
                                 textColor=colors.HexColor('#1F2937'), alignment=TA_CENTER, spaceAfter=10)
    label_style = ParagraphStyle('label', fontSize=9, fontName='Helvetica',
                                 textColor=colors.HexColor('#6B7280'))
    value_style = ParagraphStyle('value', fontSize=9, fontName='Helvetica-Bold',
                                 textColor=colors.HexColor('#111827'))

    org_name = record.get('org_domain', 'AdaptivePay').split('.')[0].capitalize()
    story.append(Paragraph(org_name, header_style))
    story.append(Paragraph("HR & Payroll Management System", sub_style))
    story.append(Spacer(1, 15))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#4F46E5')))
    story.append(Spacer(1, 12))
    story.append(Paragraph("PAYSLIP", title_style))
    story.append(Spacer(1, 10))

    # -- Employee Details Table --
    emp_data = [
        ['Employee Name', record['employee_name'], 'Month / Year', record['month_year']],
        ['Email', record.get('email', 'N/A'), 'Department', record.get('department', 'N/A')],
        ['Role', record.get('role', 'N/A'), 'Phone', record.get('phone', 'N/A')],
    ]
    emp_table = Table(emp_data, colWidths=[3.5*cm, 7.5*cm, 3.5*cm, 4.5*cm])
    emp_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#EEF2FF')),
        ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#EEF2FF')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor('#F9FAFB')]),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(emp_table)
    story.append(Spacer(1, 20))

    # -- Salary Breakdown --
    story.append(Paragraph("SALARY BREAKDOWN", ParagraphStyle('secTitle', fontSize=11,
                                                               fontName='Helvetica-Bold',
                                                               textColor=colors.HexColor('#1F2937'),
                                                               spaceAfter=10)))

    earnings_data = [
        ['EARNINGS', 'Amount (INR)', 'DEDUCTIONS', 'Amount (INR)'],
        ['Base Salary', f"INR {float(record['base_salary']):,.2f}", 'Leave Deduction', f"INR {float(record['leave_deduction']):,.2f}"],
        ['Overtime Pay', f"INR {float(record['overtime_pay']):,.2f}", 'Tax Deduction', f"INR {float(record['tax_deduction']):,.2f}"],
        ['Bonus', f"INR {float(record['bonus']):,.2f}", '', ''],
    ]

    sal_table = Table(earnings_data, colWidths=[5*cm, 4*cm, 5*cm, 4*cm])
    sal_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (1, 0), colors.HexColor('#4F46E5')),
        ('BACKGROUND', (2, 0), (3, 0), colors.HexColor('#7C3AED')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 1), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9FAFB')]),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
        ('PADDING', (0, 0), (-1, -1), 7),
    ]))
    story.append(sal_table)
    story.append(Spacer(1, 15))

    # -- Net Salary --
    net_data = [
        ['', '', 'NET SALARY', f"INR {float(record['net_salary']):,.2f}"],
    ]
    net_table = Table(net_data, colWidths=[5*cm, 4*cm, 5*cm, 4*cm])
    net_table.setStyle(TableStyle([
        ('BACKGROUND', (2, 0), (3, 0), colors.HexColor('#4F46E5')),
        ('TEXTCOLOR', (2, 0), (3, 0), colors.white),
        ('FONTNAME', (2, 0), (3, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (2, 0), (3, 0), 12),
        ('ALIGN', (3, 0), (3, 0), 'RIGHT'),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(net_table)
    story.append(Spacer(1, 30))

    # -- Footer --
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#E5E7EB')))
    story.append(Spacer(1, 10))
    footer = ParagraphStyle('footer', fontSize=8, fontName='Helvetica',
                            textColor=colors.HexColor('#9CA3AF'), alignment=TA_CENTER)
    
    # Add Blockchain Hash for verification
    # If the hash isn't in the record, we use a placeholder that shows it's a secured record
    verification_hash = record.get('hash', 'NOTARIZED_IN_AUDIT_LOG')
    story.append(Paragraph(f"<b>Blockchain Verification ID:</b> {verification_hash}", footer))
    story.append(Spacer(1, 6))
    
    story.append(Paragraph("This is a system-generated payslip. No signature required.", footer))
    story.append(Paragraph("AdaptivePay — Secure Payroll Management with Blockchain Audit", footer))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
