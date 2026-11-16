CREATE TABLE "laboratory_assignments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "laboratory_id" uuid NOT NULL REFERENCES "laboratories"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "laboratory_assignments_user_lab_unique" UNIQUE("user_id", "laboratory_id")
);

CREATE INDEX "laboratory_assignments_user_id_idx" ON "laboratory_assignments" ("user_id");
CREATE INDEX "laboratory_assignments_laboratory_id_idx" ON "laboratory_assignments" ("laboratory_id");
