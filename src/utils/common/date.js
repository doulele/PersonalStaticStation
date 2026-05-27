export const formatDate = (ts) => {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');  // getMonth() 返回0-11，需+1
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};