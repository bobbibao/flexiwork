// Master Data interface & default value
interface MasterData {
  country: string;
  address: string;
  postcode: string;
  place: string;
  phone: string;
  email: string;
  fax: string;
  web: string;
  konto: string;
  mwst: string;
  bank: string;
  clearing_num: string;
  iban: string;
}

export const defaultMasterData = (email: string): MasterData => ({
  country: 'CH',
  address: '',
  postcode: '',
  place: '',
  phone: '',
  email: email,
  fax: '',
  web: '',
  konto: '',
  mwst: '',
  bank: '',
  clearing_num: '',
  iban: '',
});

// Offer interface & default value
interface Offer {
  end: string;
  begin: string;
  event: string;
  offer: string;
  parameter: string;
  additional: string;
  performance: string;
  estimate_cost: string;
  begin_desc: string;
  performance_desc: string;
  parameter_desc: string;
  offer_desc: string;
  additional_desc: string;
  end_desc: string;
  km_dropdown_setting: KmDropdownSetting[];
  add_cost_setting: AddCostSetting[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  estimate_setting: Record<string, any>;
  event_setting: EventSetting[];
}

interface KmDropdownSetting {
  label: string;
  value: number;
}

interface AddCostSetting {
  label: string;
  value: number;
}

interface EventSetting {
  label: string;
  value: string;
}

function getMesserliCalc(): Record<string, { label: string; value: number }> {
  const z1 = 0.062;
  const z2 = 10.58;
  const b = 2200000.0;
  const n = 1.0;
  const s = 1.0;
  const r = 1.0;
  const i = 1.0;
  const U = 1.0;
  const R = 0.0;
  const h = 85.0;

  const p = parseFloat((z1 + z2 / Math.pow(b, 1.0 / 3.0)).toFixed(15));
  const Tm = ((b * p) / 100.0) * n * r * U;

  return {
    coefficients_z1: {
      label: 'Koeffizeinten nach SIA - Z1',
      value: z1,
    },
    coefficients_z2: {
      label: 'Koeffizeinten nach SIA - Z2',
      value: z2,
    },
    basic_factor: {
      label: 'Grundfaktor p',
      value: p,
    },
    construction_cost: {
      label: 'Baukosten aufwandbestimmtend B',
      value: b,
    },
    building_cost: {
      label: 'Baukosten faktorbestimmend B',
      value: b,
    },
    difficulty_lv: {
      label: 'Schwierigkeitsgrad n',
      value: n,
    },
    special_service_factor: {
      label: 'Faktor für Sonderleistungen s',
      value: s,
    },
    adjustment_factor: {
      label: 'Anpassungsfaktor r',
      value: r,
    },
    team_factor: {
      label: 'Teamfaktor i',
      value: i,
    },
    u_factor: {
      label: 'Faktor U',
      value: U,
    },
    time: {
      label: 'Zeitaufwand Tm',
      value: Tm,
    },
    advertised: {
      label: 'Angeobtener Stundensatz h',
      value: h,
    },
    discount: {
      label: 'Rabatt in %',
      value: R,
    },
  };
}

export const defaultOffer: Offer = {
  end: '7. Ende des Textes',
  begin: '1. Rahmenbedingungen',
  event: '6. Terminziele',
  offer: '4. Honorarofferte',
  parameter: '3. Honorarparameter (Alternativ Kostenschätzung)',
  additional: '5. Nebenkosten',
  performance: '2. Leistungsumfang',
  estimate_cost: '3. Anlagekosten (+-25%)',
  begin_desc:
    '<p>Die Gemeinde Churwalden hat die Firma Willi Haustechnik AG mit dem Auftrag zur Sanierung und dem Umbau des Freibades in der Gemeinde beauftragt.</p><p>Die Firma Willi Haustechnik AG wird diesen Auftrag als Generalunternehmerin erstellen. Wir wurden von Willi Haustechnik eingeladen unsere Honorarofferte auf Basis von Architekturleistungen und Bauingenieurleistungen zu erbringen.</p><p>Diese Offerte umschreibt die geplanten Arbeiten und die entsprechenden Leistungen und daraus resultierenden Kosten.</p>',
  performance_desc: 'Die vorliegende Offerte umfasst die Grundleistungen nach SIA 102.',
  parameter_desc: '',
  offer_desc:
    '<p><strong>Gerne offerieren wir Ihnen folgende Architekturleistungen:</strong></p><p><strong>BASIS:</strong></p><p><strong>Baukostenberechnung nach Vorgabe Bauherr oder Grobkostenschätzung des Architekten.</strong></p><ul><li><em>Kostengenauigkeit +-25%</em></li><li><em>Baukostenannahme exkl. HO und MWST = CHF 120</em></li><li><em>Schwierigkeitsgrad n = 1.0</em></li><li><em>Faktor für Sonderleistungen = 1.0</em></li><li><em>Anpassungsfaktor = 1.0</em></li><li><em>Teamfaktor = 1.0</em></li><li><em>Zuschlag für Umbauten = 1.0</em></li><li><em>Angebotener durchschnittlicher Stundenansatz = CHF 125.-</em></li></ul><p><em>Angebotener Rabatt siehe einzelnen Positionen/Leistungsphasen</em></p><p><em>Basis bildet die SIA Norm 102 Architekturleistungen und darin in erster Linie die Grundleistungen.</em></p>',
  additional_desc:
    '<p>Die Nebenkosten werden als Pauschale in Prozent der Netto-Honorarsumme (exkl. MWST) berechnet und stellen sich je nach Projekt und Notwendigkeit wie folgt zusammen:</p><p><strong>Fahrkilometer inkl,. Fahrzeit je nach Umkreis (U1-3)/Parkierungsspesen/Bewilligungen etc. = 3.0%&nbsp;</strong></p><p><strong>(Bürostandort; U1 = 1.0%, Bis 10km; U2 = 2.0%, über 10km; U3 = 3.0%)</strong></p><p><strong>Personalspesen, Mittagessen, Kleinauslagen etc. = 0.5%</strong></p><p><strong>Interne Vervielfälltigungen aller Art (Plotvorabzüge, KopienA4/A3, sw, farbig, Folien etc. = 1.0%</strong></p><p><strong>Nutzung von Messgeräten, Thermographie, Nivellier, Rotationslaser, Baumessgeräten etc. = 0.5%</strong></p><p><strong>IT-Medien, Sticks, Bindemittel, Ordner, Briefmarken, Einschreiben etc. = 0.5%</strong></p><p>Planplots werden über externe Reprografieanstalten in Auftrag gegeben und sind nicht Bestandteil der Plan4 Nebenkostenpauschale. Diese Rechnungen werden durch Plan4 kontrolliert und werden der Bauherrschaft direkt zugestellt.</p>',
  end_desc:
    '<p>Es würde uns sehr freuen zusammen mit Ihnen dieses interessante Projekt planen und ausführen zu dürfen. Wir sichern Ihnen unseren vollen Einsatz zur Sicherstellung einer termin- und kostengerechten Umsetzung zu.</p><p>Bei Fragen oder Unklarheiten stehen wir Ihnen gerne zur Verfügung.</p><p><br></p><p>Freundliche Grüsse</p>',
  km_dropdown_setting: [
    { label: 'Keine - 0.0%', value: 0.0 },
    { label: 'Bürostandort; U1 = 1.0%', value: 1.0 },
    { label: 'Bis 10km; U2 = 2.0%', value: 2.0 },
    { label: 'über 10km; U3 = 3.0%.', value: 3.0 },
  ],
  add_cost_setting: [
    { label: 'Personalspese, Mittagessen, Kleinauslagen etc.', value: 0.5 },
    { label: 'Interne Vervielfälltigungen aller Art (Plotvorabzüge, KopienA4/A3, sw, farbig, Folien etc.', value: 1.0 },
    { label: 'Nutzung von Messgeräten, Thermographie, Nivellier, Rotationslaser, Baumessgeräten etc.', value: 0.5 },
    { label: 'IT-Medien, Sticks, Bindemittel, Ordner, Briefmarken, Einschreiben etc.', value: 0.5 },
  ],
  estimate_setting: getMesserliCalc(),
  event_setting: [
    { label: 'Vergabe Auftrag', value: '' },
    { label: 'Erstellung Bauprojekt', value: '' },
    { label: 'Submission', value: '' },
    { label: 'Baubeginn', value: '' },
    { label: 'Ziel Rohbauende', value: '' },
    { label: 'Bezug', value: '' },
    { label: 'Umgebung', value: '' },
  ],
};

// Invoice interface && default value
interface Invoice {
  end: string;
  end_desc: string;
  begin: string;
  begin_desc: string;
  partial_end: string;
  partial_end_desc: string;
  partial_begin: string;
  partial_begin_desc: string;
  payment_deadline: number;
  reminder1_end_desc: string;
  reminder2_end_desc: string;
  reminder1_begin_desc: string;
  reminder2_begin_desc: string;
  reminder1_payment_deadline: number;
  reminder2_payment_deadline: number;
}

export const defaultInvoice: Invoice = {
  end: '2. Ende des Textes',
  end_desc:
    '<p>Herzlichen Dank für Ihr Vertrauen - wir freuen uns auf die weitere Zusammenarbeit.</p><p><br></p><p>Freundliche Grüsse</p>',
  begin: '1. Rahmenbedingungen',
  begin_desc:
    'Ihren geschätzten Auftrag haben wir abgeschlossen. Wir hoffen, dass wir alle Arbeiten zu Ihrer vollsten Zufriedenheit ausgeführt haben. Die vereinbarten Leistungen stellen wir wie folgt in Rechnung:',
  partial_end: '4. Teilrechnung Text Ende',
  partial_end_desc:
    '<p>Herzlichen Dank für Ihr Vertrauen - wir freuen uns auf die weitere Zusammenarbeit.</p><p><br></p><p>Freundliche Grüsse</p>',
  partial_begin: '3. Teilrechnung Text Anfang',
  partial_begin_desc:
    'Ihren geschätzten Auftrag haben wir abgeschlossen. Wir hoffen, dass wir alle Arbeiten zu Ihrer vollsten Zufriedenheit ausgeführt haben. Die vereinbarten Leistungen stellen wir wie folgt in Rechnung:',
  payment_deadline: 14,
  reminder1_end_desc:
    '<p>Wir bitten Sie, den fälligen Betrag innerhalb der nächsten 14 Tage zu überweisen. Wenn Sie Fragen haben oder Unklarheiten bestehen, setzen Sie sich bitte mit uns in Verbindung.</p><p><br></p><p>Wurde die Rechnung bereits beglichen? Dann betrachten Sie dieses Schreiben als gegenstandslos.</p><p><br></p><p>Freundliche Grüsse</p>',
  reminder2_end_desc:
    '<p>Ohne Ihren Gegenbericht gehen wir davon aus, dass Sie den genannten Betrag innerhalb der nächsten 7 Tage begleichen werden. Nach Ablauf dieser Frist müssen wir leider rechtliche Schritte einleiten.</p><p><br></p><p>Wir appellieren an Ihre Fairness und danken Ihnen für Ihre umgehende Zahlung.</p><p><br></p><p>Freundliche Grüsse</p>',
  reminder1_begin_desc:
    '<p>Unsere oben genannte Rechnung ist trotz abgelaufener Zahlungsfrist ausstehend. Folgende Leistungen haben wir für Sie erbracht:</p>',
  reminder2_begin_desc:
    '<p>Unsere oben genannte Rechnung ist trotz zusätzlicher Mahnfrist immer noch offen. Folgende Leistungen haben wir für Sie erbracht:</p>',
  reminder1_payment_deadline: 14,
  reminder2_payment_deadline: 7,
};

// Project interface && default value
interface Project {
  duration: number;
  begin: string;
  begin_desc: string;
  end: string;
  end_desc: string;
}

export const defaultProject: Project = {
  duration: 15,
  begin: 'Anfang des Textes',
  begin_desc:
    '<p>Die Gemeinde Churwalden hat die Firma Willi Haustechnik AG mit dem Auftrag zur Sanierung und dem Umbau des Freibades in der Gemeinde beauftragt.</p><p>Die Firma Willi Haustechnik AG wird diesen Auftrag als Generalunternehmerin erstellen. Wir wurden von Willi Haustechnik eingeladen unsere Honorarofferte auf Basis von Architekturleistungen und Bauingenieurleistungen zu erbringen.</p><p>Diese Offerte umschreibt die geplanten Arbeiten und die entsprechenden Leistungen und daraus resultierenden Kosten.</p>',
  end: 'Ende des Textes',
  end_desc:
    '<p>Es würde uns sehr freuen zusammen mit Ihnen dieses interessante Projekt planen und ausführen zu dürfen. Wir sichern Ihnen unseren vollen Einsatz zur Sicherstellung einer termin- und kostengerechten Umsetzung zu.</p><p>Bei Fragen oder Unklarheiten stehen wir Ihnen gerne zur Verfügung.</p><p><br></p><p>Freundliche Grüsse</p>',
};

// Timesheet interface & default value
interface Timesheet {
  must_working_hours: number;
  max_work_hours_per_week: number;
  holidays: Holiday[];
}

interface Holiday {
  label: string;
  date: string;
}

export const defaultTimesheet: Timesheet = {
  must_working_hours: 8.5,
  max_work_hours_per_week: 42.5,
  holidays: [
    {
      label: '2021 New Year',
      date: '2021-01-01',
    },
  ],
};

// PDF Layout interface & default value
interface PDFLayout {
  logo: string;
  scaling: number;
  logo_position: string;
  address_position: string;
  pdf_font: string;
  show_footer: boolean;
  show_header: boolean;
  show_page_numbers: boolean;
}

export const defaultPDFLayout: PDFLayout = {
  logo: '',
  scaling: 50,
  logo_position: 'left',
  address_position: 'right',
  pdf_font: 'klavika',
  show_footer: true,
  show_header: true,
  show_page_numbers: false,
};
