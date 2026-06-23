const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
const dWeek = new Date(nowIST);
dWeek.setDate(dWeek.getDate() - dWeek.getDay());
const currentWeekKey = `${dWeek.getFullYear()}-W${String(dWeek.getMonth() + 1).padStart(2, '0')}-${String(dWeek.getDate()).padStart(2, '0')}`;
console.log(currentWeekKey);
