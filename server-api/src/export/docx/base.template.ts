export class DocxBaseTemplate {
  protected defaultFont: string = 'Klavika';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected tableOptions: Record<string, any> = {
    tableWidths: [2300, 500, 500, 600, 500, 600],
    invoiceHistoryTableBreak: false,
    tableHeader: true,
    invoiceHistoryTableHeader: true,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async getStyle(): Promise<Record<string, any>> {
    return {
      font: this.defaultFont,
      ...this.tableOptions,
    };
  }

  public getXmlStyle(): string {
    return `<style:style style:name="Bold" style:family="text">
          <style:text-properties fo:font-weight="bold" style:font-weight-asian="bold" style:font-weight-complex="bold" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="Italic" style:family="text">
          <style:text-properties fo:font-style="italic" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="BoldItalic" style:family="text">
          <style:text-properties fo:font-weight="bold" fo:font-style="italic" style:font-weight-asian="bold" style:font-weight-complex="bold" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="Underline" style:family="text">
          <style:text-properties style:text-underline-style="solid" style:text-underline-width="auto" style:text-underline-color="font-color" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="BoldUnderline" style:family="text">
          <style:text-properties fo:font-weight="bold" style:text-underline-style="solid" style:text-underline-width="auto" style:text-underline-color="font-color" style:font-weight-asian="bold" style:font-weight-complex="bold" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="ItalicUnderline" style:family="text">
          <style:text-properties fo:font-style="italic" style:text-underline-style="solid" style:text-underline-width="auto" style:text-underline-color="font-color" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="BoldItalicUnderline" style:family="text">
          <style:text-properties fo:font-weight="bold" fo:font-style="italic" style:text-underline-style="solid" style:text-underline-width="auto" style:text-underline-color="font-color" style:font-weight-asian="bold" style:font-weight-complex="bold" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="Link" style:family="text">
          <style:text-properties fo:color="#0000ff" style:text-underline-style="solid" style:text-underline-width="auto" style:text-underline-color="font-color" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="BoldLink" style:family="text">
          <style:text-properties fo:font-weight="bold" fo:color="#0000ff" style:text-underline-style="solid" style:text-underline-width="auto" style:text-underline-color="font-color" style:font-weight-asian="bold" style:font-weight-complex="bold" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="ItalicLink" style:family="text">
          <style:text-properties fo:font-style="italic" fo:color="#0000ff" style:text-underline-style="solid" style:text-underline-width="auto" style:text-underline-color="font-color" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="BoldItalicLink" style:family="text">
          <style:text-properties fo:font-weight="bold" fo:font-style="italic" fo:color="#0000ff" style:text-underline-style="solid" style:text-underline-width="auto" style:text-underline-color="font-color" style:font-weight-asian="bold" style:font-weight-complex="bold" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="H1" style:family="text">
          <style:paragraph-properties fo:line-height="150%" fo:keep-together.within-line="always" fo:break-after="line" />
          <style:text-properties fo:font-size="26pt" fo:font-weight="bold" style:font-weight-asian="bold" style:font-weight-complex="bold" style:font-name="Inter Bold" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="H2" style:family="text">
          <style:paragraph-properties fo:line-height="150%" fo:keep-together.within-line="always" fo:break-after="line" />
          <style:text-properties fo:font-size="22pt" fo:font-weight="bold" style:font-weight-asian="bold" style:font-weight-complex="bold" style:font-name="Inter Bold" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="H3" style:family="text">
          <style:paragraph-properties fo:line-height="150%" fo:keep-together.within-line="always" fo:break-after="line" />
          <style:text-properties fo:font-size="19pt" fo:font-weight="bold" style:font-weight-asian="bold" style:font-weight-complex="bold" style:font-name="Inter Bold" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="H4" style:family="text">
          <style:paragraph-properties fo:line-height="150%" fo:keep-together.within-line="always" fo:break-after="line" />
          <style:text-properties fo:font-size="16pt" fo:font-weight="bold" style:font-weight-asian="bold" style:font-weight-complex="bold" style:font-name="Inter Bold" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="H5" style:family="text">
          <style:paragraph-properties fo:line-height="150%" fo:keep-together.within-line="always" fo:break-after="line" />
          <style:text-properties fo:font-size="14pt" fo:font-weight="bold" style:font-weight-asian="bold" style:font-weight-complex="bold" style:font-name="Inter Bold" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="H6" style:family="text">
          <style:paragraph-properties fo:line-height="150%" fo:keep-together.within-line="always" fo:break-after="line" />
          <style:text-properties fo:font-size="13pt" fo:font-weight="bold" style:font-weight-asian="bold" style:font-weight-complex="bold" style:font-name="Inter Bold" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="Normal" style:family="text">
          <style:paragraph-properties fo:line-height="120%" />
          <style:text-properties style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="L1-P" style:family="paragraph" style:parent-style-name="Standard" style:list-style-name="L1">
          <style:paragraph-properties fo:margin-left="0in" style:contextual-spacing="false"/>
          <style:text-properties officeooo:paragraph-rsid="00205194" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="L1-T" style:family="text">
          <style:text-properties officeooo:rsid="00205194" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="L2-P" style:family="paragraph" style:parent-style-name="Standard" style:list-style-name="L1">
          <style:paragraph-properties fo:margin-left="0.5in" style:contextual-spacing="false"/>
          <style:text-properties officeooo:paragraph-rsid="00205194" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="L2-T" style:family="text">
          <style:text-properties officeooo:rsid="00205194" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="L3-P" style:family="paragraph" style:parent-style-name="Standard" style:list-style-name="L1">
          <style:paragraph-properties fo:margin-left="1in" style:contextual-spacing="false"/>
          <style:text-properties officeooo:paragraph-rsid="00205194" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="L3-T" style:family="text">
          <style:text-properties officeooo:rsid="00205194" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="L4-P" style:family="paragraph" style:parent-style-name="Standard" style:list-style-name="L1">
          <style:paragraph-properties fo:margin-left="1.5in" style:contextual-spacing="false"/>
          <style:text-properties officeooo:paragraph-rsid="00205194" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="L4-T" style:family="text">
          <style:text-properties officeooo:rsid="00205194" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="L5-P" style:family="paragraph" style:parent-style-name="Standard" style:list-style-name="L1">
          <style:paragraph-properties fo:margin-left="2in" style:contextual-spacing="false"/>
          <style:text-properties officeooo:paragraph-rsid="00205194" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="L5-T" style:family="text">
          <style:text-properties officeooo:rsid="00205194" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="L6-P" style:family="paragraph" style:parent-style-name="Standard" style:list-style-name="L1">
          <style:paragraph-properties fo:margin-left="2.5in" style:contextual-spacing="false"/>
          <style:text-properties officeooo:paragraph-rsid="00205194" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="L6-T" style:family="text">
          <style:text-properties officeooo:rsid="00205194" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="L7-P" style:family="paragraph" style:parent-style-name="Standard" style:list-style-name="L1">
          <style:paragraph-properties fo:margin-left="3in" style:contextual-spacing="false"/>
          <style:text-properties officeooo:paragraph-rsid="00205194" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="L7-T" style:family="text">
          <style:text-properties officeooo:rsid="00205194" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="L8-P" style:family="paragraph" style:parent-style-name="Standard" style:list-style-name="L1">
          <style:paragraph-properties fo:margin-left="3.5in" style:contextual-spacing="false"/>
          <style:text-properties officeooo:paragraph-rsid="00205194" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="L8-T" style:family="text">
          <style:text-properties officeooo:rsid="00205194" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="L9-P" style:family="paragraph" style:parent-style-name="Standard" style:list-style-name="L1">
          <style:paragraph-properties fo:margin-left="4in" style:contextual-spacing="false"/>
          <style:text-properties officeooo:paragraph-rsid="00205194" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="L9-T" style:family="text">
          <style:text-properties officeooo:rsid="00205194" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="L10-P" style:family="paragraph" style:parent-style-name="Standard" style:list-style-name="L1">
          <style:paragraph-properties fo:margin-left="4.5in" style:contextual-spacing="false"/>
          <style:text-properties officeooo:paragraph-rsid="00205194" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="L10-T" style:family="text">
          <style:text-properties officeooo:rsid="00205194" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="PageBreak" style:family="paragraph" style:parent-style-name="Standard">
          <style:paragraph-properties fo:margin-top="0in" fo:margin-bottom="0in" style:contextual-spacing="false" fo:line-height="100%" fo:break-after="page"/>
        </style:style>
        <style:style style:name="TextNoPaddingY" style:family="text">
          <style:paragraph-properties fo:margin-top="0in" fo:margin-bottom="0in" style:contextual-spacing="false" fo:line-height="100%" />
          <style:text-properties style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>

        <style:style style:name="PaymentInfo" style:family="paragraph">
          <style:text-properties fo:font-size="9pt" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="TableHeaderSpan" style:family="text">
          <style:text-properties fo:font-size="9pt" fo:font-style="italic" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="Standard" style:family="paragraph">
          <style:text-properties style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="PStandard" style:family="paragraph">
          <style:text-properties fo:font-size="8.5pt" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="EventTextStandard" style:family="paragraph">
          <style:text-properties fo:font-size="10pt" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="EventTextPStandard" style:family="paragraph">
          <style:text-properties fo:font-size="10pt" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" />
        </style:style>
        <style:style style:name="T_END" style:family="paragraph">
          <style:paragraph-properties fo:text-align="end" style:justify-single-word="false"/>
          <style:text-properties fo:font-size="8.5pt" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" fo:wrap-option="no-wrap" />
        </style:style>
        <style:style style:name="EventValue" style:family="paragraph">
          <style:paragraph-properties fo:text-align="end" style:justify-single-word="false" fo:margin-right="0.5in"/>
          <style:text-properties fo:font-size="10pt" style:font-name="Inter Light" style:font-family-generic="swiss" style:font-pitch="variable" fo:wrap-option="no-wrap" />
        </style:style>
        <style:style style:name="TableDefault.H1" style:family="table-cell">
          <style:table-cell-properties fo:padding="0.02in" fo:border-left="none" fo:border-right="none" fo:border-top="0.75pt solid #000000" fo:border-bottom="0.75pt solid #000000"/>
        </style:style>
        <style:style style:name="TableCell" style:family="table-cell">
          <style:table-cell-properties fo:padding-top="0.1in" fo:padding-bottom="0.01in" fo:padding-left="0.0382in" fo:padding-right="0.0382in" />
        </style:style>
        <style:style style:name="TableCellNoPaddingY" style:family="table-cell">
          <style:table-cell-properties fo:padding-top="0.0in" fo:padding-bottom="0in" fo:padding-left="0.0382in" fo:padding-right="0.0382in" />
        </style:style>
        <style:style style:name="TableSumCell" style:family="table-cell">
          <style:table-cell-properties fo:padding-top="0.01in" fo:padding-bottom="0in" fo:padding-left="0.0382in" fo:padding-right="0.0382in" />
        </style:style>

        <style:style style:name="TableDefault" style:family="table">
          <style:table-properties style:rel-width="100%" fo:margin-left="0in" fo:margin-top="0in" fo:margin-bottom="0in" table:align="left" style:writing-mode="page"/>
          <style:text-properties fo:font-size="9pt"/>
        </style:style>
        <style:style style:name="TableDefault.A" style:family="table-column">
          <style:table-column-properties style:rel-column-width="100*"/>
        </style:style>
        <style:style style:name="TableDefault.B" style:family="table-column">
          <style:table-column-properties style:rel-column-width="28*"/>
        </style:style>
        <style:style style:name="TableDefault.C" style:family="table-column">
          <style:table-column-properties style:rel-column-width="28*"/>
        </style:style>
        <style:style style:name="TableDefault.D" style:family="table-column">
          <style:table-column-properties style:rel-column-width="28*"/>
        </style:style>
        <style:style style:name="TableDefault.E" style:family="table-column">
          <style:table-column-properties style:rel-column-width="28*"/>
        </style:style>
        <style:style style:name="TableDefault.F" style:family="table-column">
          <style:table-column-properties style:rel-column-width="34*"/>
        </style:style>

        <style:style style:name="TableSum.H1" style:family="table-cell">
          <style:table-cell-properties fo:padding="0.0382in" fo:border-left="none" fo:border-right="none" fo:border-top="0.75pt solid #000000" fo:border-bottom="none"/>
        </style:style>

        <style:style style:name="TableSum.F1" style:family="table-cell">
          <style:table-cell-properties fo:padding="0.0382in" fo:border-left="none" fo:border-right="none" fo:border-top="0.75pt solid #000000" fo:border-bottom="none"/>
        </style:style>

        <style:style style:name="TableSum.F2" style:family="table-cell">
          <style:table-cell-properties fo:padding="0.0382in" fo:border-left="none" fo:border-right="none" fo:border-bottom="2.5pt double #000000" fo:border-top="none"/>
        </style:style>

        <style:style style:name="TableSum" style:family="table">
          <style:table-properties style:rel-width="100%" fo:margin-left="0in" fo:margin-top="0in" fo:margin-bottom="0in" table:align="left" style:writing-mode="page"/>
          <style:text-properties fo:font-size="9pt"/>
        </style:style>
        <style:style style:name="TableSum.A" style:family="table-column">
          <style:table-column-properties style:rel-column-width="140*"/>
        </style:style>
        <style:style style:name="TableSum.B" style:family="table-column">
          <style:table-column-properties style:rel-column-width="44*"/>
        </style:style>
        <style:style style:name="TableSum.C" style:family="table-column">
          <style:table-column-properties style:rel-column-width="28*"/>
        </style:style>
        <style:style style:name="TableSum.D" style:family="table-column">
          <style:table-column-properties style:rel-column-width="34*"/>
        </style:style>

        <text:list-style style:name="L1">
          <text:list-level-style-bullet text:level="1" text:style-name="Bullet_20_Symbols" loext:num-list-format="%1%" text:bullet-char="•">
            <style:list-level-properties text:min-label-width="0.1in">
            </style:list-level-properties>
          </text:list-level-style-bullet>
          <text:list-level-style-bullet text:level="2" text:style-name="Bullet_20_Symbols" loext:num-list-format="%2%" text:bullet-char="◦">
            <style:list-level-properties text:min-label-width="0.1in">
            </style:list-level-properties>
          </text:list-level-style-bullet>
          <text:list-level-style-bullet text:level="3" text:style-name="Bullet_20_Symbols" loext:num-list-format="%3%" text:bullet-char="▪">
            <style:list-level-properties text:min-label-width="0.1in">
            </style:list-level-properties>
          </text:list-level-style-bullet>
          <text:list-level-style-bullet text:level="4" text:style-name="Bullet_20_Symbols" loext:num-list-format="%4%" text:bullet-char="•">
            <style:list-level-properties text:min-label-width="0.1in">
            </style:list-level-properties>
          </text:list-level-style-bullet>
          <text:list-level-style-bullet text:level="5" text:style-name="Bullet_20_Symbols" loext:num-list-format="%5%" text:bullet-char="◦">
            <style:list-level-properties text:min-label-width="0.1in">
            </style:list-level-properties>
          </text:list-level-style-bullet>
          <text:list-level-style-bullet text:level="6" text:style-name="Bullet_20_Symbols" loext:num-list-format="%6%" text:bullet-char="▪">
            <style:list-level-properties text:min-label-width="0.1in">
            </style:list-level-properties>
          </text:list-level-style-bullet>
          <text:list-level-style-bullet text:level="7" text:style-name="Bullet_20_Symbols" loext:num-list-format="%7%" text:bullet-char="•">
            <style:list-level-properties text:min-label-width="0.1in">
            </style:list-level-properties>
          </text:list-level-style-bullet>
          <text:list-level-style-bullet text:level="8" text:style-name="Bullet_20_Symbols" loext:num-list-format="%8%" text:bullet-char="◦">
            <style:list-level-properties text:min-label-width="0.1in">
            </style:list-level-properties>
          </text:list-level-style-bullet>
          <text:list-level-style-bullet text:level="9" text:style-name="Bullet_20_Symbols" loext:num-list-format="%9%" text:bullet-char="▪">
            <style:list-level-properties text:min-label-width="0.1in">
            </style:list-level-properties>
          </text:list-level-style-bullet>
          <text:list-level-style-bullet text:level="10" text:style-name="Bullet_20_Symbols" loext:num-list-format="%10%" text:bullet-char="•">
            <style:list-level-properties text:min-label-width="0.1in">
            </style:list-level-properties>
          </text:list-level-style-bullet>
        </text:list-style>

         <text:list-style style:name="OL1">
          <text:list-level-style-number text:level="1" style:num-suffix="." style:num-format="1">
            <style:list-level-properties text:list-level-position-and-space-mode="label-alignment">
              <style:list-level-label-alignment text:label-followed-by="listtab" text:list-tab-stop-position="0.25in" fo:text-indent="0.25in" fo:margin-left="0.5in"/>
            </style:list-level-properties>
          </text:list-level-style-number>
          <text:list-level-style-number text:level="2" style:num-suffix="." style:num-format="a">
            <style:list-level-properties text:list-level-position-and-space-mode="label-alignment">
              <style:list-level-label-alignment text:label-followed-by="listtab" text:list-tab-stop-position="0.5in" fo:text-indent="0.25in" fo:margin-left="0.75in"/>
            </style:list-level-properties>
          </text:list-level-style-number>
          <text:list-level-style-number text:level="3" style:num-suffix="." style:num-format="i">
            <style:list-level-properties text:list-level-position-and-space-mode="label-alignment">
              <style:list-level-label-alignment text:label-followed-by="listtab" text:list-tab-stop-position="0.75in" fo:text-indent="0.25in" fo:margin-left="1.0in"/>
            </style:list-level-properties>
          </text:list-level-style-number>
          <text:list-level-style-number text:level="4" style:num-suffix="." style:num-format="1">
            <style:list-level-properties text:list-level-position-and-space-mode="label-alignment">
              <style:list-level-label-alignment text:label-followed-by="listtab" text:list-tab-stop-position="1in" fo:text-indent="0.25in" fo:margin-left="1.25in"/>
            </style:list-level-properties>
          </text:list-level-style-number>
          <text:list-level-style-number text:level="5" style:num-suffix="." style:num-format="a">
            <style:list-level-properties text:list-level-position-and-space-mode="label-alignment">
              <style:list-level-label-alignment text:label-followed-by="listtab" text:list-tab-stop-position="1.25in" fo:text-indent="0.25in" fo:margin-left="1.5in"/>
            </style:list-level-properties>
          </text:list-level-style-number>
          <text:list-level-style-number text:level="6" style:num-suffix="." style:num-format="i">
            <style:list-level-properties text:list-level-position-and-space-mode="label-alignment">
              <style:list-level-label-alignment text:label-followed-by="listtab" text:list-tab-stop-position="1.5in" fo:text-indent="0.25in" fo:margin-left="1.75in"/>
            </style:list-level-properties>
          </text:list-level-style-number>
          <text:list-level-style-number text:level="7" style:num-suffix="." style:num-format="1">
            <style:list-level-properties text:list-level-position-and-space-mode="label-alignment">
              <style:list-level-label-alignment text:label-followed-by="listtab" text:list-tab-stop-position="1.75in" fo:text-indent="0.25in" fo:margin-left="2.0in"/>
            </style:list-level-properties>
          </text:list-level-style-number>
          <text:list-level-style-number text:level="8" style:num-suffix="." style:num-format="a">
            <style:list-level-properties text:list-level-position-and-space-mode="label-alignment">
              <style:list-level-label-alignment text:label-followed-by="listtab" text:list-tab-stop-position="2in" fo:text-indent="0.25in" fo:margin-left="2.25in"/>
            </style:list-level-properties>
          </text:list-level-style-number>
          <text:list-level-style-number text:level="9" style:num-suffix="." style:num-format="i">
            <style:list-level-properties text:list-level-position-and-space-mode="label-alignment">
              <style:list-level-label-alignment text:label-followed-by="listtab" text:list-tab-stop-position="2.25in" fo:text-indent="0.25in" fo:margin-left="2.5in"/>
            </style:list-level-properties>
          </text:list-level-style-number>
          <text:list-level-style-number text:level="10" style:num-suffix="." style:num-format="1">
            <style:list-level-properties text:list-level-position-and-space-mode="label-alignment">
              <style:list-level-label-alignment text:label-followed-by="listtab" text:list-tab-stop-position="2.5in" fo:text-indent="0.25in" fo:margin-left="2.75in"/>
            </style:list-level-properties>
          </text:list-level-style-number>
        </text:list-style>`;
  }
}
