type BrowserJsPdfModule = {
  jsPDF: typeof import("jspdf").jsPDF;
};

export async function loadBrowserJsPdf(): Promise<BrowserJsPdfModule> {
  return await import("jspdf/dist/jspdf.es.min.js");
}
