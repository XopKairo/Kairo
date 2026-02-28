// Function to determine user badge based on points
const getUserBadge = (points) => {
  if (points >= 1000) return { name: 'Diamond', color: '#B9F2FF' };
  if (points >= 500) return { name: 'Gold', color: '#FFD700' };
  if (points >= 200) return { name: 'Silver', color: '#C0C0C0' };
  if (points >= 50) return { name: 'Bronze', color: '#CD7F32' };
  return { name: 'Newbie', color: '#808080' };
};

module.exports = { getUserBadge };
