import { DocxBaseTemplate } from './base.template';
import Option from 'src/database/models/options.model';

export class OfferDocxTemplate extends DocxBaseTemplate {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async getStyle(): Promise<Record<string, any>> {
    const defaultStyle = await super.getStyle();
    const options = await Option.findOne({
      where: {
        type: 'offer',
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
    const style = ``;
    return style + baseStyle;
  }
}
