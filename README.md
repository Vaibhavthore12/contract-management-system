# Contract Management Platform

A full-stack Contract Management Platform built with Next.js 16, featuring blueprint templates, contract creation, and lifecycle management with strict state enforcement.

🔗 **Live Demo:** [contract-management-system-opal.vercel.app](https://contract-management-system-opal.vercel.app)

📚 **API Docs:** [contract-management-system-opal.vercel.app/api-docs](https://contract-management-system-opal.vercel.app/api-docs)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Vaibhavthore12/contract-management-system.git
cd contract-management-system

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Initialize the database
npx prisma db push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env` file with the following variables:

```env
# PostgreSQL Database (Neon recommended)
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
DIRECT_URL="postgresql://user:password@host/database?sslmode=require"
```

## ☁️ Deployment

### Vercel + Neon PostgreSQL (Recommended)

1. **Create a Neon Database:**
   - Go to [neon.tech](https://neon.tech) and create a free account
   - Create a new project and copy the connection strings

2. **Deploy to Vercel:**
   ```bash
   npx vercel
   ```

3. **Add Environment Variables in Vercel:**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add `DATABASE_URL` (pooled connection string)
   - Add `DIRECT_URL` (direct/unpooled connection string)

4. **Deploy to Production:**
   ```bash
   npx vercel --prod
   ```

### Docker Deployment

Run locally with Docker:

```bash
# Using docker-compose with local PostgreSQL
docker-compose up -d

# Or build and run standalone
docker build -t contract-management .
docker run -p 3000:3000 -e DATABASE_URL="your-db-url" contract-management
```

## 📋 Features

### Blueprint Management
- Create reusable contract templates
- Supported field types: **Text**, **Date**, **Signature**, **Checkbox**
- Each field stores type, label, and position
- Blueprints cannot be modified once contracts exist

### Contract Creation
- Select from existing blueprints
- Fill in field values during creation
- Contracts inherit all blueprint fields

### Lifecycle Management
Contracts follow a strict lifecycle with enforced transitions:

```
Created → Approved → Sent → Signed → Locked
    ↓         ↓        ↓
  Revoked  Revoked  Revoked
```

- **Created**: Initial state, editable
- **Approved**: Approved by reviewer
- **Sent**: Sent to signee
- **Signed**: Signed by signee
- **Locked**: Final, immutable state
- **Revoked**: Cancelled, terminal state

### Dashboard
- Contract statistics (Total, Active, Signed)
- Filterable contracts table (All, Active, Pending, Signed)
- Quick actions for lifecycle transitions
- Blueprint count

## 🏗️ Architecture

### Tech Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| Frontend | Next.js 16 (App Router) | Full-stack React framework with server components |
| Backend | Next.js API Routes | RESTful API in same codebase |
| Database | PostgreSQL + Prisma | Production-ready, relational model, type-safe ORM |
| Hosting | Vercel + Neon | Serverless deployment with managed PostgreSQL |
| Styling | TailwindCSS 4 | Utility-first CSS, rapid development |
| Language | TypeScript | Type safety across frontend and backend |

### Project Structure

```
contract-management-system/
├── app/
│   ├── api/
│   │   ├── blueprints/        # Blueprint CRUD endpoints
│   │   └── contracts/         # Contract + lifecycle endpoints
│   ├── blueprints/            # Blueprint pages
│   ├── contracts/             # Contract pages
│   ├── page.tsx               # Dashboard
│   └── layout.tsx             # Root layout with sidebar
├── components/                 # Reusable UI components
├── lib/
│   ├── db.ts                  # Prisma client singleton
│   ├── lifecycle.ts           # State machine logic
│   └── types.ts               # TypeScript definitions
├── prisma/
│   └── schema.prisma          # Database schema
└── package.json
```

### Database Schema

```mermaid
erDiagram
    Blueprint {
        string id PK
        string name
        string description
        datetime createdAt
    }
    BlueprintField {
        string id PK
        string blueprintId FK
        string type
        string label
        int positionX
        int positionY
        int order
    }
    Contract {
        string id PK
        string blueprintId FK
        string name
        string status
        datetime createdAt
    }
    ContractFieldValue {
        string id PK
        string contractId FK
        string blueprintFieldId FK
        string value
    }
    Blueprint ||--o{ BlueprintField : has
    Blueprint ||--o{ Contract : generates
    Contract ||--o{ ContractFieldValue : contains
```

## 🔌 API Reference

### Blueprints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/blueprints` | List all blueprints |
| POST | `/api/blueprints` | Create blueprint |
| GET | `/api/blueprints/:id` | Get blueprint by ID |
| PUT | `/api/blueprints/:id` | Update blueprint |
| DELETE | `/api/blueprints/:id` | Delete blueprint |

### Contracts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contracts` | List contracts (with ?filter=) |
| POST | `/api/contracts` | Create contract from blueprint |
| GET | `/api/contracts/:id` | Get contract details |
| PUT | `/api/contracts/:id` | Update field values |
| POST | `/api/contracts/:id/transition` | Transition status |
| GET | `/api/contracts/:id/transition` | Get allowed transitions |

### Request/Response Examples

**Create Blueprint:**
```json
POST /api/blueprints
{
  "name": "Employment Agreement",
  "description": "Standard employment contract",
  "fields": [
    { "type": "text", "label": "Employee Name", "positionX": 0, "positionY": 0, "order": 0 },
    { "type": "date", "label": "Start Date", "positionX": 0, "positionY": 1, "order": 1 },
    { "type": "signature", "label": "Employee Signature", "positionX": 0, "positionY": 2, "order": 2 }
  ]
}
```

**Transition Contract:**
```json
POST /api/contracts/:id/transition
{
  "targetStatus": "approved"
}
```

## 🧪 Testing

### Unit Tests

The project includes 68 unit tests covering lifecycle logic and validation:

```bash
npm test             # Run all tests
npm run test:watch   # Watch mode
npm run test:coverage # With coverage report
```

**Test Coverage:**
| Test Suite | Tests | Description |
|-----------|-------|-------------|
| `lifecycle.test.ts` | 35+ | State machine transitions, terminal states |
| `types.test.ts` | 30+ | Status filters, field types, validation |

### Manual Testing Flow

1. **Create Blueprint**: Navigate to Blueprints → New Blueprint → Add fields → Save
2. **Create Contract**: Navigate to Contracts → New Contract → Select blueprint → Fill values → Create
3. **Test Lifecycle**:
   - Click Approve → status changes to "Approved"
   - Click Send → status changes to "Sent"
   - Click Sign → status changes to "Signed"
   - Click Lock → status changes to "Locked" (no more actions)
4. **Test Invalid Transitions**: Try Revoke on a Locked contract (should fail)

## 📦 Scripts

```bash
# Development
npm run dev          # Start dev server

# Testing
npm test             # Run unit tests
npm run test:watch   # Watch mode
npm run test:coverage # With coverage

# Production
npm run build        # Build for production
npm start            # Start production server

# Database
npx prisma db push   # Push schema to database
npx prisma generate  # Generate Prisma client
npx prisma studio    # Open database GUI
```

## 🔮 Future Enhancements

- [ ] User authentication and roles (approver vs signer)
- [ ] PDF export of contracts
- [ ] Email notifications on status changes
- [ ] Audit trail / history log
- [ ] Drag-and-drop field positioning
- [ ] Digital signature with canvas drawing

## 📄 License

MIT
