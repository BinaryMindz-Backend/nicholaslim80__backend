export const decimalToNumber = (value: any) => {
  if (!value) return null;
  return Number(value.toString());
};
