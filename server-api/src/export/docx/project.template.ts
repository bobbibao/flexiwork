import Option from 'src/database/models/options.model';
import { DocxBaseTemplate } from './base.template';

export class ProjectDocxTemplate extends DocxBaseTemplate {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async getStyle(): Promise<Record<string, any>> {
    const defaultStyle = await super.getStyle();
    const options = await Option.findOne({
      where: {
        type: 'project',
      },
      attributes: ['values'],
    });

    return {
      ...defaultStyle,
      ...(options ? (options.get('values') as Record<string, unknown>) : {}),
    };
  }

  public getXmlStyle(): string {
    const baseStyle = super.getXmlStyle();

    // Add custom style here
    const style = `
    <style:style style:name="InvoiceTable" style:family="table">
      <style:table-properties style:rel-width="100%" fo:margin-left="0in" fo:margin-top="0in" fo:margin-bottom="0in" table:align="left" style:writing-mode="page"/>
      <style:text-properties fo:font-size="9pt"/>
    </style:style>
    <style:style style:name="InvoiceTable.A" style:family="table-column">
      <style:table-column-properties style:rel-column-width="70*"/>
    </style:style>
    <style:style style:name="InvoiceTable.B" style:family="table-column">
      <style:table-column-properties style:rel-column-width="30*"/>
    </style:style>
    `;
    return style + baseStyle;
  }
}
