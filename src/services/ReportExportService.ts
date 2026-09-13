import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { IncidentReport } from '../types/disaster-system';

export class ReportExportService {
  /**
   * Generates a formal CDRRMD Situation Overview in PDF Format
   */
  public static exportSituationReportPDF(incidents: IncidentReport[], title = 'EOC SITUATION REPORT'): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Header Meta
    doc.setFontSize(16);
    doc.setTextColor(20, 30, 45);
    doc.text('CITY DISASTER RISK REDUCTION AND MANAGEMENT OFFICE', 14, 18);
    doc.setFontSize(10);
    doc.text('EMERGENCY OPERATIONS CENTER (EOC) - SITUATION BRIEFING', 14, 24);
    doc.setLineDashPattern([1], 0);
    doc.line(14, 28, 196, 28);

    // Dynamic Summary Row
    const totalFatalities = incidents.reduce((s, i) => s + (i.impact?.casualties?.dead || 0), 0);
    const totalInjured = incidents.reduce((s, i) => s + (i.impact?.casualties?.injured || 0), 0);

    doc.setFontSize(9);
    doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 34);
    doc.text(`Operational Status: ELEVATED RED ALERT`, 14, 39);
    doc.text(`Recorded Casualties: ${totalFatalities} Dead | ${totalInjured} Injured`, 14, 44);

    // Autotable Mapping
    const tableData = incidents.map((i) => [
      i.incidentNumber || 'N/A',
      i.subType || 'N/A',
      i.location?.barangay || 'N/A',
      i.severity || 'N/A',
      i.impact?.affectedFamilies || 0,
      `${i.impact?.casualties?.dead || 0}/${i.impact?.casualties?.injured || 0}`,
      i.status || 'N/A'
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['Incident #', 'Classification', 'Barangay', 'Severity', 'Families', 'Dead/Inj', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 8 }
    });

    doc.save(`CDRRMD_SITREP_${Date.now()}.pdf`);
  }

  /**
   * Generates an Excel Workbook with Incident Records & Field Inventories
   */
  public static exportDisasterMetricsXLSX(incidents: IncidentReport[]): void {
    const flatRecords = incidents.map((item) => ({
      Incident_Number: item.incidentNumber,
      Classification: item.category,
      Sub_Category: item.subType,
      Severity_Rating: item.severity,
      Barangay: item.location?.barangay,
      Latitude: item.location?.coordinates?.latitude,
      Longitude: item.location?.coordinates?.longitude,
      Affected_Families: item.impact?.affectedFamilies,
      Casualties_Dead: item.impact?.casualties?.dead,
      Casualties_Injured: item.impact?.casualties?.injured,
      Reported_Timestamp: item.reportedAt,
      Verification_Status: item.status,
      Encoder: item.encodedBy?.name
    }));

    const worksheet = XLSX.utils.json_to_sheet(flatRecords);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Operational Incidents');

    XLSX.writeFile(workbook, `CDRRMD_DISASTER_LOGS_${Date.now()}.xlsx`);
  }
}
