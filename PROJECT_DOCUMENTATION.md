# Dibnow AI - Complete Project Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Three Panel System](#three-panel-system)
4. [Authentication System](#authentication-system)
5. [Payment Integration](#payment-integration)
6. [Dashboard Features](#dashboard-features)
7. [Core Modules & Features](#core-modules--features)
8. [Online Tracking System](#online-tracking-system)
9. [Database Models](#database-models)
10. [API Endpoints](#api-endpoints)
11. [Security Features](#security-features)
12. [Deployment & Setup](#deployment--setup)

---

## Project Overview

**Dibnow AI** is a comprehensive SaaS business management platform designed for repair shops and inventory management with AI-powered insights. The platform serves three distinct user types with tailored dashboards and features:

- **Users (Shop Owners/Managers)**: Manage their repair shops and inventory
- **Admins**: Monitor and manage multiple users and shops
- **SuperAdmins**: Control the entire platform, payments, and system-wide settings

### Key Technologies

**Frontend:**
- React 19.2.3 with TypeScript
- Vite (Build tool)
- React Router 7.1.1 for navigation
- Recharts for data visualization
- TailwindCSS for styling
- Lucide React for icons
- Google Gemini AI integration

**Backend:**
- Node.js/Express.js
- MongoDB with Mongoose ODM
- JWT/OTP Authentication
- Payment Gateway Integrations (Stripe, PayPal, PayFast)
- Real-time features with Socket.io
- Bcrypt for password hashing

**Database:**
- MongoDB Atlas (Cloud)
- Mongoose Schema validation

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + TypeScript)            │
│                                                               │
│  ├─ User Panel         ├─ Admin Panel          ├─ SuperAdmin │
│  ├─ Authentication     ├─ Management Tools     ├─ Platform   │
│  └─ Real-time UI       └─ Analytics            └─ Controls   │
└────────────────────────────┬────────────────────────────────┘
                             │
                    HTTP/REST API Calls
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    Express.js Backend                         │
│                                                               │
│  ├─ Authentication Routes  ├─ Payment Routes                │
│  ├─ User Routes            ├─ Admin Routes                  │
│  ├─ SuperAdmin Routes      ├─ Data Routes                   │
│  └─ Public API             └─ Integration Routes            │
└────────────────────────────┬────────────────────────────────┘
                             │
                    Database Operations
                             │
┌────────────────────────────▼────────────────────────────────┐
│               MongoDB Atlas (Cloud Database)                  │
│                                                               │
│  ├─ Users              ├─ Sales                             │
│  ├─ Repairs            ├─ Inventory                         │
│  ├─ Transactions       ├─ Support Tickets                   │
│  └─ Analytics Data     └─ Activity Logs                     │
└────────────────────────────────────────────────────────────┘
```

---

## Three Panel System

### 1️⃣ USER PANEL (Shop Owner/Manager)

**Purpose:** Manage individual shop operations, inventory, repairs, and customer relationships.

#### Dashboard Features
- Real-time analytics and KPIs
- Quick stats (Total Repairs, Inventory Value, Revenue)
- Recent activities feed
- AI-powered insights and recommendations

#### Core Modules

##### 📦 Inventory Management
- **Add/Edit Inventory**: Create and manage product listings
- **All Stock**: View complete inventory with filters and search
- **Stock Levels**: Monitor low-stock items with alerts
- **Categories & Brands**: Organize products by category and brand
- **Export Reports**: Download inventory reports

##### 🔧 Repair Management
- **Add Repair Job**: Create new repair tickets with customer details
- **Track Repairs**: Monitor repair status in real-time
- **Repair History**: Access past repair records
- **Customer Tracking**: Track customer repair jobs

##### 💰 Sales & Inventory Movement
- **Sell Products**: Process product sales with inventory deduction
- **Sold Items**: View sales history and details
- **Sales Reports**: Generate revenue reports
- **Profit Tracking**: Monitor profit margins

##### 👥 Client Management
- **Manage Clients**: Add and maintain customer database
- **Client History**: View client transaction history
- **Contact Information**: Store and update client details
- **Client Categories**: Organize clients by type

##### 👨‍💼 Team Management
- **Team Members**: Manage shop staff
- **Permissions**: Assign role-based permissions
- **Activity Tracking**: Monitor team member activities
- **Advanced Team Features**: Complex permission structure

##### 💳 Wallet & Transactions
- **Wallet Balance**: View account balance
- **Transaction History**: Complete transaction records
- **Withdrawal Requests**: Request payments
- **Payment Methods**: Manage payment methods

##### 📊 Reports & Analytics
- **Sales Reports**: Revenue and sales analytics
- **Repair Analytics**: Repair turnaround time and completion rates
- **Customer Analytics**: Customer lifetime value and retention
- **Inventory Movement**: Stock turnover analysis
- **Invoices**: Generate and download invoices

##### 🎯 Additional Features
- **Complaints**: File and track complaints
- **Help Center**: Self-service support documentation
- **Support Tickets**: Create support tickets for technical issues
- **User Settings**: Profile and preference management
- **Notifications**: Real-time notifications
- **Activity Feed**: Complete account activity history
- **Quick Actions**: Prayer, Quran, Weather, Tasbeeh, History
- **Pricing Plans**: View available subscription plans

---

### 2️⃣ ADMIN PANEL

**Purpose:** Monitor and manage multiple shops, enforce policies, and maintain platform quality.

#### Dashboard Features
- Multi-shop overview
- System health metrics
- User activity monitoring
- Revenue analytics across all managed shops
- Alert center for critical issues

#### Core Modules

##### 👥 User Management
- **View All Users**: List all users with filters
- **User Details**: View user information and status
- **Approve/Reject Users**: Manage registration queue
- **User Status**: Active, inactive, suspended, expired
- **Export User Lists**: Download user data

##### 📋 System Staff
- **Staff Management**: Manage admin sub-accounts
- **Permission Assignment**: Control admin capabilities
- **Activity Audit**: Track admin actions
- **Role Management**: Define and manage staff roles

##### 🔧 Repair Monitoring
- **All Repairs**: Centralized repair queue
- **Repair Status Tracking**: Monitor completion rates
- **Customer Complaints**: Manage repair-related issues
- **Quality Control**: Oversee repair quality
- **Performance Metrics**: Repair metrics and KPIs

##### 📦 Inventory Oversight
- **All Inventory**: View all systems inventory
- **Stock Monitoring**: System-wide stock levels
- **Inventory Reports**: Detailed inventory analytics
- **Anomaly Detection**: Detect unusual patterns

##### 💰 Sales Analytics
- **All Sales**: System-wide sales dashboard
- **Revenue Tracking**: Total revenue analysis
- **Sales Trends**: Sales pattern analysis
- **Top Performers**: Identify best-selling items and shops

##### 💳 Payment Management
- **All Transactions**: Monitor all payments
- **Payment Status**: Verify payment completions
- **Refund Management**: Process refunds
- **Commission Tracking**: Track admin commissions

##### 📊 Reports & Intelligence
- **Admin Reports**: Comprehensive system reports
- **Audit Logs**: Track all system changes
- **AI Insights**: AI-powered recommendations
- **Security Intelligence**: Monitor suspicious activities
- **Performance Reports**: System performance metrics

##### 🎁 Pricing & Plans
- **Manage Plans**: Create and edit subscription tiers
- **Plan Requests**: Review user plan upgrade requests
- **Pricing Control**: Manage pricing for managed shops
- **Plan Analytics**: Track plan adoption

##### 🎯 System Configuration
- **Currencies**: Manage supported currencies
- **Settings**: Admin-level system settings
- **Announcements**: Create system-wide announcements
- **Feature Flags**: Control feature rollout
- **Support Hub**: Manage support operations
- **Security Settings**: Configure security policies

---

### 3️⃣ SUPERADMIN PANEL

**Purpose:** Oversee entire platform, manage payment processing, and make strategic decisions.

#### Dashboard Features
- Global platform analytics
- Revenue per shop and user
- System health and performance
- Payment status overview
- AI model monitoring

#### Core Modules

##### 👥 User Management
- **Global User Directory**: All platform users
- **User Status Control**: Activate/deactivate users
- **User Analytics**: User growth and retention
- **Bulk Operations**: Mass user management
- **User Segmentation**: Analyze user distribution

##### 🏪 Shop Management
- **Shop Directory**: All shops in the platform
- **Shop Performance**: Individual shop metrics
- **Shop Status**: Manage shop access
- **Shop Tiers**: Assign shop subscription levels
- **Shop Analytics**: Shop's contribution to revenue

##### 💰 Revenue Analytics
- **Revenue Dashboard**: Total platform revenue
- **Revenue Breakdown**: By shop, by plan, by region
- **Revenue Trends**: Historical revenue analysis
- **Growth Metrics**: YoY and MoM comparisons
- **Forecasting**: Revenue projections

##### 💳 Payment Control
- **Payment Gateway Settings**: Configure payment processors
- **Payout Management**: Control shop payouts
- **Commission Settings**: Define commission structures
- **Payment Monitoring**: Track payment flows
- **Dispute Resolution**: Handle payment disputes

##### 🎁 Global Plans & Pricing
- **Plan Management**: Create global pricing tiers
- **Currency Management**: Define global currencies
- **Pricing Optimization**: Monitor pricing effectiveness
- **Plan Analytics**: Track plan performance
- **Custom Pricing**: Create custom tiers for shops

##### 📢 Communications
- **Global Announcements**: Platform-wide messaging
- **Newsletter Management**: Send newsletters to users
- **Alert System**: Configure system alerts
- **Email Campaigns**: Manage email outreach

##### 🚀 Feature Control
- **Feature Flags**: Enable/disable features globally
- **A/B Testing**: Run feature experiments
- **Rollout Management**: Gradual feature deployment
- **Feature Analytics**: Track feature adoption

##### 🔒 Security & Compliance
- **System Audit Logs**: All system-wide actions
- **Security Monitoring**: Detect anomalies
- **Access Control**: Manage platform access
- **Compliance Reports**: Generate compliance docs
- **Data Management**: Data retention and deletion

##### 🤖 AI Monitoring
- **AI Model Performance**: Monitor AI accuracy
- **API Usage Tracking**: Google Gemini API usage
- **Content Moderation**: AI-powered moderation
- **AI Insights**: System AI recommendations

##### 👨‍💼 Admin Management
- **Admin Directory**: All platform admins
- **Admin Permissions**: Control admin capabilities
- **Admin Activity**: Monitor admin actions
- **Admin Approval**: Onboard new admins
- **Admin Tiers**: Manage admin levels

##### 🎯 Global Support
- **Support Tickets**: Unified support queue
- **Escalation Management**: Route critical issues
- **SLA Monitoring**: Track support metrics
- **Knowledge Base**: Maintain help articles

---

## Authentication System

### Authentication Flow

```
User Input (Email/Password)
         ↓
    Validation
         ↓
Credentials Check (MongoDB)
         ↓
Password Verification (Bcrypt)
         ↓
OTP Generation (for verification)
         ↓
OTP Verification
         ↓
JWT Token Generation
         ↓
Token Stored in SessionStorage
         ↓
Access Granted
```

### Authentication Methods

#### 1. **Email/Password Registration**
```
POST /api/auth/register
{
  name: "User Name",
  email: "user@example.com",
  password: "SecurePassword123!"
}
```
- Validates email format and password strength
- Generates and sends OTP to email
- Stores user in MongoDB with hashed password

#### 2. **OTP Verification**
```
POST /api/auth/verify-otp
{
  email: "user@example.com",
  otp: "123456"
}
```
- Validates OTP expiry (usually 10-15 minutes)
- Marks email as verified
- Generates JWT token

#### 3. **JWT Token**
- **Token Structure**: `header.payload.signature`
- **Payload Contains**:
  - User ID
  - Email
  - Role (user/admin/superadmin)
  - Permissions array
  - Expiry time (usually 24 hours)
- **Storage**: SessionStorage (secure, cleared on tab close)
- **Validation**: Checked on every protected route

#### 4. **Team Member Authentication**
```
POST /api/auth/team/login
{
  email: "team.member@company.com",
  password: "Password123!"
}
```
- Separate portal for team members
- Limited permissions based on role
- Shop-specific access control

#### 5. **Forgot Password/Reset**
```
POST /api/auth/forgot-password
{
  email: "user@example.com"
}
```
- Sends reset token to email
- Token expires after 1 hour
- User sets new password without old password

### Security Features

- ✅ **Password Hashing**: Bcrypt with 12 salt rounds
- ✅ **OTP Verification**: 6-digit codes sent via email
- ✅ **JWT Authentication**: Stateless token-based auth
- ✅ **CORS Protection**: Whitelist allowed origins
- ✅ **XSS Protection**: XSS-clean middleware
- ✅ **MongoDB Injection**: Mongo-sanitize middleware
- ✅ **Helmet.js**: Security headers
- ✅ **Rate Limiting**: API rate limiter to prevent brute force
- ✅ **Session Management**: SessionStorage token cleanup

---

## Payment Integration

### Supported Payment Gateways

#### 1. **Stripe Integration**
```
Payment Flow:
User → Stripe Card Input → Stripe API → Webhook → Backend
                                             ↓
                                        Update DB
```

**Routes:**
- `POST /api/stripe/create-payment-intent` - Create payment intent
- `POST /api/stripe/confirm-payment` - Complete payment
- `POST /api/stripe/webhook` - Handle Stripe webhooks

**Features:**
- Credit/Debit card payments
- One-time and recurring payments
- Subscription management
- Invoice generation

#### 2. **PayFast Integration**
```
Payment Flow:
User → PayFast Form → PayFast Gateway → Return to App
                              ↓
                        Update Transaction
```

**Routes:**
- `POST /api/payfast/create-session` - Initiate payment
- `POST /api/payfast/return` - Handle return
- `POST /api/payfast/webhook` - Verify payment

**Features:**
- EFT transfers
- Credit card via PayFast
- Recurring billing
- Instant payment verification

#### 3. **PayPal Integration**
```
Payment Flow:
User → PayPal Button → PayPal Auth → Approval
                           ↓
                    Create Order
                           ↓
                       Capture
```

**Routes:**
- `POST /api/paypal/create-order` - Create PayPal order
- `POST /api/paypal/capture-order` - Capture payment
- `POST /api/paypal/webhook` - Handle webhooks

**Features:**
- PayPal wallet
- Credit/debit cards via PayPal
- Subscription support
- Invoice management

### Transaction Workflow

```json
{
  "transactionId": "TXN-2024-001",
  "userId": "USER-ID",
  "amount": 500,
  "currency": "USD",
  "paymentGateway": "stripe",
  "status": "completed",
  "transactionType": "plan_upgrade",
  "description": "Premium Plan Upgrade",
  "paymentDate": "2024-01-15T10:30:00Z",
  "metadata": {
    "planId": "PLAN-ID",
    "previousPlan": "basic",
    "newPlan": "premium"
  }
}
```

### Payment Status Tracking

- **Pending**: Payment initiated, awaiting processing
- **Processing**: Payment being verified
- **Completed**: Payment successful, user access granted
- **Failed**: Payment declined or error occurred
- **Refunded**: Money returned to customer
- **Disputed**: Customer initiated dispute

### Wallet System

**User Wallet Features:**
- Account balance tracking
- Transaction history (debits/credits)
- Withdrawal requests
- Automatic fund transfers from sales
- Pending balance (awaiting withdrawal)

**Wallet Transactions:**
```json
{
  "walletId": "WALLET-ID",
  "userId": "USER-ID",
  "transactionType": "credit",
  "amount": 150,
  "previousBalance": 500,
  "newBalance": 650,
  "description": "Sales commission",
  "date": "2024-01-15T10:30:00Z"
}
```

### Subscription Plans

**Monthly Subscription Model:**
```
┌─────────────────────────────────────────┐
│ BASIC PLAN (FREE/Low Cost)              │
├─────────────────────────────────────────┤
│ ✓ Basic inventory tracking              │
│ ✓ Limited repair capacity (50/month)    │
│ ✓ Basic reporting                       │
│ ✓ Email support                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ PREMIUM PLAN (Mid-tier)                 │
├─────────────────────────────────────────┤
│ ✓ Advanced inventory management         │
│ ✓ Unlimited repairs                     │
│ ✓ Advanced analytics                    │
│ ✓ API access                            │
│ ✓ Priority support                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ENTERPRISE PLAN (Full Features)         │
├─────────────────────────────────────────┤
│ ✓ Custom workflows                      │
│ ✓ Multi-location support                │
│ ✓ White-label options                   │
│ ✓ Webhook integration                   │
│ ✓ Dedicated account manager             │
└─────────────────────────────────────────┘
```

---

## Dashboard Features

### User Dashboard

**Key Metrics:**
```
┌─────────────┬──────────────┬─────────────┬──────────────┐
│ Total       │ Pending      │ In Progress │ Completed    │
│ Repairs     │ Repairs      │ Repairs     │ Repairs      │
│ 125         │ 8            │ 12          │ 105          │
└─────────────┴──────────────┴─────────────┴──────────────┘

┌─────────────┬──────────────┬─────────────┬──────────────┐
│ Inventory   │ Total Sales  │ This Month  │ Profit       │
│ Value       │ Revenue      │ Revenue     │ Margin       │
│ $45,000     │ $125,500     │ $8,250      │ 32%          │
└─────────────┴──────────────┴─────────────┴──────────────┘
```

**Widgets:**
- Recent Repairs (Last 5)
- Top Selling Products
- Inventory Alerts (Low stock)
- Revenue Trend Chart
- Customer Activity
- Team Performance
- Upcoming Birthdays/Events
- Quick Actions Menu

**Charts & Visualizations:**
- Line Chart: Revenue over time
- Bar Chart: Repairs by status
- Pie Chart: Product category distribution
- Gauge Chart: Performance metrics
- Area Chart: Inventory value trend

### Admin Dashboard

**System Metrics:**
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Active Users │ Total Shops  │ Revenue      │ Transactions │
│ 1,240        │ 156          │ $1,245,000   │ 5,678        │
└──────────────┴──────────────┴──────────────┴──────────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Pending      │ Failed       │ Avg Rating   │ Support      │
│ Repairs      │ Repairs      │ 4.7/5.0      │ Tickets      │
│ 456          │ 12           │ ⭐⭐⭐⭐⭐    │ 89           │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

**Management Tools:**
- User approval queue
- Automated reports generator
- Bulk communication tool
- System health checker
- Alert configuration

### SuperAdmin Dashboard

**Platform Metrics:**
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Total Users  │ Total Admins │ Total Shops  │ Platform     │
│ 12,450       │ 156          │ 2,340        │ Revenue      │
│ ↑15% MoM     │ ↑2% MoM      │ ↑22% MoM     │ $12.5M/month │
└──────────────┴──────────────┴──────────────┴──────────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ API Calls    │ Avg Response │ System       │ Uptime       │
│ 2.5M/day     │ 245ms        │ Health       │ 99.98%       │
│ ↑8% WoW      │ ↓10ms        │ ✅ Good      │ 🟢 Excellent │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

**Strategic Tools:**
- Revenue optimization
- Market analysis
- Feature rollout control
- A/B testing setup
- Performance benchmarking

---

## Core Modules & Features

### 1. Inventory Management System

**Features:**
- **Add Products**: Create inventory with SKU, category, brand
- **Stock Tracking**: Real-time inventory levels
- **Low Stock Alerts**: Automatic notifications at threshold
- **Stock Movement**: Track additions and deductions
- **Multiple Categories**: Organize by type
- **Brand Management**: Link products to brands
- **Batch Operations**: Bulk import/export
- **Stock History**: Complete audit trail

**Data Model:**
```javascript
{
  sku: "PROD-12345",
  name: "iPhone Charger",
  category: "Electronics",
  brand: "Apple",
  quantity: 45,
  unitPrice: 25.00,
  totalValue: 1125.00,
  minStock: 10,
  location: "Shelf A-3",
  supplier: "Supplier Name",
  lastRestocked: "2024-01-10",
  expiry: "2025-01-10",
  image: "url",
  description: "USB-C Lightning Charger",
  status: "active"
}
```

### 2. Repair Management System

**Features:**
- **Create Repair Ticket**: Capture customer device details
- **Status Tracking**: Pending → In Progress → Completed → Delivered
- **Technician Assignment**: Assign to specific technicians
- **Cost Estimation**: Generate repair quotes
- **Timeline Tracking**: Monitor turnaround time
- **Customer Communication**: Updates and notifications
- **Repair History**: Past records for same customer/device
- **Parts Tracking**: Link used parts to repairs

**Repair Workflow:**
```
1. Create Ticket
   └─ Customer info, device details, issues
2. Diagnosis
   └─ Assess damage, estimate cost
3. Approval
   └─ Customer accepts quote
4. Repair
   └─ Technician works on device
5. QC Check
   └─ Quality assurance review
6. Notification
   └─ Customer notified for pickup
7. Delivery
   └─ Customer receives device
8. Feedback
   └─ Rating and feedback collection
```

**Data Model:**
```javascript
{
  ticketNumber: "REP-2024-001",
  customerId: "CUST-123",
  customerName: "John Doe",
  device: {
    type: "iPhone 14",
    description: "Cracked screen",
    imei: "123456789012345",
    color: "Black",
    storage: "256GB"
  },
  issues: [
    "Screen damage",
    "Battery not charging"
  ],
  estimatedCost: 150.00,
  actualCost: 150.00,
  status: "completed",
  assignedTo: "Technician Name",
  createdDate: "2024-01-15",
  completedDate: "2024-01-17",
  daysToComplete: 2,
  parts: [
    { name: "Screen", cost: 80 },
    { name: "Battery", cost: 40 }
  ],
  laborCost: 30,
  rating: 5,
  feedback: "Excellent service"
}
```

### 3. Sales Management System

**Features:**
- **Point of Sale**: Process transactions quickly
- **Inventory Integration**: Auto-deduct sold items
- **Invoice Generation**: Professional invoices
- **Multiple Payment Methods**: Cash, card, wallet
- **Discount Application**: Percentage or fixed discounts
- **Customer Selection**: Link to existing customers
- **Receipt Printing**: Thermal printer support
- **Sales Analytics**: Comprehensive reporting

**Sales Process:**
```
1. Select Customer
   └─ New or existing
2. Add Products
   └─ Scan or select from inventory
3. Apply Discounts
   └─ Percentage or fixed
4. Select Payment Method
   └─ Cash, card, wallet
5. Process Payment
   └─ Create transaction
6. Generate Invoice
   └─ Print or email
7. Update Inventory
   └─ Reduce stock
8. Record Sale
   └─ Complete transaction
```

### 4. Customer/Client Management

**Features:**
- **Customer Database**: Store contact information
- **Purchase History**: Complete transaction records
- **Communication Tracking**: Call logs, messages
- **Customer Segmentation**: VIP, regular, inactive
- **Birthday/Anniversary Tracking**: Send reminders
- **Credit Management**: Track customer credit
- **Documents**: Store customer identification copies
- **Notes**: Internal customer observations

**Customer Data:**
```javascript
{
  customerId: "CUST-123",
  name: "Ahmed Khan",
  email: "ahmed@example.com",
  phone: "03001234567",
  address: "123 Business Street",
  city: "Karachi",
  country: "Pakistan",
  totalPurchases: 2500.00,
  totalRepairs: 8,
  segment: "VIP",
  dateAdded: "2023-06-15",
  lastPurchase: "2024-01-10",
  preferredPaymentMethod: "card",
  notes: "Prefers morning appointments",
  documents: ["ID", "Address verification"]
}
```

### 5. Team Management

**Features:**
- **Role-Based Access**: Admin, Technician, Cashier, Viewer
- **Permission Assignment**: Granular permissions
- **Activity Logging**: Track team member actions
- **Performance Metrics**: Track individual KPIs
- **Shift Management**: Assign working hours
- **Commission Tracking**: Calculate earnings
- **Attendance**: Clock in/out tracking
- **Training Records**: Skill development

**Team Roles:**
```
Owner
├─ Full access
└─ Can manage other users

Manager
├─ Operational control
├─ Staff management
└─ Report access

Technician
├─ Repair scheduling
├─ Work assignments
└─ Quality control

Cashier
├─ Sales processing
├─ Customer interactions
└─ Cash handling

Viewer
├─ Read-only access
├─ Report viewing
└─ No modifications
```

### 6. AI-Powered Features

**Google Gemini Integration:**
- **Smart Recommendations**: Suggest similar products
- **Predictive Repair**: Predict repair costs
- **Customer Insights**: Analyze customer behavior
- **Inventory Optimization**: Suggest stock levels
- **Content Generation**: Auto-generate descriptions
- **Chat Support**: AI chatbot for customer service
- **Analytics Interpretation**: Explain metrics

**AI Use Cases:**
```
1. Repair Cost Estimation
   Input: Device type, damage description
   Output: Cost estimate, parts needed

2. Customer Churn Prediction
   Input: Customer history, purchase patterns
   Output: Risk score, retention recommendations

3. Inventory Optimization
   Input: Sales history, seasonality
   Output: Stock level suggestions

4. Smart Support
   Input: Customer question
   Output: Instant answers or escalation
```

### 7. Reporting & Analytics

**Available Reports:**

1. **Sales Reports**
   - Daily, Weekly, Monthly, Yearly summaries
   - Product-wise sales breakdown
   - Customer-wise sales analysis
   - Payment method distribution
   - Profit margin analysis

2. **Repair Reports**
   - Repair completion rate
   - Average turnaround time
   - Technician performance
   - Cost analysis
   - Customer satisfaction scores

3. **Inventory Reports**
   - Stock movement analysis
   - Slow-moving items
   - High-value inventory
   - Stock aging analysis
   - Supplier performance

4. **Financial Reports**
   - Revenue vs. expenses
   - Profit & loss statement
   - Cash flow analysis
   - Tax reports
   - Commission reports

5. **Customer Reports**
   - New customer acquisition
   - Customer lifetime value
   - Retention rate
   - Segmentation analysis
   - Purchase frequency

### 8. Notification System

**Notification Types:**

1. **Transactional**
   - Order confirmation
   - Payment receipt
   - Repair status updates
   - Delivery notification

2. **System**
   - Low stock alerts
   - Plan expiration notice
   - Action required alerts
   - Maintenance notifications

3. **Marketing**
   - New product launches
   - Promotional offers
   - Anniversary/Birthday wishes
   - Newsletter insights

4. **Real-time**
   - New order alerts
   - Customer feedback
   - Support ticket responses
   - System incidents

**Notification Channels:**
- In-app notifications
- Email notifications
- SMS notifications (if configured)
- Push notifications (mobile)
- Webhook integration

---

## Online Tracking System

### Repair Tracking

**Customer Perspective:**
```
CREATE TICKET
    ↓
    └─ Email with Ticket ID
    
CUSTOMER VIEWS STATUS
    ↓
    ├─ Public tracking page (No login required)
    ├─ Scan QR code on receipt
    └─ Enter ticket number
    
REAL-TIME UPDATES
    ↓
    ├─ Status change notifications
    ├─ Estimated completion time
    ├─ Cost updates
    └─ Ready for pickup alert

DELIVERY NOTIFICATION
    ↓
    └─ Timeline from received to ready
```

**Tracking Page Features:**
```javascript
{
  ticketNumber: "REP-2024-001-ABC",
  customerName: "John Doe",
  deviceName: "iPhone 14 Pro",
  issueDescription: "Cracked display",
  currentStatus: "In Progress",
  currentStep: 3of5,
  timeline: [
    {
      step: 1,
      name: "Device Received",
      date: "2024-01-15 10:30",
      completed: true,
      icon: "checkmark"
    },
    {
      step: 2,
      name: "Diagnosis Complete",
      date: "2024-01-15 14:00",
      completed: true,
      icon: "checkmark"
    },
    {
      step: 3,
      name: "Repair in Progress",
      date: "In Progress",
      completed: false,
      icon: "spinner",
      estimatedCompletion: "2024-01-16 16:00"
    },
    {
      step: 4,
      name: "Quality Check",
      date: "Pending",
      completed: false,
      icon: "clock"
    },
    {
      step: 5,
      name: "Ready for Pickup",
      date: "Pending",
      completed: false,
      icon: "clock"
    }
  ],
  estimatedCost: 150.00,
  finalCost: null,
  readyForPickup: false,
  pickupDeadline: "2024-01-20",
  notifications: [
    "Device received on 2024-01-15",
    "Diagnosis showed screen and battery damage",
    "Repair work started on 2024-01-15"
  ]
}
```

### Sales/Order Tracking

**Order Status Flow:**
```
1. Order Created
   └─ Confirmation sent
   
2. Processing
   └─ Items picked from inventory
   
3. Ready for Pickup/Delivery
   └─ Customer notified
   
4. Completed
   └─ Feedback request sent
```

### Inventory Level Tracking

**Real-time Stock Monitoring:**
```javascript
{
  SKU: "PROD-12345",
  ProductName: "iPhone Charger",
  CurrentStock: 15,
  MinimumThreshold: 10,
  Status: "Low Stock Alert",
  Trend: "Decreasing",
  DaysUntilOutOfStock: 3,
  LastRestocked: "2024-01-10",
  SuggestedRestockQuantity: 50,
  ReorderAutomatically: true,
  LastThredaysSales: [
    { date: "2024-01-13", qty: 5 },
    { date: "2024-01-14", qty: 3 },
    { date: "2024-01-15", qty: 2 }
  ],
  AverageDailySales: 3.33
}
```

### Activity Tracking

**User Activity Log:**
```javascript
{
  logId: "LOG-2024-001",
  userId: "USER-123",
  userName: "Ali Khan",
  action: "Repair Ticket Created",
  actionType: "create",
  resource: "Repair",
  resourceId: "REP-2024-001",
  details: {
    ticketNumber: "REP-2024-001",
    deviceType: "iPhone 14",
    customer: "John Doe"
  },
  ipAddress: "192.168.1.1",
  userAgent: "Chrome 120.0",
  timestamp: "2024-01-15T10:30:00Z",
  status: "success"
}
```

### Performance Metrics Tracking

**Dashboard Metrics:**
```javascript
{
  date: "2024-01-15",
  
  // Repairs
  repairsCreated: 12,
  repairsCompleted: 8,
  repairsInProgress: 4,
  repairCompletionRate: 89,
  averageTurnaroundTime: "2.3 days",
  
  // Sales
  totalSalesAmount: 1250.00,
  totalTransactions: 24,
  averageTransactionValue: 52.08,
  topProduct: "iPhone Charger",
  
  // Inventory
  stockMovement: 34,
  stockValue: 45000.00,
  lowStockItems: 3,
  
  // Customers
  newCustomers: 2,
  repeatCustomerRate: 65,
  totalCustomerInteractions: 45,
  
  // Team
  activeTeamMembers: 5,
  tasksAssigned: 18,
  tasksCompleted: 15
}
```

---

## Database Models

### Core Models

#### User Model
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String ('user', 'admin', 'superadmin'),
  permissions: [String],
  profile: {
    phone: String,
    address: String,
    city: String,
    country: String,
    profileImage: String,
    businessName: String,
    businessType: String
  },
  emailVerified: Boolean,
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  phoneVerified: Boolean,
  status: String ('active', 'inactive', 'suspended'),
  subscriptionPlan: String,
  planExpiryDate: Date,
  paymentMethod: String,
  lastLogin: Date,
  twoFactorEnabled: Boolean,
  preferences: {
    currency: String,
    timezone: String,
    language: String,
    emailNotifications: Boolean,
    smsNotifications: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### Repair Model
```javascript
{
  _id: ObjectId,
  ticketNumber: String (unique),
  shopId: ObjectId (ref: User),
  customerId: ObjectId (ref: Customer),
  device: {
    type: String,
    brand: String,
    model: String,
    color: String,
    imei: String,
    serialNumber: String,
    description: String
  },
  issues: [String],
  estimatedCost: Number,
  actualCost: Number,
  parts: [{
    name: String,
    cost: Number,
    quantity: Number
  }],
  laborCost: Number,
  status: String ('pending', 'in_progress', 'completed', 'delivered'),
  assignedTo: ObjectId (ref: TeamMember),
  assignedDate: Date,
  completionDate: Date,
  customerFeedback: {
    rating: Number (1-5),
    comments: String,
    date: Date
  },
  urgencyLevel: String ('low', 'medium', 'high'),
  warranty: {
    duration: Number (days),
    expiryDate: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### Sale Model
```javascript
{
  _id: ObjectId,
  saleNumber: String (unique),
  shopId: ObjectId (ref: User),
  customerId: ObjectId (ref: Customer),
  items: [{
    productId: ObjectId (ref: Inventory),
    productName: String,
    quantity: Number,
    unitPrice: Number,
    discount: Number,
    tax: Number,
    lineTotal: Number
  }],
  subtotal: Number,
  discount: Number,
  tax: Number,
  total: Number,
  paymentMethod: String,
  paymentStatus: String ('pending', 'paid', 'partial'),
  paymentDate: Date,
  status: String ('completed', 'pending'),
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Inventory Model
```javascript
{
  _id: ObjectId,
  shopId: ObjectId (ref: User),
  sku: String (unique),
  name: String,
  description: String,
  category: String,
  brand: String,
  unitPrice: Number,
  quantity: Number,
  minStock: Number,
  maxStock: Number,
  reorderQuantity: Number,
  supplier: String,
  supplierContact: String,
  location: String,
  image: String,
  barcode: String,
  dateAdded: Date,
  lastRestocked: Date,
  expiryDate: Date,
  status: String ('active', 'discontinued'),
  stockMovement: [{
    date: Date,
    type: String ('add', 'remove', 'adjust'),
    quantity: Number,
    reason: String,
    referenceId: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

#### Transaction Model
```javascript
{
  _id: ObjectId,
  transactionId: String (unique),
  userId: ObjectId (ref: User),
  amount: Number,
  currency: String,
  paymentGateway: String ('stripe', 'paypal', 'payfast'),
  transactionType: String ('payment', 'refund', 'withdrawal'),
  status: String ('pending', 'completed', 'failed', 'refunded'),
  referenceId: String (gateway transaction ID),
  description: String,
  metadata: {
    repairId: ObjectId,
    saleId: ObjectId,
    planId: ObjectId
  },
  paymentMethod: String,
  commission: Number,
  netAmount: Number,
  createdAt: Date,
  completedAt: Date,
  updatedAt: Date
}
```

#### Wallet Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  balance: Number,
  pendingBalance: Number,
  totalEarned: Number,
  totalWithdrawn: Number,
  transactions: [{
    transactionId: ObjectId,
    type: String ('credit', 'debit'),
    amount: Number,
    description: String,
    date: Date
  }],
  withdrawalRequests: [{
    requestId: String,
    amount: Number,
    status: String ('pending', 'approved', 'rejected'),
    requestDate: Date,
    processDate: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

#### Customer Model
```javascript
{
  _id: ObjectId,
  shopId: ObjectId (ref: User),
  name: String,
  email: String,
  phone: String,
  address: String,
  city: String,
  country: String,
  status: String ('active', 'inactive'),
  segment: String ('VIP', 'regular', 'inactive'),
  totalPurchases: Number,
  totalRepairs: Number,
  totalSpent: Number,
  preferredPaymentMethod: String,
  dateAdded: Date,
  lastPurchase: Date,
  lastRepair: Date,
  documents: [String],
  notes: String,
  contacts: [{
    type: String,
    value: String,
    primary: Boolean
  }],
  createdAt: Date,
  updatedAt: Date
}
```

#### TeamMember Model
```javascript
{
  _id: ObjectId,
  shopId: ObjectId (ref: User),
  userId: ObjectId (ref: User),
  name: String,
  email: String,
  phone: String,
  role: String ('manager', 'technician', 'cashier', 'viewer'),
  permissions: [{
    resource: String,
    actions: [String] ('create', 'read', 'update', 'delete')
  }],
  isActive: Boolean,
  joinDate: Date,
  lastActive: Date,
  hoursPerWeek: Number,
  performanceMetrics: {
    repairsCompleted: Number,
    averageRating: Number,
    totalEarned: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### Plan Model
```javascript
{
  _id: ObjectId,
  name: String ('basic', 'premium', 'enterprise'),
  description: String,
  price: Number,
  currency: String,
  billingCycle: String ('monthly', 'yearly'),
  features: [{
    name: String,
    enabled: Boolean,
    limit: Number // null for unlimited
  }],
  limits: {
    repairs: Number,
    inventory: Number,
    customers: Number,
    teamMembers: Number,
    storageGb: Number
  },
  trialDays: Number,
  status: String ('active', 'deprecated'),
  display: {
    order: Number,
    highlighted: Boolean,
    color: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### Activity Log Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  userName: String,
  action: String,
  actionType: String ('create', 'update', 'delete', 'view'),
  resource: String ('Repair', 'Sale', 'Inventory'),
  resourceId: ObjectId,
  details: Object,
  ipAddress: String,
  userAgent: String,
  status: String ('success', 'failure'),
  errorMessage: String,
  timestamp: Date,
  createdAt: Date
}
```

---

## API Endpoints

### Authentication Endpoints

```
POST   /api/auth/register              - Register new user
POST   /api/auth/login                 - Login user
POST   /api/auth/verify-otp            - Verify OTP
POST   /api/auth/resend-otp            - Resend OTP
POST   /api/auth/forgot-password       - Initiate password reset
POST   /api/auth/reset-password        - Reset password
POST   /api/auth/logout                - Logout user
POST   /api/auth/refresh-token         - Refresh JWT token
POST   /api/auth/team/login            - Team member login
POST   /api/auth/two-factor/enable     - Enable 2FA
POST   /api/auth/two-factor/verify     - Verify 2FA code
```

### User Dashboard Endpoints

```
GET    /api/dashboard/user/stats       - Get user stats
GET    /api/dashboard/user/recent      - Get recent activities
GET    /api/dashboard/user/insights    - Get AI insights
```

### Repair Endpoints

```
POST   /api/repairs                    - Create repair
GET    /api/repairs                    - List repairs
GET    /api/repairs/:id                - Get repair detail
PUT    /api/repairs/:id                - Update repair
DELETE /api/repairs/:id                - Delete repair
PUT    /api/repairs/:id/status         - Update repair status
POST   /api/repairs/:id/assign         - Assign technician
GET    /api/repairs/track/:ticketId    - Public tracking
POST   /api/repairs/:id/feedback       - Submit feedback
```

### Sales Endpoints

```
POST   /api/sales                      - Create sale
GET    /api/sales                      - List sales
GET    /api/sales/:id                  - Get sale detail
PUT    /api/sales/:id                  - Update sale
DELETE /api/sales/:id                  - Delete sale
GET    /api/sales/reports/daily        - Daily sales report
GET    /api/sales/reports/monthly      - Monthly sales report
```

### Inventory Endpoints

```
POST   /api/inventory                  - Create inventory item
GET    /api/inventory                  - List inventory
GET    /api/inventory/:id              - Get inventory detail
PUT    /api/inventory/:id              - Update inventory
DELETE /api/inventory/:id              - Delete inventory
PUT    /api/inventory/:id/stock        - Adjust stock
GET    /api/inventory/low-stock        - Get low stock items
POST   /api/inventory/import           - Bulk import
GET    /api/inventory/export           - Export inventory
```

### Customer Endpoints

```
POST   /api/customers                  - Create customer
GET    /api/customers                  - List customers
GET    /api/customers/:id              - Get customer detail
PUT    /api/customers/:id              - Update customer
DELETE /api/customers/:id              - Delete customer
GET    /api/customers/:id/history      - Customer transaction history
```

### Payment Endpoints

```
POST   /api/stripe/create-intent       - Create Stripe payment intent
POST   /api/stripe/confirm             - Confirm payment
POST   /api/stripe/webhook             - Stripe webhook
POST   /api/paypal/create-order        - Create PayPal order
POST   /api/paypal/capture             - Capture payment
POST   /api/paypal/webhook             - PayPal webhook
POST   /api/payfast/session            - Create PayFast session
POST   /api/payfast/return             - Handle return
POST   /api/payfast/webhook            - PayFast webhook
```

### Wallet Endpoints

```
GET    /api/wallet/balance             - Get wallet balance
GET    /api/wallet/transactions        - Get transactions
POST   /api/wallet/withdraw            - Request withdrawal
GET    /api/wallet/withdraw            - Get withdrawal requests
```

### Admin Endpoints

```
GET    /api/admin/dashboard/stats      - Admin dashboard stats
GET    /api/admin/users                - List all users
PUT    /api/admin/users/:id            - Update user
GET    /api/admin/repairs              - All repairs
GET    /api/admin/sales                - All sales
GET    /api/admin/inventory            - All inventory
GET    /api/admin/reports/system       - System reports
POST   /api/admin/announcements        - Create announcement
GET    /api/admin/announcements        - Get announcements
```

### SuperAdmin Endpoints

```
GET    /api/superadmin/dashboard       - Platform dashboard
GET    /api/superadmin/users           - All users
GET    /api/superadmin/shops           - All shops
GET    /api/superadmin/revenue         - Revenue analytics
PUT    /api/superadmin/payments        - Payment settings
GET    /api/superadmin/plans           - Manage plans
PUT    /api/superadmin/currencies      - Manage currencies
GET    /api/superadmin/audit-logs      - System audit logs
POST   /api/superadmin/feature-flags   - Feature toggles
```

---

## Security Features

### 1. Authentication Security

- ✅ **Password Hashing**: Bcrypt with 12 salt rounds
- ✅ **OTP Verification**: Time-limited one-time passwords
- ✅ **JWT Tokens**: Secure stateless authentication
- ✅ **Session Management**: SessionStorage (no XSS vulnerability)
- ✅ **Token Expiry**: 24-hour expiration with refresh mechanism
- ✅ **Forgotten Password**: Secure reset flow with email verification

### 2. Data Protection

- ✅ **MongoDB Injection Prevention**: mongo-sanitize middleware
- ✅ **XSS Protection**: xss-clean middleware
- ✅ **SQL Injection**: Not applicable (NoSQL), but sanitized
- ✅ **CSRF Protection**: CORS configured, headers validated
- ✅ **Data Encryption**: HTTPS/TLS for transit
- ✅ **Password Masking**: Sensitive fields excluded from queries

### 3. Network Security

- ✅ **CORS**: Whitelist allowed origins
- ✅ **Helmet.js**: Security headers (CSP, X-Frame-Options, etc.)
- ✅ **Rate Limiting**: API rate limiter to prevent brute force
- ✅ **HTTPS**: Required for production
- ✅ **IP Whitelisting**: Optional for admin endpoints
- ✅ **DDoS Protection**: Via reverse proxy (Cloudflare/AWS)

### 4. Access Control

- ✅ **Role-Based Access Control (RBAC)**: user, admin, superadmin
- ✅ **Permission-Based Access**: Granular permissions for features
- ✅ **Team Member Restrictions**: Limited access for team users
- ✅ **Endpoint Authorization**: Each API route checks permissions
- ✅ **Resource Ownership**: Users can only access their data
- ✅ **Admin Isolation**: Admins see only assigned shops

### 5. Audit & Monitoring

- ✅ **Activity Logging**: All user actions logged
- ✅ **Admin Action Tracking**: Separate log for admin changes
- ✅ **Payment Audit Trail**: Every transaction tracked
- ✅ **IP Logging**: Detect suspicious access patterns
- ✅ **Failed Login Attempts**: Monitor and alert on multiple failures
- ✅ **API Rate Limiting**: Prevent abuse

### 6. Payment Security

- ✅ **PCI Compliance**: Via payment gateway (not stored locally)
- ✅ **Webhook Verification**: Signed requests from gateways
- ✅ **Idempotent Keys**: Prevent duplicate transactions
- ✅ **Amount Validation**: Server-side verification
- ✅ **Encryption**: Gateway communication is encrypted
- ✅ **No Card Storage**: All handled by payment provider

---

## Deployment & Setup

### Prerequisites

- Node.js 16+ (Backend)
- npm or yarn
- MongoDB Atlas account
- Payment gateway accounts (Stripe, PayPal, PayFast)
- Google Gemini API key (for AI features)

### Backend Setup

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Create .env file
create .env

# 4. Add environment variables
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
PORT=5000
JWT_SECRET=your-secret-key
JWT_EXPIRE=24h

# Stripe
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# PayPal
PAYPAL_CLIENT_ID=your-client-id
PAYPAL_CLIENT_SECRET=your-secret

# PayFast
PAYFAST_MERCHANT_ID=...
PAYFAST_MERCHANT_KEY=...
PAYFAST_PASSPHRASE=...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Google Gemini
GEMINI_API_KEY=your-api-key

# 5. Start server
npm start

# For development with auto-reload
npm run dev
```

### Frontend Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local
VITE_API_URL=http://localhost:5000/api
VITE_GEMINI_API_KEY=your-api-key

# 3. Run development server
npm run dev

# 4. Build for production
npm run build

# 5. Preview production build
npm run preview
```

### Production Deployment

**Backend (Node.js):**
```bash
# Using PM2 for process management
npm install -g pm2

# Start application
pm2 start server.js --name "dibnow-backend"

# Setup auto-restart
pm2 startup
pm2 save

# Monitor
pm2 monitor
```

**Frontend (Vite):**
```bash
# Build
npm run build

# Deploy dist folder to:
# - Vercel
# - Netlify
# - AWS S3 + CloudFront
# - GitHub Pages
# - Custom server
```

### MongoDB Setup

1. Go to MongoDB Atlas (https://www.mongodb.com/cloud/atlas)
2. Create free tier cluster
3. Create database user
4. Get connection string
5. Add to `.env` file

### Payment Gateway Setup

### Stripe Setup
1. Create Stripe account (https://stripe.com)
2. Get API keys from dashboard
3. Add webhook endpoint
4. Configure payment intent settings

**Stripe Webhook URL:**
```
https://your-backend.com/api/stripe/webhook
```

### PayPal Setup
1. Create PayPal developer account
2. Create app for Sandbox and Production
3. Get Client ID and Secret
4. Configure webhook
5. Test in Sandbox mode first

**PayPal Webhook URL:**
```
https://your-backend.com/api/paypal/webhook
```

### PayFast Setup
1. Create PayFast merchant account (South African gateway)
2. Get Merchant ID and Key
3. Generate passphrase
4. Configure return URLs
5. Set webhook endpoint

**PayFast Webhook URL:**
```
https://your-backend.com/api/payfast/webhook
```

### Environment Variables Checklist

```env
# Database
✅ MONGODB_URI
✅ DB_NAME

# Authentication
✅ JWT_SECRET
✅ JWT_EXPIRE
✅ OTP_EXPIRE

# Payment Gateways
✅ STRIPE_PUBLIC_KEY
✅ STRIPE_SECRET_KEY
✅ PAYPAL_CLIENT_ID
✅ PAYPAL_CLIENT_SECRET
✅ PAYFAST_MERCHANT_ID
✅ PAYFAST_MERCHANT_KEY

# Email Service
✅ SMTP_HOST
✅ SMTP_PORT
✅ Email_USER
✅ EMAIL_PASSWORD

# AI Integration
✅ GEMINI_API_KEY

# Frontend
✅ VITE_API_URL
✅ VITE_GEMINI_API_KEY

# Server
✅ PORT
✅ NODE_ENV
✅ CORS_ORIGINS
✅ FRONTEND_URL
```

---

## Workflow Summary

### User Registration & Login Flow
```
1. User opens app
   ↓
2. Clicks "Register"
   ↓
3. Enters email and password
   ↓
4. Backend validates and sends OTP
   ↓
5. User enters OTP
   ↓
6. Account created, JWT token issued
   ↓
7. Redirected to dashboard
   ↓
8. Token stored in SessionStorage
```

### Repair Lifecycle
```
1. Customer brings device
   ↓
2. Create repair ticket with details
   ↓
3. Customer receives tracking ID
   ↓
4. Technician assigned
   ↓
5. Repair work in progress
   ↓
6. Quality check completed
   ↓
7. Customer notified (ready for pickup)
   ↓
8. Device handed to customer
   ↓
9. Payment collected
   ↓
10. Customer feedback requested
```

### Sale Transaction Flow
```
1. Select customer
   ↓
2. Add products to cart
   ↓
3. Apply discounts (if any)
   ↓
4. Select payment method
   ↓
5. Process payment
   ↓
6. Generate invoice
   ↓
7. Update inventory (deduct stock)
   ↓
8. Record sale in database
   ↓
9. Transfer commission to wallet
```

### Payment Processing Flow
```
1. User initiates payment
   ↓
2. Select payment method
   ↓
3. Create payment intent/order
   ↓
4. Redirect to payment gateway
   ↓
5. User completes payment
   ↓
6. Gateway confirms payment
   ↓
7. Webhook received by backend
   ↓
8. Transaction verified and saved
   ↓
9. User access/service activated
   ↓
10. Confirmation email sent
```

---

## Support & Troubleshooting

### Common Issues

**1. MongoDB Connection Error**
```
Error: connect ECONNREFUSED
Solution: Check MONGODB_URI, ensure cluster allows your IP
```

**2. Payment Gateway Errors**
```
Error: Invalid API key
Solution: Verify keys in .env, check gateway account
```

**3. CORS Issues**
```
Error: No 'Access-Control-Allow-Origin' header
Solution: Add frontend URL to CORS_ORIGINS in .env
```

**4. OTP Not Received**
```
Error: Email not sending
Solution: Verify SMTP credentials, check email provider
```

**5. JWT Token Expired**
```
Error: Invalid token
Solution: Token refresh automatic, clear cache and refresh page
```

### Performance Optimization

- ✅ Database indexing on frequently queried fields
- ✅ Pagination for large data sets
- ✅ Caching with Redis (optional)
- ✅ CDN for static assets
- ✅ Image optimization
- ✅ Lazy loading components
- ✅ API response compression

### Monitoring

**Tools to Use:**
- **Monitoring**: Sentry, Datadog, New Relic
- **Logging**: ELK Stack, CloudWatch, Stackdriver
- **Analytics**: Google Analytics, Mixpanel
- **Performance**: Lighthouse, WebPageTest
- **Uptime**: Pingdom, StatusPage.io

---

## Conclusion

Dibnow AI is a comprehensive, multi-tenant SaaS platform that provides complete business management for repair shops and inventory. With its three-tier system (User, Admin, SuperAdmin), robust payment integration, AI-powered features, and comprehensive tracking capabilities, it offers a complete solution for modern business operations.

The platform prioritizes security, scalability, and user experience—making it suitable for both small shops and enterprise deployments.

### Key Achievements

✅ Three independent panel system with role-based access  
✅ Multi-gateway payment integration (Stripe, PayPal, PayFast)  
✅ Real-time repair and order tracking  
✅ AI-powered insights and recommendations  
✅ Comprehensive analytics and reporting  
✅ Team management with granular permissions  
✅ Complete audit logging and activity tracking  
✅ Enterprise-grade security features  
✅ Scalable MongoDB architecture  
✅ Production-ready with deployment guides  

---

**Last Updated:** January 2024  
**Version:** 1.0.0  
**Author:** Development Team  

For questions or support, please contact: support@dibnow.com
