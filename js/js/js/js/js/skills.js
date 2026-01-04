import { cloudSkills } from "./cloud.js";

const cache = new Map();

export async function getSkills(grade, subject){
  const key = `${grade}||${subject}`;
  if(cache.has(key)) return cache.get(key);

  try{
    const data = await cloudSkills(grade, subject);
    const list = (data.ok && Array.isArray(data.skills)) ? data.skills : [];
    cache.set(key, list);
    return list;
  }catch{
    cache.set(key, []);
    return [];
  }
}
