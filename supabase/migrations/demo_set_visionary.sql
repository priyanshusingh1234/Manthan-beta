-- DEMO: Set all users to Visionary league (250 monthly points) for current month
UPDATE public.profiles
SET 
  monthly_points = 250,
  monthly_points_month = TO_CHAR(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM')
WHERE is_teacher = false OR is_teacher IS NULL;
