
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


## WRITE TIGGER FOR STOCK OUT AND UPDATE REMAINING QUANTITY BY TEMP TABLE
```sql
CREATE TRIGGER after_insert_stock_out
AFTER INSERT ON stock_out FOR EACH ROW

BEGIN
    -- Start a transaction
    START TRANSACTION;

    -- Initialize variables
    SET @dispatch_qty = NEW.stock_out_qty;

    -- Drop the temporary table if it exists
    DROP TEMPORARY TABLE IF EXISTS temp_stock_in;

    -- Create a temporary table to store stock_in entries for the specified product_id
    CREATE TEMPORARY TABLE temp_stock_in AS
        SELECT id, product_id, stock_in_qty, stock_out_qty, remaining_qty, purchase_price, stock_in_date
        FROM stock_in
        WHERE product_id = NEW.product_id
        AND remaining_qty > 0
        ORDER BY id ASC;


    -- Loop through the temporary table and update stock_out_qty in stock_in table
    SET @done = FALSE;

    WHILE @dispatch_qty > 0 AND (SELECT COUNT(*) FROM temp_stock_in) > 0 DO
        -- Get the first row from the temporary table
        SELECT id, remaining_qty INTO @current_id, @current_remaining_qty FROM temp_stock_in LIMIT 1;


        -- Update stock_out_qty and calculate remaining_qty
        IF @current_remaining_qty <= @dispatch_qty THEN
            -- Update stock_out_qty and deduct from dispatch_qty
            UPDATE stock_in
            SET stock_out_qty = stock_out_qty + @current_remaining_qty,
                remaining_qty = remaining_qty - @current_remaining_qty
            WHERE id = @current_id;

            SET @dispatch_qty = @dispatch_qty - @current_remaining_qty;

        ELSEIF @current_remaining_qty >= @dispatch_qty THEN
            -- Update stock_out_qty and remaining_qty, and set dispatch_qty to 0 (done)
            UPDATE stock_in
            SET stock_out_qty = stock_out_qty + @dispatch_qty,
                remaining_qty = remaining_qty - @dispatch_qty
            WHERE id = @current_id;

            SET @dispatch_qty = 0;
            SET @done = TRUE;
        END IF;

        -- Delete the processed row from the temporary table
        DELETE FROM temp_stock_in WHERE id = @current_id;

    END WHILE;

    -- Commit the transaction
    COMMIT;

  -- Drop the temporary table
    DROP TEMPORARY TABLE IF EXISTS temp_stock_in;
END;
```

## UPDATE REMAINING QUANTITY WITHOUT TEMP TABLE
```sql
CREATE TRIGGER update_stock_out
BEFORE INSERT ON stock_out
FOR EACH ROW
BEGIN
    -- Start a transaction
    START TRANSACTION;

    -- Initialize variables
    SET @dispatch_qty = NEW.stock_out_qty;

    -- Loop through stock_in entries for the specified product_id
    SET @done = FALSE;

    WHILE @dispatch_qty > 0 AND NOT @done DO
        -- Get the next row that meets the conditions
        SELECT id, remaining_qty
        INTO @current_id, @current_remaining_qty
        FROM stock_in
        WHERE product_id = NEW.product_id
          AND remaining_qty > 0
        ORDER BY id ASC
        LIMIT 1;

        -- Update stock_out_qty and calculate remaining_qty
        IF @current_remaining_qty <= @dispatch_qty THEN
            -- Update stock_out_qty and deduct from dispatch_qty
            UPDATE stock_in
            SET stock_out_qty = stock_out_qty + @current_remaining_qty,
                remaining_qty = remaining_qty - @current_remaining_qty
            WHERE id = @current_id;

            SET @dispatch_qty = @dispatch_qty - @current_remaining_qty;
        ELSE
            -- Update stock_out_qty and set dispatch_qty to 0 (done)
            UPDATE stock_in
            SET stock_out_qty = stock_out_qty + @dispatch_qty,
                remaining_qty = remaining_qty - @dispatch_qty
            WHERE id = @current_id;

            SET @dispatch_qty = 0;
            SET @done = TRUE;
        END IF;
    END WHILE;

    -- Commit the transaction
    COMMIT;

END;
```




## Update Slug with generate slug form name field

```sql
UPDATE upazilas
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-z0-9]+', '-', 'g'), '^-+|-+$', '', 'g'))
WHERE name IS NOT NULL;
```



## Update field value by REPLACE string

```sql
UPDATE your_table_name
SET your_column_name = REPLACE(your_column_name, 'http://healthms.abubakar.biz/media', 'http://healthms.abubakar.biz/storage')
WHERE your_column_name LIKE 'http://healthms.abubakar.biz/media%';
```




## Get Increment sequences

```sql
SELECT sequence_name
FROM information_schema.sequences;
```

## update sequence

```sql
ALTER SEQUENCE my_sequence INCREMENT BY 10;
```
