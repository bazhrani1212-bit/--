import { SCRIPT_URL, APP_TOKEN } from "./config.js";

async function fetchWithTimeout(url, opts={}, timeoutMs=15000){
  const ctrl = new AbortController();
  const t = setTimeout(()=>ctrl.abort(), timeoutMs);
  try{ return await fetch(url, {...opts, signal: ctrl.signal}); }
  finally{ clearTimeout(t); }
}

export async function cloudLoad(userKey){
  const url = new URL(SCRIPT_URL);
  url.searchParams.set("action","load");
  url.searchParams.set("userKey", userKey);
  url.searchParams.set("token", APP_TOKEN);
  const res = await fetchWithTimeout(url.toString(), {method:"GET"});
  return await res.json();
}

export async function cloudSave(userKey, state){
  const payload = { action:"save", token: APP_TOKEN, userKey, state };
  const res = await fetchWithTimeout(SCRIPT_URL, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify(payload)
  });
  return await res.json();
}

export async function cloudVisit(userKey){
  const url = new URL(SCRIPT_URL);
  url.searchParams.set("action","visit");
  url.searchParams.set("userKey", userKey);
  url.searchParams.set("token", APP_TOKEN);
  const res = await fetchWithTimeout(url.toString(), {method:"GET"});
  return await res.json();
}

export async function cloudSkills(grade, subject){
  const url = new URL(SCRIPT_URL);
  url.searchParams.set("action","skills");
  url.searchParams.set("grade", grade);
  url.searchParams.set("subject", subject);
  url.searchParams.set("token", APP_TOKEN);
  const res = await fetchWithTimeout(url.toString(), {method:"GET"});
  return await res.json();
}
