## Update Purchase Table when purchase item will received

```sql
DELIMITER //
CREATE TRIGGER update_purchase_status
AFTER UPDATE ON purchase_items
FOR EACH ROW
BEGIN
  DECLARE total_rows INT;
  DECLARE received_rows INT;
  
  -- Count the total number of rows with the same purchase_id
  SELECT COUNT(*) INTO total_rows FROM purchase_items WHERE purchase_id = NEW.purchase_id;
  
  -- Count the number of rows with is_received = 1 for the same purchase_id
  SELECT COUNT(*) INTO received_rows FROM purchase_items WHERE purchase_id = NEW.purchase_id AND is_received = 1;
  
  -- If all rows have is_received = 1, update purchases status
  IF total_rows = received_rows THEN
    UPDATE purchases SET status = 'Received' WHERE id = NEW.purchase_id;
  ELSE
    -- If not all rows have is_received = 1, update purchases status to 'pending'
    UPDATE purchases SET status = 'Pending' WHERE id = NEW.purchase_id;
  END IF;
END;
//
DELIMITER ;
```




## Create Tigger after update and after insert using Procedure function

```sql
DELIMITER //
-- Trigger for AFTER INSERT on orderItem
CREATE TRIGGER after_insert_order_item
AFTER INSERT ON orderItem
FOR EACH ROW
BEGIN
  CALL update_order_status(NEW.orderId);
END;
//

-- Trigger for AFTER UPDATE on orderItem
CREATE TRIGGER after_update_order_item
AFTER UPDATE ON orderItem
FOR EACH ROW
BEGIN
  CALL update_order_status(NEW.orderId);
END;
//

-- Procedure to update the OrderTable status
CREATE PROCEDURE update_order_status(IN order_id INT)
BEGIN
  DECLARE total_rows INT;
  DECLARE received_rows INT;
  
  -- Count the total number of rows with the same orderId
  SELECT COUNT(*) INTO total_rows FROM orderItem WHERE orderId = order_id;
  
  -- Count the number of rows with isReceived = 1 for the same orderId
  SELECT COUNT(*) INTO received_rows FROM orderItem WHERE orderId = order_id AND isReceived = 1;
  
  -- If all rows have isReceived = 1, update OrderTable status to 'received'
  IF total_rows = received_rows THEN
    UPDATE OrderTable SET status = 'received' WHERE id = order_id;
  ELSE
    -- If not all rows have isReceived = 1, update OrderTable status to 'pending'
    UPDATE OrderTable SET status = 'pending' WHERE id = order_id;
  END IF;
END;
//
DELIMITER ;

```

## Set Purchase item product unit field value from product unit table
```sql
DELIMITER //
CREATE TRIGGER set_sales_order_items_unit_name
BEFORE INSERT ON `sales_order_items`
FOR EACH ROW
BEGIN
  DECLARE unitValue VARCHAR(255); -- Specify the length for VARCHAR
  
  -- get unit name based on product id
  SELECT product_units.name INTO unitValue FROM products JOIN product_units ON product_units.id = products.product_unit_id WHERE products.id = NEW.product_id;
  
  SET NEW.unit_name = unitValue;
 
END;
//
DELIMITER ;
```


## Update Stock record when insert
```sql
DELIMITER //
CREATE TRIGGER update_inventories_on_stock_insert
AFTER INSERT ON stock_records
FOR EACH ROW
BEGIN
    -- Check if a record exists in inventories for the same product_id and warehouse_id
  DECLARE existingRecord INT;

  SELECT 1 INTO existingRecord
  FROM inventories
  WHERE product_id = NEW.product_id AND warehouse_id = NEW.warehouse_id
  LIMIT 1;

  -- Update existing inventories record if it exists
  IF existingRecord = 1 THEN
    UPDATE inventories
    SET item_in_stock = (
      SELECT COALESCE(SUM(stock_in), 0) - COALESCE(SUM(stock_out), 0)
      FROM stock_records
      WHERE product_id = NEW.product_id AND warehouse_id = NEW.warehouse_id
    ), updated_at = NOW()
    WHERE product_id = NEW.product_id AND warehouse_id = NEW.warehouse_id;

  -- If no record exists, insert a new record
  ELSE 
    INSERT INTO inventories (product_id, warehouse_id, item_in_stock, created_at)
    SELECT NEW.product_id, NEW.warehouse_id, COALESCE(SUM(stock_in), 0) - COALESCE(SUM(stock_out), 0), NOW()
    FROM stock_records
    WHERE product_id = NEW.product_id AND warehouse_id = NEW.warehouse_id
    ON DUPLICATE KEY UPDATE
      item_in_stock = VALUES(item_in_stock);
  END IF;
END;
//
DELIMITER ;


-- updated query --
DELIMITER //
CREATE TRIGGER update_or_insert_inventories_on_stock_insert
AFTER INSERT ON stock_records
FOR EACH ROW
BEGIN
  -- Check if a record exists in inventories for the same product_id and warehouse_id
  DECLARE existingRecord INT;

  SELECT 1 INTO existingRecord
  FROM inventories
  WHERE product_id = NEW.product_id AND warehouse_id = NEW.warehouse_id
  LIMIT 1;

  -- If a record exists, update it
  IF existingRecord = 1 THEN
    UPDATE inventories
    SET item_in_stock = (
      SELECT COALESCE(SUM(stock_in), 0) - COALESCE(SUM(stock_out), 0)
      FROM stock_records
      WHERE product_id = NEW.product_id AND warehouse_id = NEW.warehouse_id
    ), updated_at = NOW()
    WHERE product_id = NEW.product_id AND warehouse_id = NEW.warehouse_id;

  -- If no record exists, insert a new record
  ELSE
    INSERT INTO inventories (product_id, warehouse_id, item_in_stock, created_at, updated_at)
    VALUES (
      NEW.product_id,
      NEW.warehouse_id,
      COALESCE((SELECT SUM(stock_in) FROM stock_records WHERE product_id = NEW.product_id AND warehouse_id = NEW.warehouse_id), 0) -
      COALESCE((SELECT SUM(stock_out) FROM stock_records WHERE product_id = NEW.product_id AND warehouse_id = NEW.warehouse_id), 0),
      NOW(),
      NOW()
    );
  END IF;
END;
//
DELIMITER ;
```



## set stock_record_id on trackable product table

```sql
DELIMITER // 
CREATE TRIGGER update_trackable_items_status
AFTER INSERT ON stock_records
FOR EACH ROW
BEGIN
  -- Update the trackable_items table
  UPDATE trackable_items 
  SET stock_in_date = NEW.stock_in_date, status = 'Stock'
  WHERE purchase_item_id = NEW.purchase_item_id;
END;
//
DELIMITER ;
```