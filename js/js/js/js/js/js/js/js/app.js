import { el, uid, normalizeAcademicYear, clampNumber } from "./utils.js";
import { loadState, saveState, bumpLocalVisits } from "./storage.js";
import { cloudLoad, cloudSave, cloudVisit } from "./cloud.js";
import { doPrint, exportPDF } from "./pdf.js";
import { renderInto } from "./render.js";
import { YEARWORK_SCHEMA } from "./config.js";

function getUserKey(){
  const params = new URLSearchParams(location.search);
  return (params.get("user") || "default").trim() || "default";
}

let USER_KEY = getUserKey();
let STORAGE_KEY = `irs_records_mod_${USER_KEY}`;

const state = {
  version: 1,
  userKey: USER_KEY,
  records: [],
  activeId: null
};

function defaultStudent(name=""){
  return { id: uid(), name, yearwork:{p1A:"",p1B:"",p2A:"",p2B:"",final:""}, monthly:Array.from({length:12},()=>0) };
}
function defaultRecord(){
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return {
    id: uid(),
    title: "سجل جديد",
    formType: "yearwork",
    subject: "",
    school: "",
    classroom: "",
    date: `${yyyy}-${mm}-${dd}`,
    termAr: "الأول",
    academicYearAr: "١٤٤٧هـ",
    signatures:{ teacherName:"", principalName:"" },
    students: [],
    plans:{ entries: [] }
  };
}
function getActiveRecord(){
  if(!state.activeId && state.records.length) state.activeId = state.records[0].id;
  return state.records.find(r=>r.id===state.activeId) || null;
}
function touch(rec){ rec.updatedAt = new Date().toISOString(); }

function setCloudPill(text, ok=null){
  const pill = el("cloudPill");
  const cls = ok===true ? "dot ok" : ok===false ? "dot bad" : "dot neu";
  pill.innerHTML = `<span class="${cls}"></span> سحابي: ${text}`;
}

function syncRecordSelect(){
  const sel = el("recordSelect");
  sel.innerHTML = "";
  state.records.forEach(r=>{
    const o = document.createElement("option");
    o.value = r.id;
    o.textContent = r.title || "سجل";
    if(r.id === state.activeId) o.selected = true;
    sel.appendChild(o);
  });
}

function syncFormUI(rec){
  el("formType").value = rec.formType;
  el("subject").value = rec.subject || "";
  el("school").value = rec.school || "";
  el("classroom").value = rec.classroom || "";
  el("date").value = rec.date || "";
  el("termAr").value = rec.termAr || "الأول";
  el("academicYearAr").value = rec.academicYearAr || "";
  el("recordTitle").value = rec.title || "";
  el("teacherName").value = rec.signatures.teacherName || "";
  el("principalName").value = rec.signatures.principalName || "";
  el("namesCountHint").textContent = `عدد الطالبات: ${(rec.students||[]).length}`;
}

function saveLocal(){ saveState(STORAGE_KEY, state); }
let cloudTimer=null;
function saveAll(){
  saveLocal();
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(async ()=>{
    try{
      const res = await cloudSave(USER_KEY, state);
      setCloudPill(res.ok ? "تم الحفظ ✓" : "رفض/توكن", !!res.ok);
    }catch{
      setCloudPill("غير متصل (محليًا)", false);
    }
  }, 900);
}

function render(){
  const rec = getActiveRecord();
  renderInto(el("printArea"), rec, wirePrintAreaHandlers);
}

function wirePrintAreaHandlers(rec){
  // signatures
  document.querySelectorAll("#printArea [data-sig]").forEach(inp=>{
    inp.addEventListener("input", ()=>{
      rec.signatures[inp.dataset.sig] = inp.value;
      touch(rec); saveAll(); syncFormUI(rec);
    });
  });

  // student name
  document.querySelectorAll("#printArea [data-st='name']").forEach(inp=>{
    inp.addEventListener("input", ()=>{
      const idx = +inp.dataset.idx;
      rec.students[idx].name = inp.value;
      touch(rec); saveAll(); syncFormUI(rec);
    });
  });

  // yearwork inputs
  document.querySelectorAll("#printArea [data-yw]").forEach(inp=>{
    const idx = +inp.dataset.idx;
    const key = inp.dataset.yw;
    const max = YEARWORK_SCHEMA[key];

    inp.addEventListener("input", ()=>{
      rec.students[idx].yearwork[key] = inp.value; // كتابة تفاعلية كاملة
      touch(rec); saveAll();
    });
    inp.addEventListener("blur", ()=>{
      const cleaned = clampNumber(inp.value, max);
      rec.students[idx].yearwork[key] = cleaned;
      inp.value = cleaned;
      touch(rec); saveAll(); render();
    });
  });

  // monthly toggles
  document.querySelectorAll("#printArea [data-mo]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const i = +btn.dataset.idx, m = +btn.dataset.mo;
      const cur = rec.students[i].monthly[m] ?? 0;
      rec.students[i].monthly[m] = cur===0 ? 1 : (cur===1 ? -1 : 0);
      touch(rec); saveAll(); render();
    });
  });

  // plans inputs
  document.querySelectorAll("#printArea [data-plan]").forEach(inp=>{
    const idx = +inp.dataset.idx;
    const key = inp.dataset.plan;
    inp.addEventListener("change", ()=>{
      rec.plans.entries[idx][key] = inp.value;
      touch(rec); saveAll(); render();
    });
    inp.addEventListener("input", ()=>{
      rec.plans.entries[idx][key] = inp.value;
      touch(rec); saveAll();
    });
  });
}

function attachEvents(){
  el("userPill").textContent = `مستخدم: ${USER_KEY}`;
  const localV = bumpLocalVisits(`irs_visits_${USER_KEY}`);
  el("visitPill").textContent = `زيارات الجهاز: ${localV}`;

  el("btnPrint").addEventListener("click", doPrint);
  el("btnPDF").addEventListener("click", ()=>{
    const rec = getActiveRecord();
    const name = (rec?.title || "سجل").replace(/[\\/:*?"<>|]/g,"-") + ".pdf";
    exportPDF(name);
  });

  el("btnCloudReload").addEventListener("click", async ()=>{
    await loadFromCloud();
  });

  el("recordSelect").addEventListener("change", (e)=>{
    state.activeId = e.target.value;
    saveLocal();
    const rec = getActiveRecord();
    syncFormUI(rec);
    render();
  });

  el("btnNewRecord").addEventListener("click", ()=>{
    const r = defaultRecord();
    state.records.push(r);
    state.activeId = r.id;
    saveAll();
    syncRecordSelect();
    syncFormUI(r);
    render();
  });

  el("btnDuplicateRecord").addEventListener("click", ()=>{
    const rec = getActiveRecord();
    if(!rec) return;
    const clone = JSON.parse(JSON.stringify(rec));
    clone.id = uid();
    clone.title = (rec.title || "سجل") + " (نسخة)";
    state.records.push(clone);
    state.activeId = clone.id;
    saveAll();
    syncRecordSelect();
    syncFormUI(clone);
    render();
  });

  el("btnDeleteRecord").addEventListener("click", ()=>{
    const rec = getActiveRecord();
    if(!rec) return;
    if(!confirm("تأكيد حذف السجل؟")) return;
    state.records = state.records.filter(x=>x.id!==rec.id);
    state.activeId = state.records[0]?.id || null;
    saveAll();
    syncRecordSelect();
    syncFormUI(getActiveRecord() || defaultRecord());
    render();
  });

  el("btnFocusTitle").addEventListener("click", ()=>{
    el("recordTitle").focus();
    el("recordTitle").select();
  });

  const bind = (id, cb)=>{
    el(id).addEventListener("input", cb);
    el(id).addEventListener("change", cb);
  };

  bind("formType", ()=>{
    const rec = getActiveRecord();
    rec.formType = el("formType").value;
    touch(rec); saveAll(); syncFormUI(rec); render();
  });
  bind("subject", ()=>{
    const rec = getActiveRecord();
    rec.subject = el("subject").value;
    touch(rec); saveAll(); syncFormUI(rec); render();
  });
  bind("school", ()=>{
    const rec = getActiveRecord();
    rec.school = el("school").value;
    touch(rec); saveAll(); syncFormUI(rec); render();
  });
  bind("classroom", ()=>{
    const rec = getActiveRecord();
    rec.classroom = el("classroom").value;
    touch(rec); saveAll(); syncFormUI(rec); render();
  });
  bind("date", ()=>{
    const rec = getActiveRecord();
    rec.date = el("date").value;
    touch(rec); saveAll(); syncFormUI(rec); render();
  });
  bind("termAr", ()=>{
    const rec = getActiveRecord();
    rec.termAr = el("termAr").value;
    touch(rec); saveAll(); syncFormUI(rec); render();
  });
  el("academicYearAr").addEventListener("blur", ()=>{
    const rec = getActiveRecord();
    rec.academicYearAr = normalizeAcademicYear(el("academicYearAr").value);
    el("academicYearAr").value = rec.academicYearAr;
    touch(rec); saveAll(); syncFormUI(rec); render();
  });
  bind("recordTitle", ()=>{
    const rec = getActiveRecord();
    rec.title = el("recordTitle").value;
    touch(rec); saveAll(); syncRecordSelect();
  });
  bind("teacherName", ()=>{
    const rec = getActiveRecord();
    rec.signatures.teacherName = el("teacherName").value;
    touch(rec); saveAll();
  });
  bind("principalName", ()=>{
    const rec = getActiveRecord();
    rec.signatures.principalName = el("principalName").value;
    touch(rec); saveAll();
  });

  el("btnApplyNames").addEventListener("click", ()=>{
    const rec = getActiveRecord();
    const names = el("namesPaste").value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    rec.students = names.map(n=>defaultStudent(n));
    touch(rec); saveAll(); syncFormUI(rec); render();
  });

  el("btnAddRow").addEventListener("click", ()=>{
    const rec = getActiveRecord();
    rec.students.push(defaultStudent(""));
    touch(rec); saveAll(); syncFormUI(rec); render();
  });
}

async function loadFromCloud(){
  setCloudPill("جاري الاتصال…", null);
  try{
    const data = await cloudLoad(USER_KEY);
    if(data.ok && data.found && data.state){
      Object.assign(state, data.state);
      setCloudPill("تم التحميل ✓", true);
      saveLocal();
    } else {
      setCloudPill("لا توجد بيانات بالسحابة بعد", true);
    }
  }catch{
    setCloudPill("غير متصل (محليًا)", false);
  }

  try{
    const v = await cloudVisit(USER_KEY);
    el("globalPill").textContent = `زيارات عالمية: ${v.globalVisits ?? "—"}`;
  }catch{
    el("globalPill").textContent = "زيارات عالمية: —";
  }

  if(!state.records?.length){
    state.records = [defaultRecord()];
    state.activeId = state.records[0].id;
  }
  syncRecordSelect();
  syncFormUI(getActiveRecord());
  render();
}

(function init(){
  const local = loadState(STORAGE_KEY);
  if(local?.records) Object.assign(state, local);

  if(!state.records.length){
    state.records = [defaultRecord()];
    state.activeId = state.records[0].id;
  }
  if(!state.activeId) state.activeId = state.records[0].id;

  attachEvents();
  syncRecordSelect();
  syncFormUI(getActiveRecord());
  render();
  loadFromCloud();
})();
