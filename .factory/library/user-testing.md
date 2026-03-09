# User Testing

Testing surface: tools, URLs, setup steps, isolation notes, known quirks.

---

## Application Entry Points

### Dev Server
- **URL**: http://localhost:3000
- **Start**: `npm run dev`
- **Port**: 3000

### Routes (planned)
- `/` - Dashboard/Home
- `/login` - Login page
- `/partners` - Partner/Mitra list
- `/partners/:id` - Partner detail
- `/assessments` - Assessment list
- `/assessments/:id` - Assessment detail/take
- `/interviews` - Interview sessions
- `/projects` - Projects list

---

## Testing Tools

### Browser (agent-browser)
Use for:
- Page navigation and rendering
- Form submissions
- Authentication flows
- UI interactions

### curl
Use for:
- API endpoint testing
- Server function verification
- Quick smoke tests

Example:
```bash
curl http://localhost:3000/api/health
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secret"}'
```

---

## Test Data

### Sample Partners (from seed)
- Ahmad Fauzi - ahmad.fauzi@halalin.id
- Siti Rahma - siti.rahma@halalin.id
- Dian Prasetyo - dian.prasetyo@halalin.id

### Sample Project
- Code: SPPG-MABES-2026
- Name: Manajemen Sertifikasi Kepatuhan SPPG Mabes Polri

---

## Known Quirks

### Database
- External PostgreSQL on 103.150.81.71:6647
- May have latency compared to local
- Already has seed data from schema.sql

### TanStack Start
- File-based routing (files in app/routes/ become routes)
- Server functions run server-side only
- Hot reload can be slow on first start
