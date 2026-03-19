export const calculateBadge = (totalMinutes, totalCalls) => {
  if (totalMinutes > 1000 || totalCalls > 500) return { name: 'Elite', color: '#FFD700', icon: 'crown' };
  if (totalMinutes > 500 || totalCalls > 200) return { name: 'Star', color: '#C0C0C0', icon: 'star' };
  if (totalMinutes > 100 || totalCalls > 50) return { name: 'Pro', color: '#CD7F32', icon: 'zap' };
  return { name: 'Newbie', color: '#A099B0', icon: 'user' };
};

export const getUserBadge = calculateBadge; // For backward/forward compatibility

export default calculateBadge;