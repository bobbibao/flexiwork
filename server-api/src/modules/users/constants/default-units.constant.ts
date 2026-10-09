interface DefaultUnit {
  name: string;
  description: string;
  timeRecordActive: boolean;
  visible: boolean;
  isDefault: boolean;
}

export const DEFAULT_UNITS: DefaultUnit[] = [
  {
    name: 'unit.flat',
    description: 'unit.flatRate',
    timeRecordActive: false,
    visible: true,
    isDefault: false,
  },
  {
    name: 'unit.hr',
    description: 'unit.hours',
    timeRecordActive: false,
    visible: true,
    isDefault: true,
  },
  {
    name: 'unit.km',
    description: 'unit.kilometres',
    timeRecordActive: false,
    visible: true,
    isDefault: false,
  },
  {
    name: 'unit.m2',
    description: 'unit.squareMetres',
    timeRecordActive: false,
    visible: true,
    isDefault: false,
  },
  {
    name: 'unit.hr',
    description: 'unit.expenses',
    timeRecordActive: true,
    visible: true,
    isDefault: false,
  },
  {
    name: 'unit.item',
    description: 'unit.items',
    timeRecordActive: false,
    visible: true,
    isDefault: false,
  },
];
