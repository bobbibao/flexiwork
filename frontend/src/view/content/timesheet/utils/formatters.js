export const numberFormatter = value => {
  if (Number.isFinite(value)) {
    return value.toFixed(2);
  }
  return value;
};

export const totalNumberFormatter = params => {
  const formattedNumber = numberFormatter(params.value);
  if (formattedNumber) {
    return `${formattedNumber}h`;
  }
  return null;
};
