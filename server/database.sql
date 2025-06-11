CREATE DATABASE management_system;

-- Connect to the database
\c management_system;

-- Create customers table
CREATE TABLE customers (
  customer_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100),
  phone_number VARCHAR(20),
  instagram_id VARCHAR(100),
  total_suits INTEGER DEFAULT 0,
  order_date DATE,
  due_date DATE,
  pending_amount DECIMAL(10, 2) DEFAULT 0,
  received_amount DECIMAL(10, 2) DEFAULT 0
);

-- Create customer_measurement_images table
CREATE TABLE customer_measurement_images (
  image_id SERIAL PRIMARY KEY,
  customer_id VARCHAR(50) REFERENCES customers(customer_id) ON DELETE CASCADE,
  image_url VARCHAR(255) NOT NULL
);

-- Create workers table
CREATE TABLE workers (
  worker_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  suits_assigned INTEGER DEFAULT 0
);

-- Create suits table
CREATE TABLE suits (
  suit_id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50) REFERENCES customers(customer_id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'no progress',
  order_date DATE,
  due_date DATE,
  worker_id INTEGER REFERENCES workers(worker_id) ON DELETE SET NULL,
  CONSTRAINT valid_status CHECK (status IN ('no progress', 'work', 'stitching', 'warehouse', 'dispatched', 'completed'))
);

-- Create suit_images table
CREATE TABLE suit_images (
  image_id SERIAL PRIMARY KEY,
  suit_id VARCHAR(50) REFERENCES suits(suit_id) ON DELETE CASCADE,
  image_url VARCHAR(255) NOT NULL
);

-- Create users table for authentication
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  CONSTRAINT valid_role CHECK (role IN ('admin', 'user'))
);

-- Create triggers to update customer's total_suits count
CREATE OR REPLACE FUNCTION update_customer_suits_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE customers
    SET total_suits = total_suits + 1
    WHERE customer_id = NEW.customer_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE customers
    SET total_suits = total_suits - 1
    WHERE customer_id = OLD.customer_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_suit_insert_delete
AFTER INSERT OR DELETE ON suits
FOR EACH ROW
EXECUTE FUNCTION update_customer_suits_count();

-- Create trigger to update worker's suits_assigned count
CREATE OR REPLACE FUNCTION update_worker_suits_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- If worker_id is being set (was NULL before)
    IF NEW.worker_id IS NOT NULL AND OLD.worker_id IS NULL THEN
      UPDATE workers
      SET suits_assigned = suits_assigned + 1
      WHERE worker_id = NEW.worker_id;
    -- If worker_id is being changed
    ELSIF NEW.worker_id IS NOT NULL AND OLD.worker_id IS NOT NULL AND NEW.worker_id != OLD.worker_id THEN
      UPDATE workers
      SET suits_assigned = suits_assigned - 1
      WHERE worker_id = OLD.worker_id;
      
      UPDATE workers
      SET suits_assigned = suits_assigned + 1
      WHERE worker_id = NEW.worker_id;
    -- If worker_id is being removed
    ELSIF NEW.worker_id IS NULL AND OLD.worker_id IS NOT NULL THEN
      UPDATE workers
      SET suits_assigned = suits_assigned - 1
      WHERE worker_id = OLD.worker_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_suit_worker_update
AFTER UPDATE OF worker_id ON suits
FOR EACH ROW
EXECUTE FUNCTION update_worker_suits_count();