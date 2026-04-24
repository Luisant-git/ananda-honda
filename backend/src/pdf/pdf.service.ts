import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

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
      this.logger.warn('Failed to load Honda logo from ' + path.join(process.cwd(), '../frontend/assets/honda-logo.svg'));
      return ''; // Fallback if logo not found
    }
  }

  async generateSalesReceipt(payment: any, systemUser: any): Promise<Buffer> {
    const printDate = new Date();
    const formattedDate = `${printDate.getDate().toString().padStart(2, '0')}-${(printDate.getMonth() + 1).toString().padStart(2, '0')}-${printDate.getFullYear()} ${printDate.toLocaleTimeString('en-US', { hour12: true })}`;
    
    const amountInWords = this.numberToWords(parseInt(payment.recAmt)) + ' Rupees Only.';
    const logoDataUrl = this.getLogoDataUrl();

    // Handling Nested Object Resolution
    const customer = payment.customer || {};
    const paymentModeObj = payment.paymentMode || {};
    const typeOfPaymentObj = payment.typeOfPayment || {};
    const typeOfCollectionObj = payment.typeOfCollection || {};
    const vehicleModelObj = payment.vehicleModel || {};
    const enteredByUser = payment.user || {};

    const htmlContent = `
    <html>
      <head>
        <style>
          @page { size: A4; margin: 0; }
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 14px; }
        </style>
      </head>
      <body>
        <div style="width: 210mm; min-height: 297mm; padding: 20px; box-sizing: border-box;">
          <div style="border: 1px solid #000; padding: 20px; height: 100%; box-sizing: border-box;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 25px;">
              <div style="flex: 1;">
                <h3 style="margin: 0; font-size: 28px; font-weight: bold; margin-bottom: 15px;">ANANDA MOTOWINGS PRIVATE LIMITED</h3>
                <p style="margin: 0; font-size: 16px; line-height: 1.6;">Sy no, 53/2 and 53/3, Carvan Compound, Hosur Road, 6th Mile,<br>Near Silk board Junction, Bomannahalli, Bengaluru,<br>Bengaluru Urban, Karnataka, 560068<br><strong>Contact No :</strong> +919071755550<br><strong>GSTIN:</strong> 29ABBCA7185M1Z2</p>
              </div>
              <div style="margin-left: 20px;">
                ${logoDataUrl ? `<img src="${logoDataUrl}" alt="Honda Logo" style="width: 120px; height: 90px;" />` : ''}
              </div>
            </div>

            <div style="text-align: center; color: #000; background: white; padding: 15px; margin-bottom: 30px; font-size: 24px; border: 3px solid #000;">
              <strong>RECEIPT</strong>
            </div>
            
            <table style="width: 100%; border-spacing: 0; gap: 15px; margin-bottom: 25px; font-size: 16px;">
              <tr>
                <td style="padding: 5px;"><strong>Customer ID:</strong> ${customer.custId || 'N/A'}</td>
                <td style="padding: 5px;"><strong>Date:</strong> ${new Date(payment.date).toLocaleDateString('en-GB')}</td>
              </tr>
              <tr>
                <td style="padding: 5px;"><strong>To:</strong> ${customer.name || 'N/A'}</td>
                <td style="padding: 5px;"><strong>Receipt No:</strong> ${payment.receiptNo}</td>
              </tr>
              <tr>
                <td style="padding: 5px;"><strong>Address:</strong> ${customer.address || 'N/A'}</td>
                <td style="padding: 5px;"><strong>Payment Towards:</strong> ${typeOfCollectionObj.typeOfCollect || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 5px;"><strong>Mobile No:</strong> ${customer.contactNo || 'N/A'}</td>
                <td style="padding: 5px;"><strong>Vehicle Model:</strong> ${vehicleModelObj.model || 'N/A'}</td>
              </tr>
            </table>
            
            <p style="margin: 25px 0; font-size: 16px;">We thankfully acknowledge the receipt of your payment towards for Collection - ${typeOfCollectionObj.typeOfCollect || 'N/A'}</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 16px;">
              <tr>
                <td style="border: 1px solid #000; padding: 10px; font-weight: bold; width: 50%;">Received Amount:</td>
                <td style="border: 1px solid #000; padding: 10px; font-weight: bold; width: 50%;">REMARKS</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 10px; text-align: center;">₹${payment.recAmt}<br>${amountInWords}</td>
                <td style="border: 1px solid #000; padding: 10px; text-align: center;">${payment.remarks || 'N/A'}</td>
              </tr>
            </table>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 16px;">
              <div><strong>Mode Of Payment:</strong> ${paymentModeObj.paymentMode || 'N/A'}</div>
              <div><strong>Customer Opting ${paymentModeObj.paymentMode || ''}</strong></div>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 16px;">
              <div><strong>Ref No:</strong> ${payment.refNo || 'N/A'}</div>
              <div style="margin-top: 5px;">${typeOfPaymentObj.typeOfMode || 'N/A'}</div>
            </div>
            
            <div style="border: 1px solid #000; padding: 15px; margin-bottom: 30px; font-size: 14px;">
              <div>Issued Subject to Realisation of Cheque.</div>
              <div>Price ruling at the time of delivery will be charged.</div>
              <div>Any refund through cheques only within 25 working days.</div>
              <div>Subject To BANGALORE Jurisdiction.</div>
            </div>
            
            <div style="text-align: right; margin-bottom: 40px; margin-top: 20px; font-size: 16px;">
              <strong>Received and Verified By</strong>
            </div>
            
            <div style="text-align: right; margin-bottom: 20px;">
              <div style="margin-top: 60px; font-size: 16px;"><strong>Authorised Signatory with Seal</strong></div>
            </div>
            
            <div style="font-size: 10px; text-align: center; border-top: 1px solid #000; padding-top: 10px; margin-top: 20px;">
              <strong>Entered by:</strong> ${enteredByUser.username || 'System'} &nbsp;&nbsp; <strong>Printed by:</strong> ${systemUser?.username || 'Automated System'} &nbsp;&nbsp; <strong>Printed on:</strong> ${formattedDate}
            </div>
          </div>
        </div>
      </body>
    </html>
    `;

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

    const htmlContent = `
    <html>
      <head>
        <style>
          @page { size: A4; margin: 0; }
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 14px; }
        </style>
      </head>
      <body>
        <div style="width: 210mm; min-height: 297mm; padding: 20px; box-sizing: border-box;">
          <div style="border: 1px solid #000; padding: 20px; height: 100%; box-sizing: border-box;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 25px;">
              <div style="flex: 1;">
                <h3 style="margin: 0; font-size: 28px; font-weight: bold; margin-bottom: 15px;">ANANDA MOTOWINGS PRIVATE LIMITED</h3>
                <p style="margin: 0; font-size: 16px; line-height: 1.6;">Sy no, 53/2 and 53/3, Carvan Compound, Hosur Road, 6th Mile,<br>Near Silk board Junction, Bomannahalli, Bengaluru,<br>Bengaluru Urban, Karnataka, 560068<br><strong>Contact No :</strong> +919071755550<br><strong>GSTIN:</strong> 29ABBCA7185M1Z2</p>
              </div>
              <div style="margin-left: 20px;">
                 ${logoDataUrl ? `<img src="${logoDataUrl}" alt="Honda Logo" style="width: 120px; height: 90px;" />` : ''}
              </div>
            </div>

            <div style="text-align: center; color: #000; background: white; padding: 15px; margin-bottom: 30px; font-size: 24px; border: 3px solid #000;">
              <strong>SERVICE RECEIPT</strong>
            </div>
            
            <table style="width: 100%; border-spacing: 0; gap: 15px; margin-bottom: 25px; font-size: 16px;">
              <tr>
                <td style="padding: 5px;"><strong>Customer ID:</strong> ${customer.custId || 'N/A'}</td>
                <td style="padding: 5px;"><strong>Date:</strong> ${new Date(payment.date).toLocaleDateString('en-GB')}</td>
              </tr>
              <tr>
                <td style="padding: 5px;"><strong>To:</strong> ${customer.name || 'N/A'}</td>
                <td style="padding: 5px;"><strong>Receipt No:</strong> ${payment.receiptNo}</td>
              </tr>
              <tr>
                <td style="padding: 5px;"><strong>Address:</strong> ${customer.address || 'N/A'}</td>
                <td style="padding: 5px;"><strong>Payment Towards:</strong> ${typeOfCollectionObj.typeOfCollect || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 5px;"><strong>Mobile No:</strong> ${customer.contactNo || 'N/A'}</td>
                <td style="padding: 5px;"><strong>Vehicle Model:</strong> ${vehicleModelObj.model || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 5px;"><strong>Job Card Number:</strong> ${payment.jobCardNumber || 'N/A'}</td>
                <td style="padding: 5px;"></td>
              </tr>
            </table>
            
            <p style="margin: 25px 0; font-size: 16px;">We thankfully acknowledge the receipt of your payment towards for Collection - ${typeOfCollectionObj.typeOfCollect || 'N/A'}</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 16px;">
              <tr>
                <td style="border: 1px solid #000; padding: 10px; font-weight: bold; width: 50%;">Received Amount:</td>
                <td style="border: 1px solid #000; padding: 10px; font-weight: bold; width: 50%;">REMARKS</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 10px; text-align: center;">₹${payment.recAmt}<br>${amountInWords}</td>
                <td style="border: 1px solid #000; padding: 10px; text-align: center;">${payment.remarks || 'N/A'}</td>
              </tr>
            </table>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 16px;">
              <div><strong>Mode Of Payment:</strong> ${paymentModeObj.paymentMode || 'N/A'}</div>
              <div><strong>Customer Opting ${paymentModeObj.paymentMode || ''}</strong></div>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 16px;">
              <div><strong>Ref No:</strong> ${payment.refNo || 'N/A'}</div>
              <div style="margin-top: 5px;">${typeOfPaymentObj.typeOfMode || 'N/A'}</div>
            </div>
            
            <div style="border: 1px solid #000; padding: 15px; margin-bottom: 30px; font-size: 14px;">
              <div>Issued Subject to Realisation of Cheque.</div>
              <div>Price ruling at the time of delivery will be charged.</div>
              <div>Any refund through cheques only within 25 working days.</div>
              <div>Subject To BANGALORE Jurisdiction.</div>
            </div>
            
            <div style="text-align: right; margin-bottom: 40px; margin-top: 20px; font-size: 16px;">
              <strong>Received and Verified By</strong>
            </div>
            
            <div style="text-align: right; margin-bottom: 20px;">
              <div style="margin-top: 60px; font-size: 16px;"><strong>Authorised Signatory with Seal</strong></div>
            </div>
            
            <div style="font-size: 10px; text-align: center; border-top: 1px solid #000; padding-top: 10px; margin-top: 20px;">
              <strong>Entered by:</strong> ${enteredByUser.username || 'System'} &nbsp;&nbsp; <strong>Printed by:</strong> ${systemUser?.username || 'Automated System'} &nbsp;&nbsp; <strong>Printed on:</strong> ${formattedDate}
            </div>
          </div>
        </div>
      </body>
    </html>
    `;

    return this.generatePdfFromHtml(htmlContent);
  }

  private async generatePdfFromHtml(htmlContent: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdfUint8Array = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' }
      });
      
      return Buffer.from(pdfUint8Array);
    } finally {
      await browser.close();
    }
  }
}
