interface XLSXColumn {
  index: string;
  width: number;  // -1 = auto
}

export const offerXLSXColumns: XLSXColumn[] = [
  { index: 'A', width: 10 },
  { index: 'B', width: -1 },
  { index: 'C', width: -1 },
  { index: 'D', width: -1 },
  { index: 'E', width: -1 },
]

export const userXLSXColumns: XLSXColumn[] = [
  { index: 'A', width: 30 }, 
  { index: 'B', width: 40 }, 
  { index: 'C', width: -1 }, 
  { index: 'D', width: -1 }, 
];

export const addressesXLSXColumns: XLSXColumn[] = [
  { index: 'A', width: 20 }, 
  { index: 'B', width: 10 }, 
  { index: 'C', width: 30 }, 
  { index: 'D', width: 10 }, 
  { index: 'E', width: 10 },
  { index: 'F', width: 30 },
  { index: 'G', width: 20 },
];

export const expenseXLSXColumns = (noRate: boolean): XLSXColumn[] => {
  if (noRate) {
    return [
      { index: 'A', width: 10 },
      { index: 'B', width: 10 },
      { index: 'C', width: 10 },
      { index: 'D', width: 10 },
      { index: 'E', width: 10 },
      { index: 'G', width: 20 },
      { index: 'I', width: -1 },
    ];
  } else {
    return [
      { index: 'A', width: 10 },
      { index: 'B', width: 10 },
      { index: 'C', width: 10 },
      { index: 'D', width: 10 },
      { index: 'E', width: 10 },
      { index: 'F', width: 10 },
      { index: 'G', width: 20 },
      { index: 'H', width: 20 },
      { index: 'I', width: -1 },
    ];
  }
}

export const projectInvoiceXLSXColumns: XLSXColumn[] = [
  { index: 'A', width: 60 }, 
  { index: 'B', width: 30 }, 
  { index: 'C', width: 30 }, 
  { index: 'D', width: 30 }, 
  { index: 'E', width: 30 },
];

