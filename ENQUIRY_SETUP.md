# Ananda Honda - Vehicle Enquiry Management System

## Overview
This system implements a vehicle enquiry management system for Ananda Honda with conditional forms based on enquiry type selection.

## Features
- **Enquiry Type Selection**: Big Wing, Insurance, Accessories, HSRP
- **Conditional Forms**: Different form fields based on enquiry type
- **Executive Management**: Manage sales executives
- **Lead Source Tracking**: Track how customers found Ananda Honda
- **Vehicle Model Integration**: Link enquiries to specific vehicle models

## Setup Instructions

### Backend Setup

1. **Database Migration**
   ```bash
   cd backend
   npx prisma migrate dev --name add-enquiry-system
   ```

2. **Seed Data**
   ```bash
   npm run db:seed
   ```
   This will populate:
   - Executives (Vinushree, Chandana, Jeevitha, etc.)
   - Vehicle Models (Activa, Dio, Shine, etc.)

3. **Start Backend**
   ```bash
   npm run start:dev
   ```

### Frontend Setup

1. **Install Dependencies** (if not already done)
   ```bash
   cd frontend
   npm install
   ```

2. **Start Frontend**
   ```bash
   npm run dev
   ```

## API Endpoints

### Enquiry Management
- `GET /enquiries` - Get all enquiries
- `POST /enquiries` - Create new enquiry
- `GET /enquiries/:id` - Get enquiry by ID
- `PATCH /enquiries/:id` - Update enquiry
- `DELETE /enquiries/:id` - Delete enquiry
- `GET /enquiries/types` - Get enquiry types
- `GET /enquiries/lead-sources` - Get lead sources

### Executive Management
- `GET /executives` - Get all executives
- `POST /executives` - Create new executive
- `GET /executives/:id` - Get executive by ID
- `PATCH /executives/:id` - Update executive
- `DELETE /executives/:id` - Deactivate executive

## Form Flow

### Step 1: Enquiry Type Selection
User selects from:
- Big Wing
- Insurance
- Accessories
- HSRP

### Step 2: Conditional Forms

#### Big Wing Enquiry (Questions 2-6)
- Customer Name
- Mobile Number
- Vehicle Model (Big Wing models)
- Lead Sources
- Executive Assignment (Big Wing executives)

#### Accessories/Insurance/HSRP (Questions 7-10)
- Customer Name
- Mobile Number
- Vehicle Model (Accessories models)
- Executive Assignment (Accessories executives)

## Database Schema

### Enquiry Table
```sql
model Enquiry {
  id              Int         @id @default(autoincrement())
  enquiryType     EnquiryType
  customerName    String
  mobileNumber    String
  vehicleModelId  Int?
  leadSources     String[]
  executiveId     Int?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  vehicleModel    VehicleModel? @relation(fields: [vehicleModelId], references: [id])
  executive       Executive?  @relation(fields: [executiveId], references: [id])
}
```

### Executive Table
```sql
model Executive {
  id        Int      @id @default(autoincrement())
  name      String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  enquiries Enquiry[]
}
```

## Menu Permissions

To enable enquiry management in the menu, update menu permissions to include:
```json
{
  "master": {
    "enquiry_management": true,
    "executive_management": true
  }
}
```

## Usage

1. **Access Enquiry Management**: Navigate to Master > Enquiry Management
2. **Create New Enquiry**: Click "Add New Enquiry"
3. **Select Enquiry Type**: Choose from dropdown (Big Wing, Insurance, etc.)
4. **Fill Form**: Complete the conditional form based on selection
5. **Assign Executive**: Select appropriate executive
6. **Submit**: Save the enquiry

## Executive Assignment Logic

### Big Wing Executives
- Vinushree, Chandana, Jeevitha, Murali, Anusha, Aadharsh, Tejaswini, Punith, Babyrani

### Accessories/Insurance/HSRP Executives
- Amrutha, Sangeetha

## Vehicle Models

### Big Wing Models
- Activa, Activa 125, Dio, Dio 125, Shine 100, Shine 125, SP160, Unicorn, Livo

### Accessories Models
- Activa 110, Activa 125, Dio, Shine 100, Shine (123 cc), SP 125, Unicorn, CB125, Hornet, SP 160

## Lead Sources
- Walk-in
- Phone Call
- Website
- Instagram
- Google Business
- Facebook
- Reference