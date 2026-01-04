export const el = (id)=>document.getElementById(id);

export function escapeHtml(s){
  return (s ?? "").toString()
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

export function uid(){ return "r_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16); }

export function toArabicDigits(str){
  const map = {'0':'٠','1':'١','2':'٢','3':'٣','4':'٤','5':'٥','6':'٦','7':'٧','8':'٨','9':'٩'};
  return (str ?? "").toString().replace(/[0-9]/g, d=>map[d]);
}

export function normalizeAcademicYear(input){
  const s = (input ?? "").toString().trim();
  if(!s) return "";
  let t = toArabicDigits(s).replace(/\s+/g," ");
  if(!t.includes("هـ")) t += "هـ";
  return t;
}

export function parseLooseNumber(v){
  const s = (v ?? "").toString().trim()
    .replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .replace(/[^\d.]/g,"");
  if(s === "" || s === ".") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function clampNumber(v, max){
  const n = parseLooseNumber(v);
  if(n === null) return "";
  const c = Math.max(0, Math.min(max, n));
  return String(c);
}

export function isMobileLike(){
  return window.matchMedia("(max-width: 820px)").matches;
}
