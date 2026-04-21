Goal: Build and deploy a multi-service system — a background worker that polls a live data source, writes to a
database, and a frontend that displays updates in real time.

Topic: weather monitoring for select cities (NYC, Tokyo, Buenos Aires, Mexico City, Berlin) using Open-Meteo.

Architecture: External Data Source → Background Worker polling Open-Meteo (Railway) → Database (Supabase + Realtime) → Frontend (Next.js + Tailwind on Vercel)

Characteristics:
- Monorepo
- Frequent local commits. I will push to Github later. 
- Supabase MCP to create tables. Realtime feature so that worker can write to the tables. Include auth and RLS policies. 
- Data visualization.
- Worker: Node.js script that polls data source, parses the response and updates Supabase. 
- Frontend: Next.js app that reads from Supabase, subscribes to Realtime updates, and displays user-specific data after login. 