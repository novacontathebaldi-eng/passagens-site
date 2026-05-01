-- Drop the existing policy
DROP POLICY IF EXISTS "Anyone can view published excursions" ON "public"."excursions";

-- Recreate the policy with EXISTS clauses for user's reservations and waitlists
CREATE POLICY "Anyone can view published excursions"
ON "public"."excursions"
AS PERMISSIVE
FOR SELECT
TO public
USING (
  (status = 'PUBLISHED'::excursion_status) OR
  (status = 'SOLD_OUT'::excursion_status) OR
  (EXISTS (
    SELECT 1 FROM reservations r
    WHERE r.excursion_id = excursions.id AND r.user_id = auth.uid()
  )) OR
  (EXISTS (
    SELECT 1 FROM waitlist w
    WHERE w.excursion_id = excursions.id AND w.user_id = auth.uid()
  ))
);
