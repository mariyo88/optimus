# Webshop Backend - Development Specification (MVP)

## Overview

Develop a Spring Boot based backend application that will support an e-commerce webshop frontend built with a Bootstrap template.

The initial implementation should focus on:

* Product catalog
* Categories
* Brands
* Product images
* Product specifications
* Shopping cart integration
* Order creation
* Basic administration capabilities
* Future support for distributor imports

The application should be designed as a modular monolith and expose REST APIs consumed by the frontend.

---

# Technology Stack

## Backend

* Java 21
* Spring Boot
* Spring Data JPA
* Spring Security
* PostgreSQL
* Flyway
* Lombok
* Maven

## API

REST API

JSON request/response format

---

# Database Model

## Brand

Represents a product manufacturer.

Fields:

* id
* name
* logo_url
* created_at
* updated_at

---

## Category

Supports category hierarchy.

Fields:

* id
* name
* slug
* parent_id
* created_at
* updated_at

Examples:

* Computers
* Laptops
* Accessories

---

## Product

Main product entity.

Fields:

* id
* sku
* ean
* manufacturer_code
* name
* slug
* short_description
* description
* brand_id
* category_id
* price
* old_price
* stock_quantity
* warranty_months
* weight
* active
* created_at
* updated_at

Requirements:

* Product slug must be unique.
* SKU must be unique.
* EAN should be unique when available.

---

## Product Image

Stores product gallery images.

Fields:

* id
* product_id
* image_url
* sort_order
* is_main

Requirements:

* One image can be marked as the primary image.
* Images should be ordered by sort_order.

---

## Product Specification

Stores technical specifications.

Fields:

* id
* product_id
* specification_name
* specification_value

Examples:

* CPU = Intel i7-13620H
* RAM = 16GB
* SSD = 512GB
* Screen = 14"

Requirements:

* Unlimited specifications per product.
* Specifications displayed in product details page.

---

## Order

Represents customer purchase.

Fields:

* id
* order_number
* customer_name
* customer_email
* customer_phone
* delivery_address
* total_price
* order_status
* created_at
* updated_at

Order statuses:

* CREATED
* CONFIRMED
* PROCESSING
* SHIPPED
* DELIVERED
* CANCELLED

---

## Order Item

Stores ordered products.

Fields:

* id
* order_id
* product_id
* product_name
* product_price
* quantity
* total_price

Requirements:

* Product name and price must be stored at order time.
* Future product changes must not affect historical orders.

---

# Product Details Page Requirements

The backend must provide all data required for a product details page:

## Product Information

* Name
* Price
* Old Price
* Availability
* Category
* Brand
* Description

## Product Gallery

* Main image
* Additional images

## Product Specifications

* Technical characteristics

## Related Products

Return products from the same category.

Maximum:

* 4 products

---

# REST API Endpoints

## Categories

GET /api/categories

Returns category tree.

---

## Products

GET /api/products

Supports:

* category filtering
* keyword search
* pagination
* sorting

Example:

/api/products?category=laptops&page=0&size=20

---

GET /api/products/{slug}

Returns complete product details.

Includes:

* product
* images
* specifications
* category
* brand
* related products

---

## Orders

POST /api/orders

Creates new order.

Request:

* customer information
* ordered items

Response:

* order id
* order number

---

GET /api/orders/{id}

Returns order details.

---

# Administration

## Product Management

Required operations:

* Create product
* Update product
* Delete product
* Activate/deactivate product

---

## Category Management

Required operations:

* Create category
* Update category
* Delete category

---

## Brand Management

Required operations:

* Create brand
* Update brand
* Delete brand

---

## Order Management

Required operations:

* View orders
* Change order status

---

# Security

Administration endpoints must be secured.

Roles:

ROLE_ADMIN

Public endpoints:

* Product listing
* Product details
* Categories
* Order creation

---

# Distributor Import Support

Design solution to support future integrations.

Create generic interface:

ProductImporter

Methods:

* importProducts()

Planned implementations:

* XML Importer
* CSV Importer
* REST API Importer

Imported data should support:

* products
* categories
* prices
* stock quantity
* product images
* specifications

---

# Non-Functional Requirements

* Layered architecture
* DTO based API
* Global exception handling
* Validation on all input requests
* Flyway database migrations
* Swagger/OpenAPI documentation
* Unit tests for service layer
* Integration tests for REST APIs

---

# MVP Scope

Included:

* Product catalog
* Categories
* Brands
* Product images
* Product specifications
* Orders
* Admin management

Excluded:

* Payments
* User accounts
* Wishlist
* Product comparison
* Reviews
* Product variants
* Promotions and coupons

These features will be implemented in future phases.
