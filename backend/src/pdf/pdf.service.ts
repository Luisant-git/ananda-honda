import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

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

  // ---------------- MAIN RECEIPT (Matches Frontend Design) ----------------
  async generateSalesReceipt(payment: any, systemUser: any): Promise<Buffer> {
    return this.createReceipt(payment, systemUser, 'RECEIPT');
  }

  async generateServiceReceipt(payment: any, systemUser: any): Promise<Buffer> {
    return this.createReceipt(payment, systemUser, 'SERVICE RECEIPT');
  }

  // ---------------- CORE PDF BUILDER (Matches Frontend Template) ----------------
  private async createReceipt(
    payment: any,
    systemUser: any,
    title: string
  ): Promise<Buffer> {

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'A4', 
          margin: 40,
          bufferPages: true
        });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        const customer = payment.customer || {};
        const paymentMode = payment.paymentMode || {};
        const typeOfPayment = payment.typeOfPayment || {};
        const collection = payment.typeOfCollection || {};
        const vehicle = payment.vehicleModel || {};
        const user = payment.user || {};

        const amount = payment.recAmt || 0;
        const amountInWords = this.numberToWords(Math.floor(amount)) + ' Rupees Only.';

        const date = new Date(payment.date || Date.now());
        const formattedDate = date.toLocaleDateString('en-GB');
        
        const printDate = new Date();
        const formattedPrintDate = `${printDate.getDate().toString().padStart(2, '0')}-${(printDate.getMonth() + 1).toString().padStart(2, '0')}-${printDate.getFullYear()} ${printDate.toLocaleTimeString('en-US', { hour12: true })}`;

        // ---------------- HEADER WITH LOGO ----------------
        const pageWidth = doc.page.width - 80; // Account for margins
        const startY = 40;
        
        // Draw outer border
        doc.rect(40, startY, pageWidth, doc.page.height - 80).stroke();

        let currentY = startY + 20;

        // Company Header (Left side)
        const headerTextWidth = pageWidth - 150; // Leave space for logo
        doc.fontSize(18).font('Helvetica-Bold')
           .text('ANANDA MOTOWINGS PRIVATE LIMITED', 60, currentY, { 
             width: headerTextWidth, 
             align: 'left' 
           });
        
        currentY += 30;
        
        doc.fontSize(10).font('Helvetica')
           .text('Sy no, 53/2 and 53/3, Carvan Compound, Hosur Road, 6th Mile,', 60, currentY, { width: headerTextWidth })
           .text('Near Silk board Junction, Bomannahalli, Bengaluru,', 60, currentY + 12, { width: headerTextWidth })
           .text('Bengaluru Urban, Karnataka, 560068', 60, currentY + 24, { width: headerTextWidth })
           .text('Contact No : +919071755550', 60, currentY + 36, { width: headerTextWidth })
           .text('GSTIN: 29ABBCA7185M1Z2', 60, currentY + 48, { width: headerTextWidth });

        // Logo (Right side)
        const logoX = pageWidth - 60;
        const logoY = startY + 20;
        const logoWidth = 80;
        const logoHeight = 60;
        
        // Try to load logo image
        try {
          const logoPath = path.join(__dirname, '../../assets/honda-logo.png');
          if (fs.existsSync(logoPath)) {
            doc.image(logoPath, logoX, logoY, { width: logoWidth, height: logoHeight, fit: [logoWidth, logoHeight] });
          } else {
            // Fallback: Draw placeholder box
            doc.rect(logoX, logoY, logoWidth, logoHeight).stroke();
            doc.fontSize(8).text('HONDA', logoX + 25, logoY + 25, { width: logoWidth });
            doc.text('LOGO', logoX + 25, logoY + 35, { width: logoWidth });
          }
        } catch (error) {
          // Fallback: Draw placeholder box
          doc.rect(logoX, logoY, logoWidth, logoHeight).stroke();
          doc.fontSize(8).text('HONDA', logoX + 25, logoY + 25, { width: logoWidth });
          doc.text('LOGO', logoX + 25, logoY + 35, { width: logoWidth });
        }

        currentY += 75;

        // Horizontal line
        doc.moveTo(60, currentY).lineTo(pageWidth + 20, currentY).stroke();
        currentY += 20;

        // ---------------- TITLE ----------------
        doc.rect(60, currentY, pageWidth - 40, 40).stroke();
        doc.fontSize(16).font('Helvetica-Bold')
           .text(title, 60, currentY + 12, { width: pageWidth - 40, align: 'center' });
        
        currentY += 60;

        // ---------------- CUSTOMER INFO (2 COLUMN GRID) ----------------
        const leftCol = 60;
        const rightCol = pageWidth / 2 + 40;
        const lineHeight = 20;

        doc.fontSize(10).font('Helvetica-Bold').text('Customer ID:', leftCol, currentY);
        doc.font('Helvetica').text(customer.custId || 'N/A', leftCol + 80, currentY);
        
        doc.font('Helvetica-Bold').text('Date:', rightCol, currentY);
        doc.font('Helvetica').text(formattedDate, rightCol + 80, currentY);
        currentY += lineHeight;

        doc.font('Helvetica-Bold').text('To:', leftCol, currentY);
        doc.font('Helvetica').text(customer.name || 'N/A', leftCol + 80, currentY);
        
        doc.font('Helvetica-Bold').text('Receipt No:', rightCol, currentY);
        doc.font('Helvetica').text(payment.receiptNo || 'N/A', rightCol + 80, currentY);
        currentY += lineHeight;

        doc.font('Helvetica-Bold').text('Address:', leftCol, currentY);
        doc.font('Helvetica').text(customer.address || 'N/A', leftCol + 80, currentY, { width: 180 });
        
        doc.font('Helvetica-Bold').text('Payment Towards:', rightCol, currentY);
        doc.font('Helvetica').text(collection.typeOfCollect || 'N/A', rightCol + 100, currentY, { width: 150 });
        currentY += lineHeight;

        doc.font('Helvetica-Bold').text('Mobile No:', leftCol, currentY);
        doc.font('Helvetica').text(customer.contactNo || 'N/A', leftCol + 80, currentY);
        
        doc.font('Helvetica-Bold').text('Vehicle Model:', rightCol, currentY);
        doc.font('Helvetica').text(vehicle.model || 'N/A', rightCol + 100, currentY);
        currentY += lineHeight;

        // Job Card Number (Service only)
        if (payment.jobCardNumber) {
          doc.font('Helvetica-Bold').text('Job Card Number:', leftCol, currentY);
          doc.font('Helvetica').text(payment.jobCardNumber, leftCol + 110, currentY);
          currentY += lineHeight;
        }

        currentY += 10;

        // ---------------- ACKNOWLEDGEMENT TEXT ----------------
        doc.fontSize(10).font('Helvetica')
           .text(`We thankfully acknowledge the receipt of your payment towards for Collection - ${collection.typeOfCollect || 'N/A'}`, 
                 60, currentY, { width: pageWidth - 40, align: 'left' });
        
        currentY += 40;

        // ---------------- AMOUNT TABLE ----------------
        const tableTop = currentY;
        const col1X = 60;
        const col2X = pageWidth / 2 + 40;
        const tableWidth = pageWidth - 40;
        const cellHeight = 30;

        // Table header
        doc.rect(col1X, tableTop, tableWidth / 2, cellHeight).stroke();
        doc.rect(col2X, tableTop, tableWidth / 2, cellHeight).stroke();
        
        doc.fontSize(10).font('Helvetica-Bold')
           .text('Received Amount:', col1X + 10, tableTop + 10)
           .text('REMARKS', col2X + 10, tableTop + 10);

        // Table content
        doc.rect(col1X, tableTop + cellHeight, tableWidth / 2, 60).stroke();
        doc.rect(col2X, tableTop + cellHeight, tableWidth / 2, 60).stroke();
        
        doc.fontSize(10).font('Helvetica')
           .text(`₹${amount}`, col1X + 10, tableTop + cellHeight + 10, { width: tableWidth / 2 - 20, align: 'center' })
           .text(amountInWords, col1X + 10, tableTop + cellHeight + 25, { width: tableWidth / 2 - 20, align: 'center' });
        
        doc.text(payment.remarks || 'N/A', col2X + 10, tableTop + cellHeight + 20, { width: tableWidth / 2 - 20, align: 'center' });

        currentY = tableTop + cellHeight + 80;

        // ---------------- PAYMENT INFO ----------------
        doc.fontSize(10).font('Helvetica-Bold').text('Mode Of Payment:', leftCol, currentY);
        doc.font('Helvetica').text(paymentMode.paymentMode || 'N/A', leftCol + 110, currentY);
        
        doc.font('Helvetica-Bold').text(`Customer Opting ${paymentMode.paymentMode || 'N/A'}`, rightCol + 50, currentY);
        currentY += lineHeight + 5;

        doc.font('Helvetica-Bold').text('Ref No:', leftCol, currentY);
        doc.font('Helvetica').text(payment.refNo || 'N/A', leftCol + 50, currentY);
        
        doc.font('Helvetica').text(typeOfPayment.typeOfMode || 'N/A', rightCol + 100, currentY);
        currentY += 30;

        // ---------------- TERMS & CONDITIONS ----------------
        doc.rect(60, currentY, pageWidth - 40, 60).stroke();
        doc.fontSize(9).font('Helvetica')
           .text('Issued Subject to Realisation of Cheque.', 70, currentY + 5)
           .text('Price ruling at the time of delivery will be charged.', 70, currentY + 18)
           .text('Any refund through cheques only within 25 working days.', 70, currentY + 31)
           .text('Subject To BANGALORE Jurisdiction.', 70, currentY + 44);

        currentY += 80;

        // ---------------- SIGNATURE ----------------
        doc.fontSize(10).font('Helvetica-Bold')
           .text('Received and Verified By', 60, currentY, { width: pageWidth - 40, align: 'right' });
        
        currentY += 80;
        
        doc.text('Authorised Signatory with Seal', 60, currentY, { width: pageWidth - 40, align: 'right' });

        // ---------------- FOOTER ----------------
        const footerY = doc.page.height - 60;
        doc.moveTo(60, footerY - 10).lineTo(pageWidth + 20, footerY - 10).stroke();
        
        doc.fontSize(8).font('Helvetica')
           .text(`Entered by: ${user.username || 'N/A'}     Printed by: ${systemUser?.username || 'System'}     Printed on: ${formattedPrintDate}`, 
                 60, footerY, { width: pageWidth - 40, align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}