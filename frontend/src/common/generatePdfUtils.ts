import { jsPDF } from "jspdf";

export async function generateExamplePDFBlob(
  content: HTMLElement,
  contentWidth: number = 1150,
  margin: number[] = [16, 0, 16, 0],
  props?: {
    title: string;
    listName: string;
    subListName: string;
    company: string;
    companyAddress: string;
    date: string;
    orientation: "l" | "p";
    lang: string;
  }
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: props?.orientation || "p",
    unit: "mm",
    format: "a4"
  });

  doc.setFont("helvetica");

  // Add header with company details
  if (props) {
    doc.setFontSize(14);
    doc.text(props.company, margin[3] + 10, margin[0] + 10);
    doc.setFontSize(10);
    doc.text(props.companyAddress, margin[3] + 10, margin[0] + 20);
    doc.text(props.date, margin[3] + 10, margin[0] + 30);
  }

  // Add title and list information
  if (props?.title) {
    doc.setFontSize(16);
    doc.text(props.title, doc.internal.pageSize.width / 2, margin[0] + 40, { align: "center" });
    if (props.listName) {
      doc.setFontSize(12);
      doc.text(
        `${props.listName}${props.subListName ? ` - ${props.subListName}` : ""}`,
        doc.internal.pageSize.width / 2,
        margin[0] + 50,
        { align: "center" }
      );
    }
  }

  try {
    await doc.html(content, {
      margin: margin,
      autoPaging: true,
      x: margin[3],
      y: margin[0] + 60,
      width: doc.internal.pageSize.width - (margin[1] + margin[3])
    });
  } catch (error) {
    console.error("Error converting HTML to PDF:", error);
  }

  return doc.output("blob");
}

/**
 * Generate a PDF file from an HTML content.
 * @requires jspdf
 * @description Generates a PDF file from an HTML content.
 * @param {HTMLElement} content - The HTML content to convert to PDF.
 * @param {number} [contentWidth=1150] - The width of the content in pixels.
 * @returns {Promise<Blob>} - The generated PDF as a Blob.
 */
export async function generateHTMLToPDF(
  content: HTMLElement,
  contentWidth: number = 1150,
  margin: number[] = [16, 0, 16, 0],
  props?: {
    title: string;
    listName: string;
    subListName: string;
    company: string;
    companyAddress: string;
    date: string;
    orientation: "l" | "p";
    lang: string;
  }
): Promise<Blob> {
  try {
    const pdf = new jsPDF({
      orientation: props?.orientation ?? "p",
      format: "a4",
      unit: "px",
      compress: true
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const scale = pdfWidth / contentWidth;

    const addHeaderFooter = (pageNumber: number, totalPages: number) => {
      if (!props) return;

      const pageNumberText = `${pageNumber}/${totalPages}`;
      const totalDigits = totalPages.toString().length;
      const pageNumberOffset = (totalDigits - 1) * 6;

      const commonHeaderFooter = () => {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.text(props.company ?? "", margin[0] + companyX, margin[1] + (pageNumber === 1 ? 20 : 16));
        pdf.text(props.companyAddress ?? "", margin[0] + addressX, margin[1] + (pageNumber === 1 ? 30 : 26));

        pdf.setDrawColor(0, 0, 0);
        if (props.orientation === "l") {
          pdf.line(margin[0] + 15, pdfHeight - margin[2] + 10, pdfWidth - margin[0] - 20, pdfHeight - margin[2] + 10);
          pdf.text(pageNumberText, pdfWidth - margin[0] - 30 + pageNumberOffset, pdfHeight - margin[2] + 20);
          pdf.text(props.date ?? "", pdfWidth - margin[0] - 57, pdfHeight - margin[2] + 30);
        } else {
          pdf.line(margin[0] + 15, pdfHeight - margin[2] + 10, pdfWidth - margin[0] - 2, pdfHeight - margin[2] + 10);
          pdf.text(pageNumberText, pdfWidth - margin[0] - 12 + pageNumberOffset, pdfHeight - margin[2] + 20);
          pdf.text(props.date ?? "", pdfWidth - margin[0] - 39, pdfHeight - margin[2] + 30);
        }
      };

      let companyX = 342;
      let addressX = 356;

      switch (props.title) {
        case "listEmployeeEffort":
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "bold");
          pdf.text(props.listName ?? "", margin[0] + 1, margin[1] + (pageNumber === 1 ? 22 : 18));
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);
          pdf.text(props.company ?? "", margin[0] + companyX, margin[1] + (pageNumber === 1 ? 20 : 16));
          pdf.text(props.companyAddress ?? "", margin[0] + addressX, margin[1] + (pageNumber === 1 ? 27 : 33));
          pdf.setDrawColor(0, 0, 0);
          pdf.line(margin[0] + 2, pdfHeight - margin[2] + 10, pdfWidth - margin[0] - 1, pdfHeight - margin[2] + 10);
          pdf.text(pageNumberText, pdfWidth - margin[0] - 9 + pageNumberOffset, pdfHeight - margin[2] + 20);
          pdf.text(props.date ?? "", pdfWidth - margin[0] - 31, pdfHeight - margin[2] + 30);
          break;
        case "singleProject":
        case "singleProjectWithoutRate":
        case "singleProjectExternal":
        case "singleProjectExternalWithoutRate":
        case "projectPhase":
        case "projectTask":
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "bold");
          let listNameProject = "";
          if (props.lang === "de")
            listNameProject = props.listName.split("Teilleistungen und").join("Teilleistungen\nund");
          else listNameProject = props.listName.split("services and").join("services\nand");

          pdf.text(listNameProject ?? "", margin[0] + 11, margin[1] + (pageNumber === 1 ? 22 : 18));
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);
          pdf.text(props.company ?? "", margin[0] + companyX + 2, margin[1] + (pageNumber === 1 ? 22 : 18));
          pdf.text(props.companyAddress ?? "", margin[0] + addressX + 3, margin[1] + (pageNumber === 1 ? 29 : 27));
          pdf.setDrawColor(0, 0, 0);
          pdf.line(margin[0] + 11, pdfHeight - margin[2] + 10, pdfWidth - margin[0] + 13, pdfHeight - margin[2] + 10);
          pdf.text(pageNumberText, pdfWidth - margin[0] + (5 - pageNumberOffset), pdfHeight - margin[2] + 20);
          pdf.text(props.date ?? "", pdfWidth - margin[0] - 17, pdfHeight - margin[2] + 30);
          break;
        case "listEmployeeFlexible":
          pdf.setFontSize(12);
          pdf.setFont("helvetica", "bold");
          let listNameFlex = "";
          if (props.lang === "de") listNameFlex = props.listName.split("- und").join("-\nund");
          else listNameFlex = props.listName.split("time and").join("time\nand");
          pdf.text(listNameFlex ?? "", margin[0] - 19, margin[1] + (pageNumber === 1 ? 22 : 18));
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(11);
          pdf.setFont("helvetica", "bold");
          pdf.text(props.subListName ?? "", margin[0] - 19, margin[1] + (pageNumber === 1 ? 45 : 41));
          pdf.setFontSize(8);
          pdf.setFont("helvetica", "normal");
          pdf.text(props.company ?? "", margin[0] + companyX - 20, margin[1] + (pageNumber === 1 ? 20 : 16));
          pdf.text(props.companyAddress ?? "", margin[0] + addressX - 20, margin[1] + (pageNumber === 1 ? 27 : 33));
          pdf.setDrawColor(0, 0, 0);
          pdf.line(margin[0] - 16, pdfHeight - margin[2] + 10, pdfWidth - margin[0] + 16, pdfHeight - margin[2] + 10);
          pdf.text(pageNumberText, pdfWidth - margin[0] + 8 + pageNumberOffset, pdfHeight - margin[2] + 20);
          pdf.text(props.date ?? "", pdfWidth - margin[0] - 14, pdfHeight - margin[2] + 30);
          break;
        default:
          pdf.setFontSize(12);
          pdf.setFont("helvetica", "bold");
          pdf.text(props.listName ?? "", margin[0] + 16, margin[1] + (pageNumber === 1 ? 20 : 16));
          pdf.setFontSize(10);
          if (props.subListName) {
            pdf.setFont("helvetica", "normal");

            pdf.text(props.subListName ?? "", margin[0] + 16, margin[1] + (pageNumber === 1 ? 30 : 26));
          }
          companyX = props.orientation === "l" ? 500 : 330;
          addressX = props.orientation === "l" ? 518 : 348;
          commonHeaderFooter();
          break;
      }
    };

    return new Promise((resolve, reject) => {
      pdf.html(content, {
        callback: doc => {
          const totalPages = doc.internal.pages.length - 1;
          for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            addHeaderFooter(i, totalPages);
          }
          const blob = doc.output("blob");
          resolve(blob);
        },
        margin,
        windowWidth: contentWidth,
        width: contentWidth,
        html2canvas: {
          scale,
          windowWidth: contentWidth,
          windowHeight: pdfHeight / scale
        },
        autoPaging: "text"
      });
    });
  } catch {
    throw new Error("Unable to generate PDF.");
  }
}
