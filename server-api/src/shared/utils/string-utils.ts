/**
 * Format string to ISR format
 * @param {string} referenceNumber - Reference number to format (length <= 27)
 * @returns {string} Formatted reference number
 */
export const formatReferenceNumber = (referenceNumber: string): string => {
  if (referenceNumber.length > 27) {
    throw new Error(`Invalid reference number, got ${referenceNumber}`);
  }
  return referenceNumber
    .padStart(27, "0")
    .replace(/(\d{2})(\d{5})(\d{5})(\d{5})(\d{5})(\d{5})/, "$1 $2 $3 $4 $5 $6");
};

const modulo10 = (val: string): number => {
  const table = [0, 9, 4, 6, 8, 2, 7, 1, 3, 5];
  let next = 0;
  
  for (let i = 0; i < val.length; i++) {
      const tmp = parseInt(val[i], 10);
      if (isNaN(tmp)) continue;
      next = table[(next + tmp) % 10];
  }
  
  return (10 - next) % 10;
}

export const getQRRefNumber = (raw: string): string => {
  return `${raw}${modulo10(raw)}`;
}
