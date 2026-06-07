CREATE UNIQUE INDEX "shifts_one_open_per_register_key"
ON "shifts" ("register_id")
WHERE "status" = 'OPEN';
