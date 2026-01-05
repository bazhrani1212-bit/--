import { escapeHtml, clampNumber } from "./utils.js";
import { YEARWORK_SCHEMA, MONTHS_AR, LEVEL_WORDS, ACTION_TYPES } from "./config.js";
import { getSkills } from "./skills.js";

export function getFormTitle(rec){
  switch(rec.formType){
    case "yearwork": return `سجل أعمال السنة لعام ${rec.academicYearAr || "…"}`;
    case "monthly": return "كشف متابعة شهري";
    case "plans": return "متابعة الخطط العلاجية والإثرائية";
    case "counselor": return "نموذج تحويل للموجهة الطلابية";
    case "principal": return "نموذج تحويل للمديرة";
    case "parent": return "تبليغ لولي الأمر";
    default: return "استمارة";
  }
}

export function renderInto(printArea, rec, wireHandlers){
  printArea.innerHTML = "";
  if(!rec){
    printArea.innerHTML = `<div style="padding:16px;color:#6b7280;font-weight:900">لا يوجد سجلات بعد.</div>`;
    return;
  }

  printArea.innerHTML = `
    <div style="padding:14px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
      <div>
        <div style="font-weight:900;font-size:16px">${escapeHtml(getFormTitle(rec))}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px">
          العام الدراسي: <b>${escapeHtml(rec.academicYearAr||"—")}</b> — الفصل: <b>${escapeHtml(rec.termAr||"—")}</b>
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:flex-end">
        <div class="pill">المدرسة: ${escapeHtml(rec.school||"—")}</div>
        <div class="pill">الصف/الشعبة: ${escapeHtml(rec.classroom||"—")}</div>
        <div class="pill">التاريخ: ${escapeHtml(rec.date||"—")}</div>
      </div>
    </div>
  `;

  if(rec.formType === "yearwork"){
    printArea.appendChild(renderYearwork(rec));
  } else if(rec.formType === "monthly"){
    printArea.appendChild(renderMonthly(rec));
  } else if(rec.formType === "plans"){
    printArea.appendChild(renderPlans(rec));
  } else {
    const box = document.createElement("div");
    box.style.padding="14px";
    box.innerHTML = `<div style="color:#6b7280;font-weight:900">هذا النوع جاهز للتمديد لاحقًا.</div>`;
    printArea.appendChild(box);
  }

  printArea.appendChild(renderSignatures(rec));
  wireHandlers?.(rec);
}

function renderSignatures(rec){
  const wrap = document.createElement("div");
  wrap.style.padding="12px 14px 16px";
  wrap.innerHTML = `
    <div style="border-top:1px solid #e5e7eb;padding-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div style="border:1px solid #e5e7eb;border-radius:12px;padding:10px;background:#fafafa">
        <b>المعلمة:</b>
        <input class="sig-line" data-sig="teacherName" value="${escapeHtml(rec.signatures?.teacherName||"")}" placeholder="اسم المعلمة">
      </div>
      <div style="border:1px solid #e5e7eb;border-radius:12px;padding:10px;background:#fafafa">
        <b>قائدة المدرسة:</b>
        <input class="sig-line" data-sig="principalName" value="${escapeHtml(rec.signatures?.principalName||"")}" placeholder="اسم المديرة">
      </div>
    </div>
  `;
  wrap.querySelectorAll(".sig-line").forEach(i=>{
    i.style.width="100%";
    i.style.border="none";
    i.style.borderBottom="2px dotted #111";
    i.style.background="transparent";
    i.style.padding="8px";
    i.style.fontWeight="900";
    i.style.fontFamily="inherit";
  });
  return wrap;
}

/* ===== أعمال السنة ===== */
function totals(st){
  const p1A = +((st.yearwork.p1A||"0").replace(/[^\d.]/g,"")) || 0;
  const p1B = +((st.yearwork.p1B||"0").replace(/[^\d.]/g,"")) || 0;
  const p2A = +((st.yearwork.p2A||"0").replace(/[^\d.]/g,"")) || 0;
  const p2B = +((st.yearwork.p2B||"0").replace(/[^\d.]/g,"")) || 0;
  const fin = +((st.yearwork.final||"0").replace(/[^\d.]/g,"")) || 0;
  const sum = p1A+p1B+p2A+p2B;
  return {sum, avg: sum/2, total: sum+fin};
}
function renderYearwork(rec){
  const wrap = document.createElement("div");
  wrap.style.padding="12px";
  const box = document.createElement("div");
  box.className = "wrapX";
  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        <th class="total" style="width:40px">م</th>
        <th class="total" style="width:240px">اسم الطالبة</th>
        <th class="p1">المشاركة (${YEARWORK_SCHEMA.p1A})</th>
        <th class="p1">الواجبات (${YEARWORK_SCHEMA.p1B})</th>
        <th class="p2">المهام (${YEARWORK_SCHEMA.p2A})</th>
        <th class="p2">أنشطة (${YEARWORK_SCHEMA.p2B})</th>
        <th class="sum">المجموع</th>
        <th class="avg">المتوسط</th>
        <th class="final">النهائي (${YEARWORK_SCHEMA.final})</th>
        <th class="total">الكلي</th>
      </tr>
    </thead>
    <tbody>
      ${(rec.students||[]).map((st,i)=>{
        const t = totals(st);
        return `
          <tr>
            <td class="total">${i+1}</td>
            <td class="namecell"><input class="inline-input name" data-st="name" data-idx="${i}" value="${escapeHtml(st.name||"")}"></td>
            <td class="p1"><input class="inline-input num" data-yw="p1A" data-idx="${i}" value="${escapeHtml(st.yearwork.p1A||"")}"></td>
            <td class="p1"><input class="inline-input num" data-yw="p1B" data-idx="${i}" value="${escapeHtml(st.yearwork.p1B||"")}"></td>
            <td class="p2"><input class="inline-input num" data-yw="p2A" data-idx="${i}" value="${escapeHtml(st.yearwork.p2A||"")}"></td>
            <td class="p2"><input class="inline-input num" data-yw="p2B" data-idx="${i}" value="${escapeHtml(st.yearwork.p2B||"")}"></td>
            <td class="sum"><b>${t.sum.toFixed(0)}</b></td>
            <td class="avg"><b>${t.avg.toFixed(1)}</b></td>
            <td class="final"><input class="inline-input num" data-yw="final" data-idx="${i}" value="${escapeHtml(st.yearwork.final||"")}"></td>
            <td class="total"><b>${t.total.toFixed(0)}</b></td>
          </tr>
        `;
      }).join("")}
    </tbody>
  `;
  box.appendChild(table);
  wrap.appendChild(box);
  return wrap;
}

/* ===== متابعة شهري ===== */
function renderMonthly(rec){
  (rec.students||[]).forEach(st=>{
    if(!Array.isArray(st.monthly) || st.monthly.length!==12) st.monthly = Array.from({length:12},()=>0);
  });
  const wrap = document.createElement("div");
  wrap.style.padding="12px";
  const box = document.createElement("div");
  box.className="wrapX";
  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        <th class="total" style="width:40px">م</th>
        <th class="total" style="width:240px">اسم الطالبة</th>
        ${MONTHS_AR.map(m=>`<th class="total">${m}</th>`).join("")}
      </tr>
    </thead>
    <tbody>
      ${(rec.students||[]).map((st,i)=>{
        return `
          <tr>
            <td class="total">${i+1}</td>
            <td class="namecell"><input class="inline-input name" data-st="name" data-idx="${i}" value="${escapeHtml(st.name||"")}"></td>
            ${st.monthly.map((v,m)=>{
              const cls = v===1 ? "mark-btn ok" : (v===-1 ? "mark-btn bad" : "mark-btn neu");
              const txt = v===1 ? "✓" : (v===-1 ? "✗" : "");
              return `<td><button class="${cls}" data-mo="${m}" data-idx="${i}">${txt}</button></td>`;
            }).join("")}
          </tr>
        `;
      }).join("")}
    </tbody>
  `;
  box.appendChild(table);
  wrap.appendChild(box);
  return wrap;
}

/* ===== خطط علاجية/إثرائية ===== */
function studentOptions(rec, current){
  const list = (rec.students||[]).map(s=>(s.name||"").trim()).filter(Boolean);
  const uniq = Array.from(new Set(list));
  const opts = [`<option value="">— اختر الطالبة —</option>`]
    .concat(uniq.map(n=>`<option value="${escapeHtml(n)}" ${current===n?"selected":""}>${escapeHtml(n)}</option>`));
  if(current && !uniq.includes(current)) opts.push(`<option value="${escapeHtml(current)}" selected>${escapeHtml(current)}</option>`);
  return opts.join("");
}

function renderPlans(rec){
  rec.plans ||= { entries: [] };

  const wrap = document.createElement("div");
  wrap.style.padding="12px";

  const box = document.createElement("div");
  box.className="wrapX";
  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        <th class="total" style="width:40px">م</th>
        <th class="total" style="width:110px">التاريخ</th>
        <th class="total" style="width:220px">اسم الطالبة</th>
        <th class="total" style="width:90px">الصف</th>
        <th class="total" style="width:120px">المادة</th>
        <th class="total" style="width:90px">نوع</th>
        <th class="total" style="width:260px">المهارة</th>
        <th class="total" style="width:120px">قبلي</th>
        <th class="total" style="width:120px">بعدي</th>
        <th class="total" style="width:160px">إجراء</th>
        <th class="total" style="width:220px">ملاحظات</th>
      </tr>
    </thead>
    <tbody>
      ${(rec.plans.entries||[]).map((r,i)=>`
        <tr>
          <td class="total">${i+1}</td>
          <td><input class="inline-input" type="date" data-plan="date" data-idx="${i}" value="${escapeHtml(r.date||"")}"></td>
          <td>
            <select class="inline-input" data-plan="studentName" data-idx="${i}">
              ${studentOptions(rec, r.studentName)}
            </select>
          </td>
          <td>
            <select class="inline-input" data-plan="grade" data-idx="${i}">
              ${["الأول","الثاني","الثالث","الرابع","الخامس","السادس"].map(g=>`<option value="${g}" ${r.grade===g?"selected":""}>${g}</option>`).join("")}
            </select>
          </td>
          <td>
            <select class="inline-input" data-plan="subject" data-idx="${i}">
              ${["علوم","رياضيات","لغتي","انجليزي","دراسات","مهارات رقمية","أخرى"].map(s=>`<option value="${s}" ${r.subject===s?"selected":""}>${s}</option>`).join("")}
            </select>
          </td>
          <td>
            <select class="inline-input" data-plan="type" data-idx="${i}">
              <option value="علاجية" ${r.type==="علاجية"?"selected":""}>علاجية</option>
              <option value="إثرائية" ${r.type==="إثرائية"?"selected":""}>إثرائية</option>
            </select>
          </td>
          <td>
            <select class="inline-input" data-plan="skill" data-idx="${i}">
              <option value="${escapeHtml(r.skill||"")}">${escapeHtml(r.skill||"— جاري تحميل المهارات —")}</option>
            </select>
          </td>
          <td>
            <select class="inline-input" data-plan="pre" data-idx="${i}">
              ${LEVEL_WORDS.map(x=>`<option value="${x}" ${r.pre===x?"selected":""}>${x}</option>`).join("")}
            </select>
          </td>
          <td>
            <select class="inline-input" data-plan="post" data-idx="${i}">
              ${LEVEL_WORDS.map(x=>`<option value="${x}" ${r.post===x?"selected":""}>${x}</option>`).join("")}
            </select>
          </td>
          <td>
            <select class="inline-input" data-plan="action" data-idx="${i}">
              ${ACTION_TYPES.map(x=>`<option value="${x}" ${r.action===x?"selected":""}>${x}</option>`).join("")}
            </select>
          </td>
          <td><input class="inline-input" data-plan="notes" data-idx="${i}" value="${escapeHtml(r.notes||"")}"></td>
        </tr>
      `).join("")}
    </tbody>
  `;
  box.appendChild(table);
  wrap.appendChild(box);

  // تحميل المهارات حسب الصف/المادة
  setTimeout(async ()=>{
    const selects = wrap.querySelectorAll("select[data-plan='skill']");
    for(const sel of selects){
      const idx = +sel.dataset.idx;
      const row = rec.plans.entries[idx];
      const grade = row.grade || "السادس";
      const subject = row.subject || "علوم";
      const skills = await getSkills(grade, subject);
      const current = row.skill || "";
      const opts = [`<option value="">— اختر المهارة —</option>`]
        .concat(skills.map(s=>`<option value="${escapeHtml(s)}" ${s===current?"selected":""}>${escapeHtml(s)}</option>`));
      if(current && !skills.includes(current)) opts.push(`<option value="${escapeHtml(current)}" selected>${escapeHtml(current)}</option>`);
      sel.innerHTML = opts.join("");
    }
  }, 0);

  return wrap;
}
