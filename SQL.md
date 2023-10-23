
## create enum type on postgresql

```sql
-- Create an enum type
CREATE TYPE examenum AS ENUM ('Type1', 'Type2', 'Type3');

-- Create a table using the enum type
CREATE TABLE your_table_name (
  id serial PRIMARY KEY,
  exam_type examenum NOT NULL DEFAULT 'Type1'
);
```


## create new exam table
```sql
CREATE TYPE examtypeenum AS ENUM ('ENGLISH', 'ACADEMIC');

CREATE SEQUENCE exams_id_seq;

DROP TABLE IF EXISTS "public"."exams" CASCADE;
CREATE TABLE "public"."exams" (
  "id" int4 NOT NULL DEFAULT nextval('exams_id_seq'::regclass),
  "name" text COLLATE "pg_catalog"."default",
  "slug" text COLLATE "pg_catalog"."default",
  "content" text COLLATE "pg_catalog"."default",
  "examType" "public"."examtypeenum" NOT NULL DEFAULT 'ENGLISH'::"examtypeenum",
  "status" "public"."Status" NOT NULL DEFAULT 'ACTIVE'::"Status",
  "createdById" int4,
  "updatedById" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL,
  "deletedAt" timestamp(3)

)
;
ALTER TABLE "public"."exams" OWNER TO "worldunihub";

-- ----------------------------
-- Primary Key structure for table exams
-- ----------------------------
ALTER TABLE "public"."exams" ADD CONSTRAINT "exams_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Foreign Keys structure for table exams
-- ----------------------------
ALTER TABLE "public"."exams" ADD CONSTRAINT "exams_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."exams" ADD CONSTRAINT "exams_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
```



## Create tigger for insert new rows on category table based on jobs

```sql
CREATE OR REPLACE FUNCTION check_category_exists()
RETURNS TRIGGER AS $$
DECLARE 
    category_id BIGINT;

BEGIN
    -- Check if category_title exists
    SELECT id
    INTO category_id
    FROM job_categories
    WHERE title = NEW.category_name;

    -- If category_title does not exist, check category_slug
    IF category_id IS NULL THEN
        SELECT id
        INTO category_id
        FROM job_categories
        WHERE slug = NEW.category_slug;
    END IF;

    -- If category_title or category_slug doesn't exist, insert a new row into job_categories
    IF category_id IS NULL THEN
        INSERT INTO job_categories (title, slug, created_at)
        VALUES (NEW.category_name, NEW.category_slug, NOW())
        RETURNING id INTO category_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER CheckCategoryExists
BEFORE INSERT OR UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION check_category_exists();
```