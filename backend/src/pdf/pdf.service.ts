import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as htmlPdf from 'html-pdf-node';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  private numberToWords(num: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (num === 0) return 'Zero';
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + this.numberToWords(num % 100) : '');
    if (num < 100000) return this.numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + this.numberToWords(num % 1000) : '');
    if (num < 10000000) return this.numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + this.numberToWords(num % 100000) : '');
    return this.numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + this.numberToWords(num % 10000000) : '');
  }

  private getLogoDataUrl(): string {
    try {
      const logoPath = path.join(process.cwd(), '../frontend/assets/honda-logo.svg');
      const logoBuffer = fs.readFileSync(logoPath);
      return 'data:image/svg+xml;base64,' + logoBuffer.toString('base64');
    } catch (e) {
      this.logger.warn('Failed to load Honda logo');
      return '';
    }
  }

  async generateSalesReceipt(payment: any, systemUser: any): Promise<Buffer> {
    const printDate = new Date();
    const formattedDate = `${printDate.getDate().toString().padStart(2, '0')}-${(printDate.getMonth() + 1).toString().padStart(2, '0')}-${printDate.getFullYear()} ${printDate.toLocaleTimeString('en-US', { hour12: true })}`;

    const amountInWords = this.numberToWords(parseInt(payment.recAmt)) + ' Rupees Only.';
    const logoDataUrl = this.getLogoDataUrl();

    const customer = payment.customer || {};
    const paymentModeObj = payment.paymentMode || {};
    const typeOfPaymentObj = payment.typeOfPayment || {};
    const typeOfCollectionObj = payment.typeOfCollection || {};
    const vehicleModelObj = payment.vehicleModel || {};
    const enteredByUser = payment.user || {};

    const htmlContent = this.buildReceiptHtml(
      'RECEIPT',
      payment,
      customer,
      paymentModeObj,
      typeOfPaymentObj,
      typeOfCollectionObj,
      vehicleModelObj,
      enteredByUser,
      amountInWords,
      logoDataUrl,
      formattedDate
    );

    return this.generatePdfFromHtml(htmlContent);
  }

  async generateServiceReceipt(payment: any, systemUser: any): Promise<Buffer> {
    const printDate = new Date();
    const formattedDate = `${printDate.getDate().toString().padStart(2, '0')}-${(printDate.getMonth() + 1).toString().padStart(2, '0')}-${printDate.getFullYear()} ${printDate.toLocaleTimeString('en-US', { hour12: true })}`;

    const amountInWords = this.numberToWords(parseInt(payment.recAmt)) + ' Rupees Only.';
    const logoDataUrl = this.getLogoDataUrl();

    const customer = payment.customer || {};
    const paymentModeObj = payment.paymentMode || {};
    const typeOfPaymentObj = payment.typeOfPayment || {};
    const typeOfCollectionObj = payment.typeOfCollection || {};
    const vehicleModelObj = payment.vehicleModel || {};
    const enteredByUser = payment.user || {};

    const htmlContent = this.buildReceiptHtml(
      'SERVICE RECEIPT',
      payment,
      customer,
      paymentModeObj,
      typeOfPaymentObj,
      typeOfCollectionObj,
      vehicleModelObj,
      enteredByUser,
      amountInWords,
      logoDataUrl,
      formattedDate,
      payment.jobCardNumber
    );

    return this.generatePdfFromHtml(htmlContent);
  }

  private buildReceiptHtml(
    title: string,
    payment: any,
    customer: any,
    paymentModeObj: any,
    typeOfPaymentObj: any,
    typeOfCollectionObj: any,
    vehicleModelObj: any,
    enteredByUser: any,
    amountInWords: string,
    logoDataUrl: string,
    formattedDate: string,
    jobCardNumber?: string
  ): string {
    return `
    <html>
      <head>
        <style>
          @page { size: A4; margin: 0; }
          body { margin: 0; padding: 0; font-family: Arial; font-size: 14px; }
        </style>
      </head>
      <body>
        <div style="width:210mm; min-height:297mm; padding:20px; box-sizing:border-box;">
          <div style="border:1px solid #000; padding:20px; height:100%;">

            <div style="display:flex; justify-content:space-between; border-bottom:2px solid #000; padding-bottom:20px;">
              <div>
                <h3>ANANDA MOTOWINGS PRIVATE LIMITED</h3>
                <p>
                  Bengaluru, Karnataka<br>
                  Contact: +919071755550<br>
                  GSTIN: 29ABBCA7185M1Z2
                </p>
              </div>
              ${logoDataUrl ? `<img src="${logoDataUrl}" style="width:120px;height:90px;" />` : ''}
            </div>

            <h2 style="text-align:center; border:2px solid #000; padding:10px;">${title}</h2>

            <table style="width:100%; margin-top:20px;">
              <tr>
                <td><b>Customer:</b> ${customer.name || 'N/A'}</td>
                <td><b>Receipt No:</b> ${payment.receiptNo}</td>
              </tr>
              <tr>
                <td><b>Mobile:</b> ${customer.contactNo || 'N/A'}</td>
                <td><b>Date:</b> ${formattedDate}</td>
              </tr>
              <tr>
                <td><b>Vehicle:</b> ${vehicleModelObj.model || 'N/A'}</td>
                <td><b>Collection:</b> ${typeOfCollectionObj.typeOfCollect || 'N/A'}</td>
              </tr>
              ${jobCardNumber ? `<tr><td><b>Job Card:</b> ${jobCardNumber}</td></tr>` : ''}
            </table>

            <h3>Amount: ₹${payment.recAmt}</h3>
            <p>${amountInWords}</p>

            <p><b>Mode:</b> ${paymentModeObj.paymentMode || 'N/A'}</p>

            <div style="margin-top:40px; text-align:right;">
              Authorized Signatory
            </div>

            <div style="font-size:10px; text-align:center; margin-top:20px;">
              Entered by: ${enteredByUser.username || 'System'} | Printed on: ${formattedDate}
            </div>

          </div>
        </div>
      </body>
    </html>`;
  }

  private async generatePdfFromHtml(htmlContent: string): Promise<Buffer> {
    const file = { content: htmlContent };

    const options = {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0px',
        bottom: '0px',
        left: '0px',
        right: '0px',
      },
    };

    const pdfBuffer = await htmlPdf.generatePdf(file, options);
    return Buffer.from(pdfBuffer);
  }
}