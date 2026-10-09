// Define the TypeScript interface for Product
interface DefaultProduct {
  name: string;
  description: string;
  price: number;
  metadata: object; // Keeping metadata as a generic object as per your interface
}

// Convert the Go Product array into a TypeScript array
export const DEFAULT_PRODUCTS: DefaultProduct[] = [
  {
    name: 'A 31 Vorprojekt - 9.0%',
    description: `311 Studium von Lösungsmöglichkeiten und Grobschätzung der Baukosten
      312 Vorprojekt und Kostenschätzung`,
    price: 125,
    metadata: {
      task_list: [
        { name: 'Gebäude- und Geländeaufnahmen vom Geometer' },
        { name: 'Studium Lösungsmöglichkeiten' },
        { name: '3D-Gebäudemodell' },
        { name: 'Fachplaner' },
        { name: 'Grobkostenschätzung +-15%' },
        { name: 'Termine' },
      ],
    },
  },
  {
    name: 'A 32 Bauprojekt - 21.0%',
    description: `321 Bauprojekt
      322 Detailstudien
      323 Kostenvoranschlag`,
    price: 125,
    metadata: {
      task_list: [
        { name: 'Administration / Projektleitung' },
        { name: '3D Modell' },
        { name: 'Vermassung' },
        { name: 'Berechnungen' },
        { name: 'Layout' },
        { name: 'Kostenvoranschlag +-10%' },
        { name: 'Termine' },
      ],
    },
  },
  {
    name: 'A 33 Baubewilligungsverfahren - 2.5%',
    description: `33 Baubewilligung`,
    price: 125,
    metadata: {
      task_list: [{ name: 'Abklärungen Behörden' }, { name: 'Print' }, { name: 'Baueingabe Unterschriften' }],
    },
  },
  {
    name: 'A 41 Ausschreibung, Offertvergleich, Vergabeantrag - 18.0%',
    description: `411 Ausschreibunspläne
      412 Ausschreibung und Vergabe`,
    price: 125,
    metadata: {
      task_list: [
        { name: 'Ausschreibungspläne' },
        { name: 'Submission' },
        { name: 'Vergabe' },
        { name: 'Rev. Kostenvoranschlag (+-5%)' },
        { name: 'Werkverträge' },
      ],
    },
  },
  {
    name: 'A 51 Ausführungsprojekt - 16.0%',
    description: `511 Ausführungspläne
      512 Werkverträge`,
    price: 125,
    metadata: {
      task_list: [{ name: 'Werkpläne' }, { name: 'Detailpläne' }],
    },
  },
  {
    name: 'A 52 Ausführung - 29.0%',
    description: `521 Gestalterische Leitung
      522 Bauleitung und Kostenkontrolle`,
    price: 125,
    metadata: {
      task_list: [{ name: 'Terminplanung' }, { name: 'Bauleitung' }],
    },
  },
  {
    name: 'A 53 Inbetriebnahme, Abschluss - 4.5%',
    description: `531 Inbetriebnahme
      532 Dokumentation über das Bauwerk
      533 Leitung der Garantiearbeiten
      534 Schlussabrechnung`,
    price: 125,
    metadata: {
      task_list: [
        { name: 'Inbetriebnahme / Abnahmen' },
        { name: 'Dokumentation' },
        { name: 'Schlussabrechnung' },
        { name: 'Garantiearbeiten' },
      ],
    },
  },
];
