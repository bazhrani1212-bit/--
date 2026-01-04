import { el, isMobileLike } from "./utils.js";

export function setPrintMode(){
  const mobile = isMobileLike();
  document.documentElement.style.setProperty("--printScale", "1");
  // لو تبين تغيير الاتجاه داخل PDF/Print حسب الجهاز نعالجه داخل exportPDF
}

export function doPrint(){
  setPrintMode();
  window.print();
}

export async function exportPDF(filename="سجل.pdf"){
  const btn = el("btnPDF");
  btn.disabled = true;
  btn.textContent = "جاري تجهيز PDF…";
  try{
    setPrintMode();
    const area = el("printArea");
    const scale = isMobileLike() ? 2.2 : 2;

    const canvas = await html2canvas(area, {
      scale,
      useCORS: true,
      backgroundColor:"#ffffff",
      windowWidth: area.scrollWidth,
      windowHeight: area.scrollHeight
    });

    const imgData = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;
    const portrait = isMobileLike();
    const pdf = new jsPDF({ orientation: portrait ? "portrait" : "landscape", unit:"mm", format:"a4" });

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

    let y = 0;
    let remaining = imgH;

    while(remaining > 0){
      pdf.addImage(imgData, "PNG", 0, y, imgW, imgH);
      remaining -= pageH;
      if(remaining > 0){
        pdf.addPage();
        y -= pageH;
      }
    }

    const blob = pdf.output("blob");
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 8000);
  } finally {
    btn.disabled = false;
    btn.textContent = "حفظ/تصدير PDF";
  }
}
