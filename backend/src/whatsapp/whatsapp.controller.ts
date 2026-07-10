import { Controller, Get, Post, Req, Res, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(private prisma: PrismaService, private whatsappService: WhatsappService) {}

  @Get('webhook')
  verifyWebhook(@Req() req: Request, @Res() res: Response) {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'ananda_honda_webhook_token';

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
      if (mode === 'subscribe' && token === verifyToken) {
        this.logger.log('WEBHOOK_VERIFIED');
        return res.status(200).send(challenge);
      } else {
        return res.sendStatus(403);
      }
    }
    return res.sendStatus(400);
  }

  @Post('webhook')
  async handleIncomingMessage(@Req() req: Request, @Res() res: Response) {
    try {
      const body = req.body;
      this.logger.debug(`Incoming webhook body: ${JSON.stringify(body)}`);

      if (body.object === 'whatsapp_business_account') {
        for (const entry of body.entry) {
          for (const change of entry.changes) {
            if (change.value && change.value.messages) {
              for (const message of change.value.messages) {
                const from = message.from; // e.g. "919876543210"
                
                let feedbackText = '';
                
                this.logger.log(`Received WhatsApp message of type: ${message.type} from ${from}`);
                this.logger.debug(`Message payload: ${JSON.stringify(message)}`);

                if (message.type === 'button') {
                  feedbackText = message.button.text;
                } else if (message.type === 'interactive') {
                  const interactive = message.interactive;
                  if (interactive.type === 'button_reply') {
                    feedbackText = interactive.button_reply.title;
                  } else if (interactive.type === 'list_reply') {
                    feedbackText = interactive.list_reply.title;
                  }
                } else if (message.type === 'text') {
                  feedbackText = message.text.body;
                }

                if (feedbackText) {
                  this.logger.log(`Extracted feedback text: "${feedbackText}"`);
                  // Normalize phone number to match the DB
                  let mobileToSearch = from;
                  if (mobileToSearch.startsWith('91') && mobileToSearch.length === 12) {
                    mobileToSearch = mobileToSearch.substring(2); // "9876543210"
                  }
                  
                  // Find the most recent job card for this mobile number
                  const recentJobCard = await this.prisma.serviceJobCard.findFirst({
                    where: {
                      OR: [
                        { mobileNumber: mobileToSearch },
                        { mobileNumber: from }
                      ]
                    },
                    orderBy: {
                      createdAt: 'desc'
                    }
                  });

                  if (recentJobCard) {
                    await this.prisma.serviceJobCard.update({
                      where: { id: recentJobCard.id },
                      data: { feedback: feedbackText }
                    });
                    this.logger.log(`Updated feedback for job card ${recentJobCard.jobCardNumber} to "${feedbackText}"`);
                    
                    try {
                      // Fetch notification numbers and send message
                      const notificationSettings = await this.prisma.feedbackNotificationSetting.findMany();
                      const adminNumbers = notificationSettings.map(setting => setting.mobileNumber).filter(num => num && num.trim() !== '');

                      if (adminNumbers.length > 0) {
                        const isDissatisfied = feedbackText.toLowerCase().includes('dissatisf');
                        
                        let billedDate = 'Unknown Date';
                        if (recentJobCard.closedDate || recentJobCard.createdAt) {
                          const dateObj = new Date(recentJobCard.closedDate || recentJobCard.createdAt);
                          billedDate = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
                        }

                        for (const adminNumber of adminNumbers) {
                          try {
                            if (isDissatisfied) {
                               await this.whatsappService.sendManagerNegativeFeedbackAlert(
                                 adminNumber,
                                 billedDate,
                                 recentJobCard.customerName || 'N/A',
                                 recentJobCard.mobileNumber || 'N/A'
                               );
                            }
                          } catch (err) {
                             this.logger.error(`Failed to notify ${adminNumber}`, err);
                          }
                        }
                      }
                    } catch (notificationError) {
                      this.logger.error('Error sending feedback notifications', notificationError);
                    }
                  } else {
                    this.logger.warn(`Received feedback "${feedbackText}" from ${from}, but no job card found.`);
                  }
                }
              }
            }
          }
        }
        return res.status(200).send('EVENT_RECEIVED');
      } else {
        return res.sendStatus(404);
      }
    } catch (error) {
      this.logger.error('Error handling webhook', error);
      return res.status(500).send('Internal Server Error');
    }
  }
}
