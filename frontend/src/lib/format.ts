export const formatCurrencyCompact = (value: number) => {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 2)}M`;
  }

  return `$${value.toLocaleString()}`;
};
