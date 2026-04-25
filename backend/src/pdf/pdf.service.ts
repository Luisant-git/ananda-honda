import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

@Injectable()
export class PdfService {

  // ---------------- NUMBER TO WORDS ----------------
  private numberToWords(num: number): string {
    const ones = ['', 'One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    const tens = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

    if (num === 0) return 'Zero';
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + this.numberToWords(num % 100) : '');
    if (num < 100000) return this.numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + this.numberToWords(num % 1000) : '');
    if (num < 10000000) return this.numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + this.numberToWords(num % 100000) : '');
    return this.numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + this.numberToWords(num % 10000000) : '');
  }

  // ---------------- MAIN RECEIPT ----------------
  async generateSalesReceipt(payment: any, systemUser: any): Promise<Buffer> {
    return this.createPdf(payment, systemUser, 'RECEIPT');
  }

  async generateServiceReceipt(payment: any, systemUser: any): Promise<Buffer> {
    return this.createPdf(payment, systemUser, 'SERVICE RECEIPT', payment.jobCardNumber);
  }

  // ---------------- CORE PDF BUILDER ----------------
  private async createPdf(
    payment: any,
    systemUser: any,
    title: string,
    jobCardNumber?: string
  ): Promise<Buffer> {

    return new Promise((resolve) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const customer = payment.customer || {};
      const paymentMode = payment.paymentMode || {};
      const collection = payment.typeOfCollection || {};
      const vehicle = payment.vehicleModel || {};
      const user = payment.user || {};

      const amount = payment.recAmt || 0;
      const amountInWords = this.numberToWords(Number(amount)) + ' Rupees Only';

      const date = new Date(payment.date || Date.now());
      const formattedDate = date.toLocaleDateString('en-GB');

      // ---------------- HEADER ----------------
      doc.fontSize(16).text('ANANDA MOTOWINGS PRIVATE LIMITED', { align: 'center' });
      doc.moveDown(0.5);

      doc.fontSize(10).text(
        'Bengaluru, Karnataka | +91 90717 55550 | GSTIN: 29ABBCA7185M1Z2',
        { align: 'center' }
      );

      doc.moveDown(2);

      doc.fontSize(14).text(title, { align: 'center', underline: true });

      doc.moveDown(2);

      // ---------------- CUSTOMER INFO ----------------
      doc.fontSize(11);
      doc.text(`Customer: ${customer.name || 'N/A'}`);
      doc.text(`Mobile: ${customer.contactNo || 'N/A'}`);
      doc.text(`Receipt No: ${payment.receiptNo || 'N/A'}`);
      doc.text(`Date: ${formattedDate}`);
      doc.text(`Vehicle: ${vehicle.model || 'N/A'}`);
      doc.text(`Collection: ${collection.typeOfCollect || 'N/A'}`);

      if (jobCardNumber) {
        doc.text(`Job Card: ${jobCardNumber}`);
      }

      doc.moveDown(2);

      // ---------------- AMOUNT ----------------
      doc.fontSize(13).text(`Amount: ₹${amount}`, { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).text(amountInWords);

      doc.moveDown(2);

      // ---------------- PAYMENT INFO ----------------
      doc.text(`Mode: ${paymentMode.paymentMode || 'N/A'}`);
      doc.text(`Reference No: ${payment.refNo || 'N/A'}`);

      doc.moveDown(3);

      // ---------------- SIGNATURE ----------------
      doc.text('Authorized Signatory', { align: 'right' });

      doc.moveDown(2);

      // ---------------- FOOTER ----------------
      doc.fontSize(8).text(
        `Entered by: ${user.username || 'System'} | Printed by: ${systemUser?.username || 'System'} | Printed on: ${new Date().toLocaleString()}`,
        { align: 'center' }
      );

      doc.end();
    });
  }
}