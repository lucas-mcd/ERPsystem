import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Workbook } from 'xlsx'
import * as XLSX from 'xlsx'

// Types
export interface ReportOptions {
  title: string
  columnKeys: string[]
  columnLabels: string[]
  data: Record<string, any>[]
  filename: string
}

export interface PdfReportOptions extends ReportOptions {
  orientation?: 'portrait' | 'landscape'
  pageSize?: 'a4' | 'letter'
}

// PDF Report Generator - Using jspdf-autotable for better table rendering
export function generatePdfReport(options: PdfReportOptions) {
  const {
    title,
    columnKeys,
    columnLabels,
    data,
    filename,
    orientation = 'landscape',
    pageSize = 'a4',
  } = options

  console.log('Generating PDF with data:', { title, columnLabels, dataLength: data.length, data })

  const pdf = new jsPDF({
    orientation: orientation as any,
    unit: 'mm',
    format: pageSize,
  })

  // Header
  const margin = 10
  
  // Title
  pdf.setFontSize(16)
  pdf.text(title, margin, margin + 5)

  // Date
  pdf.setFontSize(10)
  pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margin, margin + 12)

  // Prepare table data - USE columnKeys to access data, columnLabels for display
  const tableData = data.map((row) =>
    columnKeys.map((key) => {
      const value = row[key]
      if (value === undefined || value === null) return '-'
      if (typeof value === 'number') {
        return value.toFixed(2)
      }
      return String(value)
    })
  )

  console.log('Table data prepared:', { rowCount: tableData.length, firstRow: tableData[0] })

  // Generate table using jspdf-autotable
  autoTable(pdf, {
    head: [columnLabels],
    body: tableData,
    startY: margin + 20,
    margin: margin,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: 'linebreak',
      halign: 'left',
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      textColor: [0, 0, 0],
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  })

  // Download
  pdf.save(`${filename}-${Date.now()}.pdf`)
}

// Excel Report Generator
export function generateExcelReport(options: ReportOptions) {
  const { title, columnKeys, columnLabels, data, filename } = options

  const ws = XLSX.utils.json_to_sheet(
    data.map((row) =>
      columnLabels.reduce((obj, label, i) => ({ ...obj, [label]: row[columnKeys[i]] }), {})
    )
  )

  // Column widths
  const colWidths = columnLabels.map((label, i) =>
    Math.max(
      label.length,
      Math.max(...data.map((row) => String(row[columnKeys[i]] || '').length))
    ) + 2
  )
  ws['!cols'] = colWidths.map((width) => ({ wch: width }))

  // Headers - bold
  const headerRow = columnLabels.reduce(
    (obj, label, i) => {
      const cellAddress = XLSX.utils.encode_col(i) + '1'
      ws[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'FF3B82F6' } },
        alignment: { horizontal: 'center' },
      }
      return obj
    },
    {}
  )

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, title)

  XLSX.writeFile(wb, `${filename}-${Date.now()}.xlsx`)
}

// CSV Report Generator
export function generateCsvReport(options: ReportOptions) {
  const { title, columnKeys, columnLabels, data, filename } = options

  // Header
  const csv = [title, '']
  csv.push(columnLabels.join(','))

  // Data
  data.forEach((row) => {
    const values = columnKeys.map((key) => {
      const value = row[key] || ''
      // Escape quotes and wrap in quotes if contains comma
      return String(value).includes(',')
        ? `"${String(value).replace(/"/g, '""')}"`
        : value
    })
    csv.push(values.join(','))
  })

  const csvContent = csv.join('\n')

  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}-${Date.now()}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
