import Docxtemplater from 'docxtemplater';
import * as fs from 'fs';
import { JSDOM } from 'jsdom';
import * as libre from 'libreoffice-convert';
import * as path from 'path';
import PizZip from 'pizzip';
import { promisify } from 'util';
import { DOMParser, XMLSerializer } from 'xmldom';
import { Injectable, Logger } from '@nestjs/common';

import { convertHtmlToOXml, getAllFilePaths, removeRedundantTagsAtEnd } from 'src/shared/utils';
import { DocxBaseTemplate } from 'src/export/docx/base.template';
import { OfferDocxTemplate } from 'src/export/docx/offer.template';
import { InvoiceDocxTemplate } from 'src/export/docx/invoice.template';
import { ProjectDocxTemplate } from 'src/export/docx/project.template';
import { BbitQRBillGenerator, IBbitQRBill } from '@bbitgmbh/bbit.swiss-qr-bill';
import { EExportService, DOCX_TEMPLATES_FOLDER_PATH } from 'src/shared/constants/export.constants';

@Injectable()
export class ExportFileService {
  private readonly convert;
  private readonly logger;
  private readonly docxTemplateDir;
  private readonly templateClass;

  constructor(service: EExportService) {
    this.convert = promisify(libre.convert);
    this.logger = new Logger(ExportFileService.name);
    this.docxTemplateDir = path.join(__dirname, '..', '..', '..', DOCX_TEMPLATES_FOLDER_PATH);

    switch (service) {
      case EExportService.OFFER:
        this.templateClass = new OfferDocxTemplate();
        break;
      case EExportService.INVOICE:
        this.templateClass = new InvoiceDocxTemplate();
        break;
      case EExportService.PROJECT:
        this.templateClass = new ProjectDocxTemplate();
        break;
      default:
        this.templateClass = new DocxBaseTemplate();
        break;
    }
  }

  /**
   * Export a file from a template.
   * @param {Record<string, string>} data - Object containing placeholders and their replacement values.
   * @param {string} docTemplateFilePath - Path to the template file.
   * @param {string} fileType - The target file type (e.g., ".pdf" or ".docx").
   * @returns {Promise<Buffer | null>} A Promise that resolves with the output file path, or null if an error occurred.
   */
  async exportFileFromTemplate(
    data: Record<string, string>,
    docTemplateFilePath: string,
    fileType: string,
  ): Promise<Buffer | null> {
    try {
      // Check if the template file exists
      if (!this.checkTemplateFileExists(docTemplateFilePath)) {
        this.logger.error('Template file does not exist');
        return null;
      }

      const templateFilePath = path.join(this.docxTemplateDir, docTemplateFilePath);
      const templateBuffer = fs.readFileSync(templateFilePath);
      const fileBuffer = await this.generateFromTemplate(templateBuffer, data, fileType);

      return fileBuffer;
    } catch (error) {
      this.logger.error('Error exporting to PDF:', error);
      return null;
    }
  }

  /**
   * Check if the template file exists
   * @param docTemplateFilePath - Path to the template file
   * @returns - Boolean indicating if the file exists
   */
  private checkTemplateFileExists(docTemplateFilePath: string): boolean {
    const filePath = docTemplateFilePath.startsWith('/') ? docTemplateFilePath : `/${docTemplateFilePath}`;
    const getAllTemplateFilePaths = getAllFilePaths(this.docxTemplateDir);

    return getAllTemplateFilePaths.includes(filePath);
  }

  /**
   * Generate a PDF from a DOCX template and replacement data.
   * @param {Buffer} templateBuffer - The DOCX template buffer.
   * @param {Record<string, string>} replacements - Object containing placeholders and their replacement values.
   * @returns {Promise<Buffer>} A Promise that resolves with the PDF buffer.
   */
  async generateFromTemplate(
    templateBuffer: Buffer,
    replacements: Record<string, string>,
    targetFileType: string,
  ): Promise<Buffer> {
    try {
      const validOutputFormats = ['.pdf', '.docx'];

      // Ensure the target file type is valid
      if (!validOutputFormats.includes(targetFileType)) {
        throw new Error(`Invalid target file type. Please use one of: ${validOutputFormats.join(', ')}`);
      }
      // Step 1: Replace non-HTML placeholders
      const docxBufferAfterStep1 = this.replaceNonHtmlPlaceholders(templateBuffer, replacements);

      // Step 2: Convert DOCX to OpenOffice XML format
      const openOfficeBuffer = await this.convertDocument(docxBufferAfterStep1, '.docx', '.xml');

      // Step 3: Add styles to OpenOffice XML
      const styleSheet = this.templateClass.getXmlStyle();
      const openOfficeBufferWithStyles = await this.addStylesToOpenDocXml(
        Buffer.from(openOfficeBuffer as Buffer),
        styleSheet,
      );

      // Step 4: Replace HTML placeholders
      const finalOpenOfficeBuffer = await this.replaceHtmlPlaceholdersInLibreOffice(
        openOfficeBufferWithStyles,
        replacements,
      );

      // Convert the final OpenOffice buffer to a PDF buffer
      const fileBuffer = await this.convertDocument(finalOpenOfficeBuffer, '.xml', targetFileType);

      return fileBuffer;
    } catch (error) {
      throw new Error(`${error}`);
    }
  }

  /**
   * Step 1: Replace non-HTML placeholders using `docxtemplater`.
   * @param {Buffer} templateBuffer - The DOCX template buffer.
   * @param {Record<string, string>} replacements - Object containing non-HTML placeholders and their replacement values.
   * @returns {Buffer} DOCX buffer with non-HTML replacements applied.
   */
  private replaceNonHtmlPlaceholders(templateBuffer: Buffer, replacements: Record<string, string>): Buffer {
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    const processedReplacements: Record<string, string | boolean> = {};
    // Check if the parameter is empty when exports Offer docx and pdf.
    const isParameterEmpty: boolean =
      'parameter_desc' in replacements && typeof replacements['parameter_desc'] == 'string'
        ? replacements['parameter_desc'].trim() === ''
        : true;
    processedReplacements['has_parameter'] = !isParameterEmpty;
    const excludeKeys: string[] = [];
    for (const [key, value] of Object.entries(replacements)) {
      if ((key === 'parameter_desc' || key === 'parameter') && isParameterEmpty) {
        processedReplacements['parameter'] = '{{REDUNDANT}}';
        processedReplacements['parameter_desc'] = '{{REDUNDANT}}';
        continue;
      }
      if (!this.isHtml(value)) {
        processedReplacements[key] = value;
        // Check if the value is empty and the key contains 'break', marking it as redundant to remove later
        if (!value || (typeof value == 'string' && value.trim() === '')) {
          processedReplacements[key] = '{{REDUNDANT}}'; // Placeholder for redundant values, to be removed later
        }
        // Assign empty string for keys that is `break` key and are in the excludeKeys list
        if ((key.includes('break') || excludeKeys.includes(key)) && !value) {
          processedReplacements[key] = '';
        }
      } else {
        processedReplacements[key] = `{${key}}`;
      }
    }
    doc.render(processedReplacements);
    const result = doc.getZip().generate({ type: 'nodebuffer' });

    // Clean up redundant tags in the buffer
    return this.cleanupRedundantTags(result);
  }

  private cleanupRedundantTags(buffer: Buffer): Buffer {
    const zip = new PizZip(buffer);

    const xmlFiles = Object.keys(zip.files).filter((file) => file.endsWith('.xml') && !file.includes('META-INF'));

    xmlFiles.forEach((fileName) => {
      if (zip.files[fileName]) {
        let content = zip.files[fileName].asText();
        // Remove <w:t> tags has content {{REDUNDANT}}
        content = content.replace(
          /<w:p[^>]*>(?:(?!<w:p>).)*?<w:t[^>]*>(?:(?!<\/w:t>).)*?{{REDUNDANT}}(?:(?!<\/w:t>).)*?<\/w:t>(?:(?!<\/w:p>).)*?<\/w:p>/gs,
          '',
        );
        zip.file(fileName, content);
      }
    });

    return zip.generate({ type: 'nodebuffer' });
  }

  /**
   * Converts a DOCX or ODT buffer to the specified format (OpenOffice XML or PDF).
   *
   * @param {Buffer} inputBuffer - The input file buffer (DOCX, ODT, or XML).
   * @param {string} inputFormat - The format of the input file (e.g., ".docx", ".odt", ".xml", ".xlsx").
   * @param {string} targetFormat - The target format for conversion (e.g., ".xml" or ".pdf").
   * @returns {Promise<Buffer>} The converted file buffer.
   */
  public async convertDocument(inputBuffer: Buffer, inputFormat: string, targetFormat: string): Promise<Buffer> {
    try {
      // Ensure the input and target formats are valid
      const validInputFormats = ['.docx', '.odt', '.xml', '.xlsx'];
      const validTargetFormats = ['.xml', '.pdf', '.docx'];
      if (!validInputFormats.includes(inputFormat)) {
        throw new Error(`Invalid input format. Please use one of: ${validInputFormats.join(', ')}`);
      }
      if (!validTargetFormats.includes(targetFormat)) {
        throw new Error(`Invalid target format. Please use one of: ${validTargetFormats.join(', ')}`);
      }

      // Perform conversion using libreoffice-convert
      const resultBuffer = await this.convert(inputBuffer, targetFormat, undefined);

      if (!resultBuffer) {
        throw new Error(`Conversion to ${targetFormat} format failed: Buffer is empty`);
      }

      // Return the converted buffer
      return resultBuffer;
    } catch (error) {
      console.error(`Error converting ${inputFormat} to ${targetFormat} format:`, error);
      throw error;
    }
  }

  /**
   * Detects if the content is HTML.
   * @param {string} content - The content to check.
   * @returns {boolean} True if the content is HTML, false otherwise.
   */
  private isHtml(content: string): boolean {
    const htmlRegex = /<([a-z][\s\S]*?)>/i;
    return htmlRegex.test(content.toString());
  }

  /**
   * Add styles to office:automatic-styles node in OpenOffice XML buffer.
   * @param {Buffer} openOfficeBuffer - The OpenOffice XML buffer.
   * @param {string} styleSheet - The style sheet to add to the OpenOffice XML buffer.
   * @returns {Promise<Buffer>} The modified OpenOffice XML buffer with styles added.
   */
  private async addStylesToOpenDocXml(openOfficeBuffer: Buffer, styleSheet: string): Promise<Buffer> {
    const parser = new DOMParser();
    const serializer = new XMLSerializer();
    const xmlDoc = parser.parseFromString(openOfficeBuffer.toString('utf-8'), 'application/xml');

    const autoStylesElement = xmlDoc.getElementsByTagName('office:automatic-styles')[0];

    if (autoStylesElement) {
      // Parse the new styles into a temporary XML document
      const tempDoc = parser.parseFromString(`<root>${styleSheet}</root>`, 'application/xml');

      // Insert new styles at the top of the stylesElement
      Array.from(tempDoc.documentElement.childNodes)
        .reverse()
        .forEach((node) => {
          if (node.nodeType === 1) {
            // Check for ELEMENT_NODE type (1)
            autoStylesElement.insertBefore(xmlDoc.importNode(node, true), autoStylesElement.firstChild);
          }
        });
    }

    const updatedXml = serializer.serializeToString(xmlDoc);
    return Buffer.from(updatedXml, 'utf-8');
  }

  /**
   * Replace HTML placeholders in the LibreOffice buffer using XML parsing and DOM manipulation.
   * @param {Buffer} libreOfficeBuffer - The LibreOffice buffer after conversion.
   * @param {Record<string, string>} replacements - Object containing HTML placeholders and their replacement values.
   * @returns {Promise<Buffer>} LibreOffice buffer with HTML replacements applied.
   */
  private async replaceHtmlPlaceholdersInLibreOffice(
    libreOfficeBuffer: Buffer,
    replacements: Record<string, string>,
  ): Promise<Buffer> {
    // Convert the LibreOffice buffer to its content as a string
    const libreOfficeContent = libreOfficeBuffer.toString('utf-8');

    // Parse the LibreOffice content as XML
    const xmlDocument = new DOMParser().parseFromString(libreOfficeContent, 'application/xml');

    // Get all <text:p> nodes
    const textPNodes = xmlDocument.getElementsByTagName('text:p');

    // Replace placeholders in <text:p> nodes only
    const replacePlaceholdersInTextPNode = (node: Node) => {
      Array.from(node.childNodes).forEach((childNode) => {
        if (childNode.nodeType === 3) {
          // Text node
          const textNode = childNode as ChildNode;
          for (const [key, value] of Object.entries(replacements)) {
            const placeholderRegex = new RegExp(`{${key}}`, 'g');
            if (textNode.nodeValue && placeholderRegex.test(textNode.nodeValue)) {
              if (this.isHtml(value)) {
                const parentNode = textNode.parentNode as Element;

                if (/(<ul>|<ol>|<li>)/i.test(value.toString())) {
                  const flattenedValue = this.flattenHtml(value.toString());
                  // Split the flattened HTML value by paragraphs
                  let elements = flattenedValue.split(/<p>(.*?)<\/p>/i).filter((el) => el.trim() !== '');
                  // Remove the first and last elements (redundant tag) and reverse the order
                  if (elements[0].trim() === '<body>') {
                    elements = elements.slice(1);
                  }
                  if (elements[elements.length - 1].trim() === '</body>') {
                    elements = elements.slice(0, -1);
                  }
                  elements = elements.reverse();
                  elements.forEach((element) => {
                    let newXmlNode;
                    if (/(<ul>|<ol>|<li>)/i.test(element)) {
                      // Create a list if the element is a list
                      newXmlNode = this.createList(xmlDocument, element);
                      // Insert the new node after the current parent
                      parentNode.parentNode.insertBefore(newXmlNode, parentNode.nextSibling);
                    } else {
                      // Convert non-list HTML to XML
                      const newParentNode = xmlDocument.createElement('text:p');
                      newXmlNode = convertHtmlToOXml(element);
                      // Check if the newXmlNode is a string (have text content and didn't wrap up yet), wrap it in a <text:span> element to apply styles
                      if (newXmlNode.textContent && !newXmlNode.parentNode) {
                        const spanNode = xmlDocument.createElement('text:span');
                        spanNode.setAttribute('text:style-name', 'Normal');
                        spanNode.appendChild(newXmlNode);
                        newXmlNode = spanNode;
                      }
                      newParentNode.appendChild(newXmlNode);
                      // Insert the new node after the current parent
                      parentNode.parentNode.insertBefore(newParentNode, parentNode.nextSibling);
                    }
                  });
                  parentNode.parentNode.removeChild(parentNode);
                } else if (/(<table:table)/i.test(value.toString())) {
                  const parser = new DOMParser();
                  const tableDoc = parser.parseFromString(value.toString(), 'application/xml');
                  const tableElement = tableDoc.documentElement;
                  parentNode.parentNode.replaceChild(xmlDocument.importNode(tableElement, true), parentNode);
                } else if (value.toString().includes('page-break-after: always')) {
                  if (parentNode && parentNode.hasAttribute('text:style-name')) {
                    const pageBreakNode = xmlDocument.createElement('text:p');
                    pageBreakNode.setAttribute('text:style-name', 'PageBreak');
                    parentNode.parentNode.insertBefore(pageBreakNode, parentNode.nextSibling);

                    // Remove the textNode from the parentNode
                    parentNode.removeChild(textNode);
                  }
                } else {
                  // Assign style-name to the parent node based on the key
                  if (key === 'payment_info') {
                    parentNode.setAttribute('text:style-name', 'PaymentInfo');
                  }
                  // Add keys to exclude from line breaks
                  const formattedFragment = convertHtmlToOXml(
                    removeRedundantTagsAtEnd(this.addLineBreak(value.toString())),
                  );
                  parentNode.replaceChild(formattedFragment, textNode);
                }
              } else {
                // Replace placeholder with plain text
                textNode.nodeValue = textNode.nodeValue.replace(placeholderRegex, value.toString());
              }
            }
          }
        }
      });
    };

    // Function to remove <text:span> tags containing placeholders and preserve their text content
    const removeTextSpanTagsWithPlaceholders = (node: Node) => {
      Array.from(node.childNodes).forEach((childNode) => {
        if (childNode.nodeType === 1 && (childNode as Element).tagName === 'text:span') {
          const spanElement = childNode as Element;
          const parentNode = spanElement.parentNode;

          // Check if the <text:span> contains a placeholder
          const placeholderRegex = /\{(\w+)\}/;
          if (spanElement.textContent && placeholderRegex.test(spanElement.textContent)) {
            const match = spanElement.textContent.match(placeholderRegex);
            if (match && replacements[match[1]]) {
              // Move the text content of the <text:span> to the parent node
              while (spanElement.firstChild) {
                parentNode.insertBefore(spanElement.firstChild, spanElement);
              }

              // Remove the <text:span> element
              parentNode.removeChild(spanElement);
            }
          } else {
            // Recursively process child nodes
            removeTextSpanTagsWithPlaceholders(childNode);
          }
        } else if (childNode.nodeType === 1) {
          // Recursively process child nodes
          removeTextSpanTagsWithPlaceholders(childNode);
        }
      });
    };

    // Iterate over all <text:p> nodes, remove <text:span> tags containing placeholders, and replace placeholders
    Array.from(textPNodes).forEach((textPNode) => {
      removeTextSpanTagsWithPlaceholders(textPNode);
      replacePlaceholdersInTextPNode(textPNode);
    });

    // Serialize the modified XML document back to a string
    const serializer = new XMLSerializer();
    const updatedLibreOfficeContent = serializer.serializeToString(xmlDocument);

    // Remove empty <text:p> tags and redundant line breaks on final content
    const cleanedContent = updatedLibreOfficeContent
      .replace(/<text:p\s*\/>/g, '')
      .replace(/<text:p[^>]*>\s*<\/text:p>/g, '')
      .replace(/<text:p[^>]*>\s*<text:line-break\s*\/>\s*<\/text:p>/g, '<text:p></text:p>');

    // Write the updated content back to a buffer
    return Buffer.from(cleanedContent, 'utf-8');
  }

  /**
   * Convert HTML content to OpenOffice XML format.
   * @param {string} htmlContent - The HTML content to convert.
   * @returns {string} The OpenOffice XML node.
   */
  private flattenHtml(htmlFragment: string): string {
    const htmlContent = `<html><body>${htmlFragment}</body></html>`;

    // Parse the HTML content using JSDOM in Node.js or DOMParser in browser
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    // Array to store flattened elements
    const elements: string[] = [];

    // Recursive function to flatten elements
    function flattenElements(node: Node) {
      if (node.nodeType === dom.window.Node.TEXT_NODE) {
        elements.push(`<p>${node.textContent}</p>`);
      } else if (node.nodeType === dom.window.Node.ELEMENT_NODE) {
        const element = node as HTMLElement;

        // Retain the element's HTML, including its structure
        elements.push(element.outerHTML);
      }
    }

    // Start flattening from the <body> element
    flattenElements(document.body);

    // Reverse the elements to correct the order and join them with line breaks
    return elements.join('\n');
  }

  /**
   * Create a list from an HTML fragment.
   * @param {XMLDocument} xmlDocument The XML document to create the list in.
   * @param {string} htmlFragment The HTML fragment to convert to a list.
   * @returns {HTMLElement} The <text:list> element containing the list items.
   */
  private createList(xmlDocument: XMLDocument, htmlFragment: string): HTMLElement {
    // Parse the HTML fragment as XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(htmlFragment, 'application/xml');

    // Find the top-level list
    const topList = xmlDoc.getElementsByTagName('ul')[0] || xmlDoc.getElementsByTagName('ol')[0];

    // Determine if this is an ordered list
    const isOrderedList = topList && topList.tagName.toLowerCase() === 'ol';

    // Create the root list element
    const rootList = xmlDocument.createElement('text:list');
    rootList.setAttribute('text:style-name', isOrderedList ? 'OL1' : 'L1');

    // Helper function to recursively process list items
    const processList = (xmlList: Element, parentList: HTMLElement) => {
      if (!xmlList || !parentList) return;

      // Determine if this is an ordered list
      const isOrdered = xmlList.tagName.toLowerCase() === 'ol';

      // If this is not the root list, update the style
      if (xmlList !== topList) {
        parentList.setAttribute('text:style-name', isOrdered ? 'OL1' : 'L1');
      }

      // Process all list items
      const items = Array.from(xmlList.getElementsByTagName('li'));

      // Handle case where there are no items
      if (items.length === 0) return;

      // Check if we need to create parent list structures
      // Find minimum indent level to see if we need parent placeholders
      let minIndentLevel = 9999;
      items.forEach((li) => {
        const className = li.getAttribute('class') || '';
        const indentMatch = className.match(/ql-indent-(\d+)/);
        const indentLevel = indentMatch ? parseInt(indentMatch[1], 10) : 0;
        minIndentLevel = Math.min(minIndentLevel, indentLevel);
      });

      let currentList = parentList;
      let prevIndentLevel = 0;
      const listStack: { list: HTMLElement; level: number }[] = [{ list: currentList, level: 0 }];

      // Create parent placeholder structures if needed
      if (minIndentLevel > 0) {
        for (let i = 0; i < minIndentLevel; i++) {
          // Create a placeholder list item for each missing level
          const dummyListItem = xmlDocument.createElement('text:list-item');

          // Create a nested list for the next level
          const nestedList = xmlDocument.createElement('text:list');
          nestedList.setAttribute('text:style-name', isOrdered ? 'OL1' : `L${i + 2}`);

          // Add the nested list to the dummy list item
          dummyListItem.appendChild(nestedList);

          // Add the dummy list item to the current list
          currentList.appendChild(dummyListItem);

          // Update current list and list stack
          currentList = nestedList;
          listStack.push({ list: currentList, level: i + 1 });
        }

        prevIndentLevel = minIndentLevel;
      }

      items.forEach((li) => {
        const className = li.getAttribute('class') || '';
        const indentMatch = className.match(/ql-indent-(\d+)/);
        const indentLevel = indentMatch ? parseInt(indentMatch[1], 10) : 0;

        // Create list item
        const listItem = xmlDocument.createElement('text:list-item');

        // Create and set up paragraph
        const paragraph = xmlDocument.createElement('text:p');
        paragraph.setAttribute('text:style-name', `L${indentLevel + 1}-P`);

        // Process content with formatting
        if (li.hasChildNodes()) {
          // Process all children, not just the first one
          const fragment = xmlDocument.createDocumentFragment();

          // Convert entire li content to HTML string
          const liContentHtml = Array.from(li.childNodes)
            .map((child) => new XMLSerializer().serializeToString(child))
            .join('');

          if (this.isHtml(liContentHtml)) {
            // Check for different formatting types
            const hasBold = /<(strong|b)[^>]*>/i.test(liContentHtml);
            const hasItalic = /<(em|i)[^>]*>/i.test(liContentHtml);
            const hasUnderline = /<u[^>]*>/i.test(liContentHtml);
            const hasLink = /<a [^>]*href=["'][^"']*["'][^>]*>/i.test(liContentHtml);

            // Create text span with appropriate style
            const textSpan = xmlDocument.createElement('text:span');

            // Apply style based on combination of formatting detected
            let styleName = '';

            if (hasLink) {
              if (hasBold && hasItalic) {
                styleName = 'BoldItalicLink';
              } else if (hasBold) {
                styleName = 'BoldLink';
              } else if (hasItalic) {
                styleName = 'ItalicLink';
              } else {
                styleName = 'Link';
              }
            } else if (hasBold && hasItalic && hasUnderline) {
              styleName = 'BoldItalicUnderline';
            } else if (hasBold && hasItalic) {
              styleName = 'BoldItalic';
            } else if (hasBold && hasUnderline) {
              styleName = 'BoldUnderline';
            } else if (hasItalic && hasUnderline) {
              styleName = 'ItalicUnderline';
            } else if (hasBold) {
              styleName = 'Bold';
            } else if (hasItalic) {
              styleName = 'Italic';
            } else if (hasUnderline) {
              styleName = 'Underline';
            } else {
              styleName = `L${indentLevel + 1}-T`;
            }

            textSpan.setAttribute('text:style-name', styleName);

            // Remove formatting tags but preserve links if needed
            let cleanedContent = liContentHtml;
            if (hasLink) {
              // For links, we need to handle URLs separately
              // This is a simple approach - for a more robust solution, consider using a proper HTML parser
              const linkMatch = cleanedContent.match(/<a [^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/i);
              if (linkMatch && linkMatch[1] && linkMatch[2]) {
                const url = linkMatch[1];
                cleanedContent = cleanedContent.replace(/<a [^>]*href=["'][^"']*["'][^>]*>(.*?)<\/a>/gi, '$1');

                // Create a hyperlink element
                const linkElement = xmlDocument.createElement('text:a');
                linkElement.setAttribute('xlink:href', url);
                linkElement.setAttribute('xlink:type', 'simple');

                // Process the link content and remove formatting tags
                cleanedContent = cleanedContent.replace(/<(strong|b|em|i|u)[^>]*>|<\/(strong|b|em|i|u)>/gi, '');
                const linkContent = convertHtmlToOXml(cleanedContent);
                linkElement.appendChild(linkContent);

                textSpan.appendChild(linkElement);
              }
            } else {
              // For non-link content, simply remove all formatting tags
              cleanedContent = cleanedContent.replace(/<(strong|b|em|i|u)[^>]*>|<\/(strong|b|em|i|u)>/gi, '');
              const convertedContent = convertHtmlToOXml(cleanedContent);
              textSpan.appendChild(convertedContent);
            }

            fragment.appendChild(textSpan);
          } else {
            // For plain text content
            const textSpan = xmlDocument.createElement('text:span');
            textSpan.setAttribute('text:style-name', `L${indentLevel + 1}-T`);
            textSpan.appendChild(xmlDocument.createTextNode(li.textContent || ''));
            fragment.appendChild(textSpan);
          }

          paragraph.appendChild(fragment);
        } else {
          // Handle empty li element
          const textSpan = xmlDocument.createElement('text:span');
          textSpan.setAttribute('text:style-name', `L${indentLevel + 1}-T`);
          textSpan.appendChild(xmlDocument.createTextNode(''));
          paragraph.appendChild(textSpan);
        }

        // Build the structure
        listItem.appendChild(paragraph);

        // Handle indentation changes
        if (indentLevel > prevIndentLevel) {
          // Going deeper - create new nested list
          const newList = xmlDocument.createElement('text:list');
          newList.setAttribute('text:style-name', `L${indentLevel + 1}`);

          // If there's a previous item, append to it
          if (currentList.lastChild) {
            currentList.lastChild.appendChild(newList);
          } else {
            currentList.appendChild(newList);
          }

          currentList = newList;
          listStack.push({ list: currentList, level: indentLevel });
        } else if (indentLevel < prevIndentLevel) {
          // Going back up - find the appropriate parent list
          while (listStack.length > 1 && listStack[listStack.length - 1].level > indentLevel) {
            listStack.pop();
          }
          currentList = listStack[listStack.length - 1].list;
        }

        // Add the item to the current list
        if (currentList) {
          currentList.appendChild(listItem);
        }

        prevIndentLevel = indentLevel;

        // Handle nested lists within the current item
        const nestedList = li.getElementsByTagName('ul')[0] || li.getElementsByTagName('ol')[0];
        if (nestedList) {
          const nestedTextList = xmlDocument.createElement('text:list');
          nestedTextList.setAttribute('text:style-name', `L${indentLevel + 2}`);
          processList(nestedList, nestedTextList);
          listItem.appendChild(nestedTextList);
        }
      });
    };

    // Find and process the top-level list
    if (topList) {
      processList(topList, rootList);
    }

    return rootList;
  }

  /**
   * Add line breaks to HTML content, excluding single line break cases like `<p><br/></p>`.
   * @param {string} htmlContent - The HTML content to add line breaks to.
   * @returns {string} The HTML content with line breaks added.
   */
  private addLineBreak(htmlContent: string): string {
    // Remove line breaker <p><br/></p>
    htmlContent = htmlContent.replace(/<p><br\/?><\/p>$/, '');
    return htmlContent.replace(/(<\/p>)(?!<br\/?>)(?<!<p><br\/?><\/p>)/g, '$1<br/>');
  }

  /**
   * Generate QR code PDF file when export Invoice and return it as a Buffer. If an error occurs, reject the promise.
   * @param {IBbitQRBill} data - data for generating QR code PDF file.
   * @returns {Buffer} - The QR code PDF file buffer.
   */
  async generateQrCodePdf(data: IBbitQRBill): Promise<Buffer> {
    try {
      const qr = new BbitQRBillGenerator();
      const pdfBuffer = await qr.generate(data);
      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error('Error generating QR code PDF:', error);
    }
  }
}
