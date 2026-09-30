-- HeyGym MVP normalized migration
-- Maps old GymStatus (PENDING,APPROVED,REJECTED,UNDER_REVIEW,SUSPENDED)
-- to new (DRAFT,PENDING_APPROVAL,APPROVED,SUSPENDED).
-- REJECTED -> DRAFT (reason preserved in rejectionReason + audit history).

-- Create new enums
CREATE TYPE "GymStatus_new" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SUSPENDED');
CREATE TYPE "EnquiryStatus" AS ENUM ('NEW', 'READ', 'RESPONDED', 'CLOSED');

-- Alter Gym.status with data mapping
ALTER TABLE "Gym" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Gym" ALTER COLUMN "status" TYPE "GymStatus_new" USING (
  CASE "status"::text
    WHEN 'PENDING' THEN 'DRAFT'::"GymStatus_new"
    WHEN 'REJECTED' THEN 'DRAFT'::"GymStatus_new"
    WHEN 'UNDER_REVIEW' THEN 'PENDING_APPROVAL'::"GymStatus_new"
    WHEN 'APPROVED' THEN 'APPROVED'::"GymStatus_new"
    WHEN 'SUSPENDED' THEN 'SUSPENDED'::"GymStatus_new"
    ELSE 'DRAFT'::"GymStatus_new"
  END
);
ALTER TABLE "Gym" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
DROP TYPE "GymStatus";
ALTER TYPE "GymStatus_new" RENAME TO "GymStatus";

-- User additions
ALTER TABLE "User" ADD COLUMN "phone" TEXT;
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_phone_idx" ON "User"("phone");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_status_idx" ON "User"("status");
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- Gym: add slug nullable for backfill
ALTER TABLE "Gym" ADD COLUMN "slug" TEXT;
-- Backfill slug: slugified name + short id suffix for uniqueness
UPDATE "Gym" SET "slug" = substring(
  lower(regexp_replace(regexp_replace("name", '[^a-zA-Z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g'))
  || '-' || substring("id", 1, 6)
, 1, 160)
WHERE "slug" IS NULL;
-- Ensure uniqueness in case of collision: append row randomness for dups
-- (simple second pass: if duplicate slugs exist, append more of id)
UPDATE "Gym" g SET "slug" = g."slug" || '-' || substring(g."id", 7, 4)
WHERE EXISTS (
  SELECT 1 FROM "Gym" g2 WHERE g2."slug" = g."slug" AND g2."id" < g."id"
);
CREATE UNIQUE INDEX "Gym_slug_key" ON "Gym"("slug");
ALTER TABLE "Gym" ALTER COLUMN "slug" SET NOT NULL;
CREATE INDEX "Gym_ownerId_idx" ON "Gym"("ownerId");
CREATE INDEX "Gym_status_idx" ON "Gym"("status");
CREATE INDEX "Gym_city_idx" ON "Gym"("city");
CREATE INDEX "Gym_slug_idx" ON "Gym"("slug");
CREATE INDEX "Gym_createdAt_idx" ON "Gym"("createdAt");

-- Facility + GymFacility tables
CREATE TABLE "Facility" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "icon" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Facility_name_key" ON "Facility"("name");
CREATE UNIQUE INDEX "Facility_slug_key" ON "Facility"("slug");
CREATE INDEX "Facility_slug_idx" ON "Facility"("slug");
CREATE INDEX "Facility_isActive_idx" ON "Facility"("isActive");

CREATE TABLE "GymFacility" (
  "id" TEXT NOT NULL,
  "gymId" TEXT NOT NULL,
  "facilityId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GymFacility_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GymFacility_gymId_facilityId_key" ON "GymFacility"("gymId", "facilityId");
CREATE INDEX "GymFacility_gymId_idx" ON "GymFacility"("gymId");
CREATE INDEX "GymFacility_facilityId_idx" ON "GymFacility"("facilityId");
ALTER TABLE "GymFacility" ADD CONSTRAINT "GymFacility_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GymFacility" ADD CONSTRAINT "GymFacility_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed canonical facilities
INSERT INTO "Facility" ("id", "name", "slug", "description", "isActive", "createdAt", "updatedAt") VALUES
  ('fac_weight_training', 'Weight Training', 'weight-training', 'Free weights and resistance machines', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('fac_cardio', 'Cardio', 'cardio', 'Treadmills, cycles and cardio equipment', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('fac_crossfit', 'CrossFit', 'crossfit', 'Functional training and CrossFit zone', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('fac_yoga', 'Yoga', 'yoga', 'Yoga and flexibility studio', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('fac_steam_room', 'Steam Room', 'steam-room', 'Steam bath facility', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('fac_sauna', 'Sauna', 'sauna', 'Sauna facility', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('fac_parking', 'Parking', 'parking', 'On-site parking', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('fac_locker', 'Locker', 'locker', 'Secure lockers', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('fac_shower', 'Shower', 'shower', 'Shower and changing rooms', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('fac_personal_trainer', 'Personal Trainer', 'personal-trainer', 'Certified personal trainers', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('fac_ac', 'AC', 'ac', 'Air conditioned facility', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('fac_music', 'Music', 'music', 'Music system', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('fac_wifi', 'WiFi', 'wifi', 'Free WiFi', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Backfill Facility + GymFacility from legacy Gym.facilities String[]
-- Insert any distinct legacy names not in canonical set
INSERT INTO "Facility" ("id", "name", "slug", "isActive", "createdAt", "updatedAt")
SELECT
  ('fac_legacy_' || substr(md5(fname), 1, 16)),
  fname,
  substring(lower(regexp_replace(regexp_replace(fname, '[^a-zA-Z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g')) || '-' || substr(md5(fname),1,6), 1, 120),
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (SELECT DISTINCT unnest("facilities") AS fname FROM "Gym") s
WHERE fname IS NOT NULL AND fname <> ''
ON CONFLICT ("name") DO NOTHING;

-- Link gyms to facilities
INSERT INTO "GymFacility" ("id", "gymId", "facilityId", "createdAt")
SELECT
  ('gf_' || substr(md5("Gym"."id" || f."name"), 1, 20)),
  "Gym"."id",
  fac."id",
  CURRENT_TIMESTAMP
FROM "Gym", unnest("Gym"."facilities") AS f("name")
JOIN "Facility" fac ON fac."name" = f."name"
ON CONFLICT ("gymId", "facilityId") DO NOTHING;

-- Drop legacy facilities column after preservation
ALTER TABLE "Gym" DROP COLUMN "facilities";

-- GymImage -> GymPhoto columns
ALTER TABLE "GymImage" ADD COLUMN "altText" TEXT;
ALTER TABLE "GymImage" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- MembershipPlan: price Float -> Decimal, duration -> durationDays, + features/isActive
ALTER TABLE "MembershipPlan" ADD COLUMN "durationDays" INTEGER;
UPDATE "MembershipPlan" SET "durationDays" = "duration" WHERE "durationDays" IS NULL;
ALTER TABLE "MembershipPlan" ALTER COLUMN "durationDays" SET NOT NULL;
ALTER TABLE "MembershipPlan" DROP COLUMN "duration";
ALTER TABLE "MembershipPlan" ADD COLUMN "features" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "MembershipPlan" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "MembershipPlan" ALTER COLUMN "price" TYPE DECIMAL(10,2) USING "price"::numeric(10,2);
CREATE INDEX "MembershipPlan_gymId_idx" ON "MembershipPlan"("gymId");
CREATE INDEX "MembershipPlan_isActive_idx" ON "MembershipPlan"("isActive");

-- GymHours
CREATE TABLE "GymHours" (
  "id" TEXT NOT NULL,
  "gymId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "openTime" TEXT,
  "closeTime" TEXT,
  "isClosed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GymHours_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GymHours_gymId_dayOfWeek_key" ON "GymHours"("gymId", "dayOfWeek");
CREATE INDEX "GymHours_gymId_idx" ON "GymHours"("gymId");
ALTER TABLE "GymHours" ADD CONSTRAINT "GymHours_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill GymHours from legacy openingTime/closingTime (Mon-Sun same hours, 7 rows per gym with times)
INSERT INTO "GymHours" ("id", "gymId", "dayOfWeek", "openTime", "closeTime", "isClosed", "createdAt", "updatedAt")
SELECT
  ('gh_' || substr(md5("Gym"."id" || gs.d::text), 1, 20)),
  "Gym"."id",
  gs.d,
  "Gym"."openingTime",
  "Gym"."closingTime",
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Gym" CROSS JOIN generate_series(0,6) AS gs(d)
WHERE "Gym"."openingTime" IS NOT NULL OR "Gym"."closingTime" IS NOT NULL
ON CONFLICT ("gymId", "dayOfWeek") DO NOTHING;

-- Favorite
CREATE TABLE "Favorite" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "gymId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Favorite_userId_gymId_key" ON "Favorite"("userId", "gymId");
CREATE INDEX "Favorite_userId_idx" ON "Favorite"("userId");
CREATE INDEX "Favorite_gymId_idx" ON "Favorite"("gymId");
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enquiry
CREATE TABLE "Enquiry" (
  "id" TEXT NOT NULL,
  "gymId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "response" TEXT,
  "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Enquiry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Enquiry_gymId_idx" ON "Enquiry"("gymId");
CREATE INDEX "Enquiry_userId_idx" ON "Enquiry"("userId");
CREATE INDEX "Enquiry_status_idx" ON "Enquiry"("status");
CREATE INDEX "Enquiry_createdAt_idx" ON "Enquiry"("createdAt");
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Review
CREATE TABLE "Review" (
  "id" TEXT NOT NULL,
  "gymId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "title" TEXT,
  "comment" TEXT,
  "isHidden" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Review_userId_gymId_key" ON "Review"("userId", "gymId");
CREATE INDEX "Review_gymId_idx" ON "Review"("gymId");
CREATE INDEX "Review_userId_idx" ON "Review"("userId");
CREATE INDEX "Review_rating_idx" ON "Review"("rating");
ALTER TABLE "Review" ADD CONSTRAINT "Review_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Notification
CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "data" JSONB,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_readAt_idx" ON "Notification"("readAt");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RefreshSession
CREATE TABLE "RefreshSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "ip" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RefreshSession_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RefreshSession_tokenHash_key" ON "RefreshSession"("tokenHash");
CREATE INDEX "RefreshSession_userId_idx" ON "RefreshSession"("userId");
CREATE INDEX "RefreshSession_expiresAt_idx" ON "RefreshSession"("expiresAt");
ALTER TABLE "RefreshSession" ADD CONSTRAINT "RefreshSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AdminAction (canonical audit); preserve existing AuditLog rows
CREATE TABLE "AdminAction" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "targetType" TEXT,
  "targetId" TEXT,
  "reason" TEXT,
  "metadata" JSONB,
  "ip" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAction_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AdminAction_actorId_idx" ON "AdminAction"("actorId");
CREATE INDEX "AdminAction_targetId_idx" ON "AdminAction"("targetId");
CREATE INDEX "AdminAction_action_idx" ON "AdminAction"("action");
CREATE INDEX "AdminAction_createdAt_idx" ON "AdminAction"("createdAt");
ALTER TABLE "AdminAction" ADD CONSTRAINT "AdminAction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "AdminAction" ("id", "actorId", "action", "targetType", "targetId", "reason", "ip", "createdAt")
SELECT a."id", CASE WHEN u."id" IS NULL THEN NULL ELSE a."actorId" END, a."action", a."targetType", a."targetId", a."reason", a."ip", a."createdAt" FROM "AuditLog" a LEFT JOIN "User" u ON u."id" = a."actorId";
