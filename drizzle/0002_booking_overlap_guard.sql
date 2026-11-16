CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "bookings"
ADD CONSTRAINT "bookings_no_approved_time_overlap"
EXCLUDE USING gist (
  "laboratory_id" WITH =,
  tsrange(
    ("booking_date" + "start_time"),
    ("booking_date" + "end_time"),
    '[)'
  ) WITH &&
)
WHERE ("status" IN ('APPROVED', 'BLOCKED'));
