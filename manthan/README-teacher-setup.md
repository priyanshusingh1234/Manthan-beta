Teacher application: DB & bucket setup

Steps to create the database table and storage bucket required for teacher applications.

1) Create the database table

 - Open your Supabase project → SQL Editor and run the SQL in `manthan/db/teacher_applications.sql`.

2) Create the storage bucket

 - Option A (recommended): Run the helper script locally using your service role key:

```bash
cd manthan
SUPABASE_URL=https://your-project.supabase.co SUPABASE_SERVICE_ROLE_KEY=your_service_role_key node scripts/create_teacher_bucket.js
```

 - Option B: Create the bucket manually from the Supabase Dashboard → Storage → Create a new bucket named `teacher-proofs` (you can set it public or private depending on your policy).

3) Environment

 - Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in `manthan/.env.local` for server-side APIs (do NOT expose this in client code).

4) Verify

 - Visit `/teacher/apply` and submit a test application (proof upload will store file under `teacher-proofs`).
 - Visit `/teacher/dashboard` as an admin (requires `SUPABASE_SERVICE_ROLE_KEY` present on the server) to review.
